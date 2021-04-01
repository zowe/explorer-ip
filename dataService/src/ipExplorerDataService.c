

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
#define _OPEN_SYS_SOCK_IPV6

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <fnmatch.h>
#include <ezbnmrhc.h>
#include <ezbnmmpc.h>

#include "httpserver.h"
#include "dataservice.h"
#include "json.h"
#include "http.h"
#include "zis/client.h"
#include "zssLogging.h"


#define NMIBUFSIZE 0x1000
#define NOT_ENOUGH_SPACE 1122
#define MAX_NWM_FILTERS 4

#define FNUMBER1        "1"
#define FNUMBER2        "2"
#define FNUMBER3        "3"
#define FNUMBER4        "4"

#define FCOUNT          "filterCount"

#define FPORTMIN        "fPortMin"
#define FPORTMAX        "fPortMax"
#define FPORTRSVNAME    "fPortRsvName"

#define FAPPLDATA       "fApplData"
#define FASID           "fAsid"
#define FLOCALIP        "fLocalIp"
#define FLOCALIPPREFIX  "fLocalIpPrefix"
#define FLOCALPORT      "fLocalPort"
#define FREMOTEIP       "fRemoteIp"
#define FREMOTEIPPREFIX "fRemoteIpPrefix"
#define FREMOTEPORT     "fRemotePort"
#define FRESOURCEID     "fResourceId"
#define FRESOURCENAME   "fResourceName"
#define FSERVRESOURCEID "fServerResourceId"

#define FFIELDNAME(x,y) x "_" y

#define NMIFILTER(s, n) makeStringParamSpec(FFIELDNAME(FAPPLDATA,s), SERVICE_ARG_OPTIONAL, \
    makeIntParamSpec(FFIELDNAME(FASID,s), SERVICE_ARG_OPTIONAL | SERVICE_ARG_HAS_VALUE_BOUNDS, 0, 0, 1, 65535, \
    makeStringParamSpec(FFIELDNAME(FLOCALIP,s), SERVICE_ARG_OPTIONAL, \
    makeIntParamSpec(FFIELDNAME(FLOCALIPPREFIX,s), SERVICE_ARG_OPTIONAL | SERVICE_ARG_HAS_VALUE_BOUNDS, 0, 0, 0, 128, \
    makeIntParamSpec(FFIELDNAME(FLOCALPORT,s), SERVICE_ARG_OPTIONAL | SERVICE_ARG_HAS_VALUE_BOUNDS, 0, 0, 1, 65535, \
    makeStringParamSpec(FFIELDNAME(FREMOTEIP,s), SERVICE_ARG_OPTIONAL, \
    makeIntParamSpec(FFIELDNAME(FREMOTEIPPREFIX,s), SERVICE_ARG_OPTIONAL | SERVICE_ARG_HAS_VALUE_BOUNDS, 0, 0, 0, 128, \
    makeIntParamSpec(FFIELDNAME(FREMOTEPORT,s), SERVICE_ARG_OPTIONAL | SERVICE_ARG_HAS_VALUE_BOUNDS, 0, 0, 1, 65535, \
    makeIntParamSpec(FFIELDNAME(FRESOURCEID,s), SERVICE_ARG_OPTIONAL, 0, 0, 0, 0, \
    makeStringParamSpec(FFIELDNAME(FRESOURCENAME,s), SERVICE_ARG_OPTIONAL, \
    makeIntParamSpec(FFIELDNAME(FSERVRESOURCEID,s), SERVICE_ARG_OPTIONAL, 0, 0, 0, 0, n \
   )))))))))))

uint64 loggingId;

typedef struct NMIBufferType_tag{
  NWMHeader    header;
  NWMFilter    filters[MAX_NWM_FILTERS];  /* the filters exist in an OR of an AND of the properties in the NWMFilter Object */
} NMIBufferType;

void processApplDataFilter(NWMFilter *filter, HttpRequestParam *parm, int filterNumber) {
  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Http request parameter: %s=%s for filter number %d\n",
          parm->specification->name, parm->stringValue, filterNumber);

  filter->NWMFilterFlags |= NWMFILTERAPPLDATAMASK;
  memset(filter->NWMFilterApplData, ' ', 40);
  if (strlen(parm->stringValue) > 40) {
    zowelog(NULL, loggingId, ZOWE_LOG_WARNING,
          "Http request parameter %s=%s will be truncated.\n",
          parm->specification->name, parm->stringValue);
    memcpy(filter->NWMFilterApplData, parm->stringValue, 40);
  }
  else {
    memcpy(filter->NWMFilterApplData, parm->stringValue, strlen(parm->stringValue));
  }
}

void processAsidFilter(NWMFilter *filter, HttpRequestParam *parm, int filterNumber) {
  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Http request parameter: %s=%d for filter number %d\n",
          parm->specification->name, parm->intValue, filterNumber);

  filter->NWMFilterFlags |= NWMFILTERASIDMASK;
  filter->NWMFilterAsid = parm->intValue;
}

void processIpAddressFilter(NWMFilter *filter, HttpRequestParam *parm, int filterNumber, bool local) {
  int rc;
  struct addrinfo hint, *res = NULL;

  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Http request parameter: %s=%s for filter number %d\n",
          parm->specification->name, parm->stringValue, filterNumber);

  memset(&hint, 0, sizeof hint);
  hint.ai_family = PF_UNSPEC;
  hint.ai_flags = AI_NUMERICHOST;

  rc = getaddrinfo(parm->stringValue, NULL, &hint, &res);
  if (rc) {
    zowelog(NULL, loggingId, ZOWE_LOG_WARNING,
          "Http request parameter error for %s=%s: getaddrinfo() failed with error: %s\n",
          parm->specification->name, parm->stringValue, gai_strerror(rc));
    zowelog(NULL, loggingId, ZOWE_LOG_WARNING, "Filter criterion will not be applied.\n");
    return ;
  }
  if (local) {
    filter->NWMFilterFlags |= NWMFILTERLCLADDRMASK;
    if (res->ai_family == AF_INET)
      memcpy(&filter->NWMFilterLocal.NWMFilterLocalAddr4, res->ai_addr, res->ai_addrlen);
    else
      memcpy(&filter->NWMFilterLocal.NWMFilterLocalAddr6, res->ai_addr, res->ai_addrlen);
  } else {
    filter->NWMFilterFlags |= NWMFILTERRMTADDRMASK;
    if (res->ai_family == AF_INET)
      memcpy(&filter->NWMFilterRemote.NWMFilterRemoteAddr4, res->ai_addr, res->ai_addrlen);
    else
      memcpy(&filter->NWMFilterRemote.NWMFilterRemoteAddr6, res->ai_addr, res->ai_addrlen);
  }

  freeaddrinfo(res);
}

void processIpAddressPrefixFilter(NWMFilter *filter, HttpRequestParam *parm, int filterNumber, bool local) {
  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Http request parameter: %s=%d for filter number %d\n",
          parm->specification->name, parm->intValue, filterNumber);

  if (local) {
    filter->NWMFilterFlags |= NWMFILTERLCLPFXMASK;
    filter->NWMFilterLocalPrefix = parm->intValue;
  } else {
    filter->NWMFilterFlags |= NWMFILTERRMTPFXMASK;
    filter->NWMFilterRemotePrefix = parm->intValue;
  }
}

void processPortFilter(NWMFilter *filter, HttpRequestParam *parm, int filterNumber, bool local) {
  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Http request parameter: %s=%d for filter number %d\n",
          parm->specification->name, parm->intValue, filterNumber);

  if (local) {
    filter->NWMFilterFlags |= NWMFILTERLCLPORTMASK;
    filter->NWMFilterLocal.NWMFilterLocalAddr4.sin_port = parm->intValue;
  } else {
    filter->NWMFilterFlags |= NWMFILTERRMTPORTMASK;
    filter->NWMFilterRemote.NWMFilterRemoteAddr4.sin_port = parm->intValue;
  }
}

void processResourceIdFilter(NWMFilter *filter, HttpRequestParam *parm, int filterNumber) {
  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Http request parameter: %s=%d for filter number %d\n",
          parm->specification->name, parm->intValue, filterNumber);

  filter->NWMFilterFlags |= NWMFILTERRESIDMASK;
  filter->NWMFilterResourceId = parm->intValue;
}

void processResourceNameFilter(NWMFilter *filter, HttpRequestParam *parm, int filterNumber) {
  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Http request parameter: %s=%s for filter number %d\n",
          parm->specification->name, parm->stringValue, filterNumber);

  filter->NWMFilterFlags |= NWMFILTERRESNAMEMASK;
  memset(filter->NWMFilterResourceName, ' ', 8);
  if (strlen(parm->stringValue) > 8) {
    zowelog(NULL, loggingId, ZOWE_LOG_WARNING,
          "Http request parameter %s=%s will be truncated.\n",
          parm->specification->name, parm->stringValue);
    memcpy(filter->NWMFilterResourceName, parm->stringValue, 8);
  }
  else {
    memcpy(filter->NWMFilterResourceName, parm->stringValue, strlen(parm->stringValue));
  }
}

void processServerResourceIdFilter(NWMFilter *filter, HttpRequestParam *parm, int filterNumber) {
  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Http request parameter: %s=%d for filter number %d\n",
          parm->specification->name, parm->intValue, filterNumber);

  filter->NWMFilterFlags |= NWMFILTERLSRESIDMASK;
  filter->NWMFilterListenerId = parm->intValue;
}

void configureNWMFilters(NWMFilter *firstNWMFilter, HttpRequestParam *firstParm, int filterCount) {
  int i, filterNumber;
  char *del;
  HttpRequestParam *parm;

  for (parm = firstParm; parm != NULL; parm = parm->next) {

    // Skip parms:
    //  - not containing the '_' character or
    //  - having a length of a suffix (after the '_') different than 1 or
    //  - with the suffix number which is not inside the <1,4> interval
    // Additionally, a parameter is skipped if the suffix number is greater than "filterCount" parm.
    // A warning message is issued in that case.
    if ((del = strchr(parm->specification->name, '_')) == NULL ||
        parm->specification->name + strlen(parm->specification->name) - (del + 1) != 1 ||
        (filterNumber = atoi(del + 1)) < 1 || filterNumber > 4) {
      continue;
    } else if (filterNumber > filterCount) {
      zowelog(NULL, loggingId, ZOWE_LOG_WARNING,
        "Http request parameter %s is ignored because it does not correspond with the filterCount=%d http request parameter.\n",
        parm->specification->name, filterCount);
      continue;
    }

    if (strncmp(FAPPLDATA, parm->specification->name, strlen(FAPPLDATA)) == 0) {
      processApplDataFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber);
    }
    else if (strncmp(FASID, parm->specification->name, strlen(FASID)) == 0) {
      processAsidFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber);
    }
    else if (strncmp(FLOCALIPPREFIX, parm->specification->name, strlen(FLOCALIPPREFIX)) == 0) {
      processIpAddressPrefixFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber, TRUE);
    }
    else if (strncmp(FLOCALIP, parm->specification->name, strlen(FLOCALIP)) == 0) {
      processIpAddressFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber, TRUE);
    }
    else if (strncmp(FLOCALPORT, parm->specification->name, strlen(FLOCALPORT)) == 0) {
      processPortFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber, TRUE);
    }
    else if (strncmp(FREMOTEIPPREFIX, parm->specification->name, strlen(FREMOTEIPPREFIX)) == 0) {
      processIpAddressPrefixFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber, FALSE);
    }
    else if (strncmp(FREMOTEIP, parm->specification->name, strlen(FREMOTEIP)) == 0) {
      processIpAddressFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber, FALSE);
    }
    else if (strncmp(FREMOTEPORT, parm->specification->name, strlen(FREMOTEPORT)) == 0) {
      processPortFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber, FALSE);
    }
    else if (strncmp(FRESOURCEID, parm->specification->name, strlen(FRESOURCEID)) == 0) {
      processResourceIdFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber);
    }
    else if (strncmp(FRESOURCENAME, parm->specification->name, strlen(FRESOURCENAME)) == 0) {
      processResourceNameFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber);
    }
    else if (strncmp(FSERVRESOURCEID, parm->specification->name, strlen(FSERVRESOURCEID)) == 0) {
      processServerResourceIdFilter(firstNWMFilter + filterNumber - 1, parm, filterNumber);
    }
    else {
      zowelog(NULL, loggingId, ZOWE_LOG_WARNING,
        "Http request parameter %s is not supported.\n", parm->specification->name);
    }
  }
}

int getFilterCount(HttpRequestParam *firstParm) {
  HttpRequestParam *parm;
  for (parm = firstParm; parm != NULL; parm = parm->next) {
    if (strcmp(FCOUNT, parm->specification->name) == 0) {
      zowelog(NULL, loggingId, ZOWE_LOG_DEBUG,
          "Number of NMI filters specified: %d.\n", parm->intValue);
      return parm->intValue;
    }
  }
  return 0;
}

int getPortMinFilter(HttpRequestParam *firstParm) {
  HttpRequestParam *parm;
  for (parm = firstParm; parm != NULL; parm = parm->next) {
    if (strcmp(FPORTMIN, parm->specification->name) == 0) {
      zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Min port filter is set to %d.\n", parm->intValue);
      return parm->intValue;
    }
  }
  return 1;
}

int getPortMaxFilter(HttpRequestParam *firstParm) {
  HttpRequestParam *parm;
  for (parm = firstParm; parm != NULL; parm = parm->next) {
    if (strcmp(FPORTMAX, parm->specification->name) == 0) {
      zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Max port filter is set to %d.\n", parm->intValue);
      return parm->intValue;
    }
  }
  return 65535;
}

char *getRsvNameFilter(HttpRequestParam *firstParm) {
  HttpRequestParam *parm;
  for (parm = firstParm; parm != NULL; parm = parm->next) {
    if (strcmp(FPORTRSVNAME, parm->specification->name) == 0) {
      zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
          "Port reserved name filter is set to %s.\n", parm->stringValue);
      return parm->stringValue;
    }
  }
  return NULL;
}

/* Build and dispatch a request to the NWM service */

NMIBufferType *buildAndExecuteNWMService(int *bufferResponseLength,
                                CrossMemoryServerName *privilegedServerName,
                                char *tcpip,
                                unsigned short nwmRequestType,
                                HttpRequestParam *firstParm) {
  int attempts = 0, i;
  int bufferLength = NMIBUFSIZE;

  while (attempts < 2) {
    NMIBufferType *nmiBuffer = (NMIBufferType *)safeMalloc(bufferLength, "NMI buffer");
    if (nmiBuffer == NULL) {
      *bufferResponseLength = 0;
      return NULL;
    }

    memset(nmiBuffer, 0, sizeof(NMIBufferType));
    NWMFilter *filter = nmiBuffer->filters;
    for (i = 0; i < MAX_NWM_FILTERS; i++, filter++) {
      filter->NWMFilterIdent = NWMFILTERIDENTIFIER;
    }

    *bufferResponseLength = bufferLength;
    /* Fill Header */
    nmiBuffer->header.NWMHeaderIdent=NWMHEADERIDENTIFIER;
    nmiBuffer->header.NWMHeaderLength=sizeof(NWMHeader);
    nmiBuffer->header.NWMVersion=NWMVERSION1;

    nmiBuffer->header.NWMType=nwmRequestType;
    nmiBuffer->header.NWMBytesNeeded=0;
    nmiBuffer->header.NWMInputDataDescriptors.NWMFiltersDesc.NWMTOffset=sizeof(NWMHeader);
    nmiBuffer->header.NWMInputDataDescriptors.NWMFiltersDesc.NWMTLength=sizeof(NWMFilter);
    nmiBuffer->header.NWMInputDataDescriptors.NWMFiltersDesc.NWMTNumber=0;

    int filterCount = getFilterCount(firstParm);

    if (firstParm != NULL && filterCount != 0) {
      nmiBuffer->header.NWMInputDataDescriptors.NWMFiltersDesc.NWMTNumber=filterCount;
      configureNWMFilters(nmiBuffer->filters, firstParm, filterCount);
    }

    int currTraceLevel = logGetLevel(NULL, loggingId);

    zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
            "request buffer:\n");
    zowedump(NULL, loggingId, ZOWE_LOG_DEBUG2,
            (char*)nmiBuffer, sizeof(NWMHeader) + filterCount * sizeof(NWMFilter));

    attempts++;

    ZISNWMJobName jobName;
    memset(jobName.value, 0x40, sizeof(ZISNWMJobName));
    memcpy(jobName.value, tcpip, strlen(tcpip));
    ZISNWMServiceStatus zisStatus = {0};


    int zisRC = zisCallNWMService(privilegedServerName,
                                  jobName, (char *)nmiBuffer, bufferLength,
                                  &zisStatus, currTraceLevel);

    zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
            "ZIS NWM RC = %d, NWM RV = 0x%X,  RC = %d,  RSN = 0x%X\n", zisRC,
            zisStatus.nmiReturnValue,
            zisStatus.nmiReturnCode,
            zisStatus.nmiReasonCode);
    zowedump(NULL, loggingId, ZOWE_LOG_DEBUG3,
            (char*)nmiBuffer, bufferLength);

    if (zisRC != RC_ZIS_SRVC_OK) {

      bool isNWMError =
          (zisRC == RC_ZIS_SRVC_SERVICE_FAILED) &&
          (zisStatus.baseStatus.serviceRC == RC_ZIS_NWMSRV_NWM_FAILED);

      bool isNotEnoughSpace = (zisStatus.nmiReturnValue == -1) &&
                              (zisStatus.nmiReturnCode == NOT_ENOUGH_SPACE);

      if (isNWMError && isNotEnoughSpace){
        int oldBufferLength = bufferLength;
        bufferLength = nmiBuffer->header.NWMBytesNeeded + 0x1000;

        zowelog(NULL, loggingId, ZOWE_LOG_DEBUG2,
                "NWM retry with more space 0x%x\n", bufferLength);
        zowedump(NULL, loggingId, ZOWE_LOG_DEBUG2,
                (char*)nmiBuffer, sizeof(NWMHeader));

        safeFree((char *)nmiBuffer, oldBufferLength);
        nmiBuffer = NULL;
        *bufferResponseLength = 0;

        continue;
      } else {
        /* either ZIS failed or NWM returned an unrecoverable error */
        zowelog(NULL, loggingId, ZOWE_LOG_WARNING,
            "ZIS NWM Request Type = %d, RC = %d, NWM RV = 0x%X,  RC = %d,  RSN = 0x%X\n", nwmRequestType, zisRC,
            zisStatus.nmiReturnValue,
            zisStatus.nmiReturnCode,
            zisStatus.nmiReasonCode);

        safeFree((char *)nmiBuffer, bufferLength);
        nmiBuffer = NULL;
        *bufferResponseLength = 0;
        return NULL;
      }
    } else {
      return nmiBuffer;
    }
  }
  return NULL; // this statement should never be reached;
}

int findTrimmedLength(char *str){
    for (int i = 0; i < 8; i++){
      if (str[i] == ' '){
        return i;
        }
    }
  return 8;
}

extractIPaddressAndPort(struct sockaddr_in *src_addr4,
                        struct sockaddr_in6 *src_addr6,
                        char *dest_address, unsigned short *dest_port) {

  if (src_addr4->sin_family == AF_INET) { // IPV4
    inet_ntop(AF_INET, &src_addr4->sin_addr, dest_address, INET6_ADDRSTRLEN);
    *dest_port = src_addr4->sin_port;
  }
  else { // IPV6
    inet_ntop(AF_INET6, &src_addr6->sin6_addr, dest_address, INET6_ADDRSTRLEN);
    *dest_port = src_addr6->sin6_port;
  }
}

char * convertTcpState(int stateCode) {
  switch(stateCode) {
    case 1:
      return "Closed";
    case 2:
      return "Listen";
    case 3:
      return "Syn-sent";
    case 4:
      return "Syn-received";
    case 5:
      return "Established";
    case 6:
      return "Fin-wait-1";
    case 7:
      return "Fin-wait-2";
    case 8:
      return "Close-wait";
    case 9:
      return "Last-ACK";
    case 10:
      return "Closing";
    case 11:
      return "Time-wait";
    case 12:
      return "Delete-TCB";
    default:
      return "Unknown";
  }
}

char * convertUInt64ToString(unsigned long long stck, char * uint64Buffer) {
  sprintf(uint64Buffer, "%llu", stck);
  return uint64Buffer;
}

int processAndRespondConnections(HttpResponse *response, CrossMemoryServerName *privilegedServerName,
                                char *tcpip) {
  int i;
  void *collectionPointer;
  NWMConnEntry *entryPointer;
  unsigned char *family;
  char localAddress[INET6_ADDRSTRLEN], remoteAddress[INET6_ADDRSTRLEN];
  char uint64Buffer[21];
  unsigned short localPort, remotePort;
  NMIBufferType *respBuffer = NULL; // Make sure the memory pointed by the pointer is released.
  int rbl = 0;       // response buffer length; used for safeFree function

  respBuffer = buildAndExecuteNWMService(&rbl,
                                        privilegedServerName,
                                        strupcase(tcpip),
                                        NWMTCPCONNTYPE,
                                        response->request->processedParamList);
  if (respBuffer == NULL) {
    respondWithJsonError(response, "Check zssServer log for more details", 500, "Internal Server Error");
    return 0;
  }

  unsigned int dataOffset = respBuffer->header.NWMOutputDesc.NWMQOffset;
  unsigned int entryLength = respBuffer->header.NWMOutputDesc.NWMQLength;
  unsigned int totalEntries = respBuffer->header.NWMOutputDesc.NWMQNumber;
  unsigned int filterMatches = respBuffer->header.NWMOutputDesc.NWMQMatch; // not used at this time

  jsonPrinter *p = respondWithJsonPrinter(response);
  setResponseStatus(response, 200, "OK");
  setDefaultJSONRESTHeaders(response);
  writeHeader(response);
  jsonStart(p);
  jsonStartArray(p,"connections");

  for (collectionPointer = (void *)respBuffer + dataOffset, i = 0; i < totalEntries; i++, collectionPointer += entryLength) {

    entryPointer = (NWMConnEntry *) collectionPointer;

    if (entryPointer->NWMConnIdent != NWMTCPCONNIDENTIFIER) { //check eyecatcher "NWMC" for TCP connection response
      zowelog(NULL, loggingId, ZOWE_LOG_DEBUG,
            "NMI TCP Connection response data might be corrupted.\n");
      zowedump(NULL, loggingId, ZOWE_LOG_DEBUG2,
              (char*)collectionPointer - entryLength, 3*entryLength);
      continue;
    }

    extractIPaddressAndPort(&entryPointer->NWMConnLocal.NWMConnLocalAddr4,
                            &entryPointer->NWMConnLocal.NWMConnLocalAddr6,
                            localAddress, &localPort);

    extractIPaddressAndPort(&entryPointer->NWMConnRemote.NWMConnRemoteAddr4,
                            &entryPointer->NWMConnRemote.NWMConnRemoteAddr6,
                            remoteAddress, &remotePort);
    jsonStartObject(p, NULL);
    jsonAddString(p, "localIPaddress",  localAddress);
    jsonAddUInt(p,   "localPort",       localPort);
    jsonAddString(p, "remoteIPaddress", remoteAddress);
    jsonAddUInt(p,   "remotePort",      remotePort);
    jsonAddString(p, "startTime",       convertUInt64ToString(entryPointer->NWMConnStartTime, uint64Buffer));
    jsonAddString(p, "lastActivity",    convertUInt64ToString(entryPointer->NWMConnLastActivity, uint64Buffer));
    jsonAddUInt(p,   "bytesIn",         entryPointer->NWMConnBytesIn);
    jsonAddUInt(p,   "bytesOut",        entryPointer->NWMConnBytesOut);
    jsonAddString(p, "state",           convertTcpState(entryPointer->NWMConnState));
    jsonAddUInt(p,   "asid",            entryPointer->NWMConnAsid);
    jsonAddUInt(p,   "tcb",             entryPointer->NWMConnSubtask);
    jsonAddLimitedString(p, "resourceName", entryPointer->NWMConnResourceName, findTrimmedLength(entryPointer->NWMConnResourceName));
    jsonAddUInt(p,   "resourceID",      entryPointer->NWMConnResourceId);
    jsonEndObject(p);
  }

  jsonEndArray(p);
  jsonEnd(p);

  safeFree((char *)respBuffer, rbl);
  finishResponse(response);

  return 0;
}

int processAndRespondListeners(HttpResponse *response, CrossMemoryServerName *privilegedServerName,
                                char *tcpip) {
  int i;
  void *collectionPointer;
  NWMTCPListenEntry *entryPointer;
  unsigned char *family;
  char localAddress[INET6_ADDRSTRLEN];
  char uint64Buffer[21];
  unsigned short localPort;
  NMIBufferType *respBuffer = NULL; // Make sure the memory pointed by the pointer is released.
  int rbl = 0;       // response buffer length; used for safeFree function

  respBuffer = buildAndExecuteNWMService(&rbl,
                                        privilegedServerName,
                                        strupcase(tcpip),
                                        NWMTCPLISTENTYPE,
                                        response->request->processedParamList);
  if (respBuffer == NULL) {
    respondWithJsonError(response, "Check zssServer log for more details", 500, "Internal Server Error");
    return 0;
  }

  unsigned int dataOffset = respBuffer->header.NWMOutputDesc.NWMQOffset;
  unsigned int entryLength = respBuffer->header.NWMOutputDesc.NWMQLength;
  unsigned int totalEntries = respBuffer->header.NWMOutputDesc.NWMQNumber;
  unsigned int filterMatches = respBuffer->header.NWMOutputDesc.NWMQMatch; // not used at this time

  jsonPrinter *p = respondWithJsonPrinter(response);
  setResponseStatus(response, 200, "OK");
  setDefaultJSONRESTHeaders(response);
  writeHeader(response);
  jsonStart(p);
  jsonStartArray(p,"listeners");

  for (collectionPointer = (void *)respBuffer + dataOffset, i = 0; i < totalEntries; i++, collectionPointer += entryLength) {

    entryPointer = (NWMTCPListenEntry *) collectionPointer;

    if (entryPointer->NWMTCPLIdent != NWMTCPLISTENIDENTIFIER) { //check eyecatcher "NWMT" for TCP listeners response
      zowelog(NULL, loggingId, ZOWE_LOG_DEBUG,
            "NMI TCP Listener response data might be corrupted.\n");
      zowedump(NULL, loggingId, ZOWE_LOG_DEBUG2,
              (char*)collectionPointer - entryLength, 3*entryLength);
      continue;
    }

    extractIPaddressAndPort(&entryPointer->NWMTCPLLocal.NWMTCPLLocalAddr4,
                            &entryPointer->NWMTCPLLocal.NWMTCPLLocalAddr6,
                            localAddress, &localPort);

    jsonStartObject(p, NULL);
    jsonAddString(p, "localIPaddress",      localAddress);
    jsonAddUInt(p,   "localPort",           localPort);

    entryPointer->NWMTCPLSockOpt6 & NWMTCPLSOCKOPT_V6ONLY ?
    jsonAddBoolean(p, "v6onlySocket", TRUE) :
    jsonAddBoolean(p, "v6onlySocket", FALSE);

    jsonAddString(p, "startTime",           convertUInt64ToString(entryPointer->NWMTCPLStartTime, uint64Buffer));
    jsonAddString(p, "lastActivity",        convertUInt64ToString(entryPointer->NWMTCPLLastActivity, uint64Buffer));
    jsonAddString(p, "lastReject",          convertUInt64ToString(entryPointer->NWMTCPLLastReject, uint64Buffer));
    jsonAddUInt(p,   "connsAccepted",       entryPointer->NWMTCPLAcceptCount);
    jsonAddUInt(p,   "connsDropped",        entryPointer->NWMTCPLExceedBacklog);
    jsonAddUInt(p,   "connsInBacklog",      entryPointer->NWMTCPLCurrBacklog);
    jsonAddUInt(p,   "maxBacklogAllow",     entryPointer->NWMTCPLMaxBacklog);
    jsonAddUInt(p,   "currentConns",        entryPointer->NWMTCPLCurrActive);
    jsonAddUInt(p,   "estabConnsInBacklog", entryPointer->NWMTCPLEstabBacklog);
    jsonAddUInt(p,   "asid",                entryPointer->NWMTCPLAsid);
    jsonAddUInt(p,   "tcb",                 entryPointer->NWMTCPLSubtask);
    jsonAddLimitedString(p, "resourceName", entryPointer->NWMTCPLResourceName, findTrimmedLength(entryPointer->NWMTCPLResourceName));
    jsonAddUInt(p,   "resourceID",          entryPointer->NWMTCPLResourceID);
    jsonEndObject(p);
  }

  jsonEndArray(p);
  jsonEnd(p);

  safeFree((char *)respBuffer, rbl);
  finishResponse(response);

  return 0;
}

NWMRecHeader *getFirstNWMRHeader(NMIBufferType *respBuffer, int *NWMRHeaderCount) {
  NWMRecHeader *recHeader;
  void *buffPointer;

  // Navigate to the first NWMRecHeader (NWMR)
  buffPointer = (void *)respBuffer + respBuffer->header.NWMOutputDesc.NWMQOffset;
  recHeader = (NWMRecHeader *) buffPointer;
  // validity check
  if (recHeader->NWMRecHdrIdent != NWMRECHDRIDENTIFIER) {
    zowelog(NULL, loggingId, ZOWE_LOG_DEBUG,
            "NWMR header is invalid.\n");
    return NULL;
  } else {
    *NWMRHeaderCount = respBuffer->header.NWMOutputDesc.NWMQNumber;
    return recHeader;
  }
}

void *locateProfileDataSection(NMIBufferType *respBuffer, int sectionDescIndex, int *sectionEntryCount) {

  int NWMRHeaderCount;   // Should be always 1 for the Profile request type
  NWMRecHeader *recHeader;
  NWMTriplet *sectionTriplet;

  // Get the NWMRecHeader (NWMR)
  recHeader = getFirstNWMRHeader(respBuffer, &NWMRHeaderCount);
  // validity check
  if (recHeader == NULL || recHeader->NWMRecNumber != NWMRECNUMPROFILE) {
    zowelog(NULL, loggingId, ZOWE_LOG_DEBUG,
            "NMI TCPIP profile response is invalid.\n");
    return NULL;
  }
  // locate triplet of a desired section
  sectionTriplet = (NWMTriplet *) ((void *)recHeader + sizeof(NWMRecHeader) + sectionDescIndex * sizeof(NWMTriplet));
  // set a number of sections and return a pointer to the beginning of the first section
  *sectionEntryCount = sectionTriplet->NWMTNumber;
  return (void *)recHeader + sectionTriplet->NWMTOffset;
}

// if IPv6 is enabled then IPv6 loopback interface always exists
int existsIPv6LoobpackInterface(NWMRecHeader *ifNWMRHeader, int ifsEntryCount) {
  int i;
  void *iterationPointer;
  NWMTriplet *ifSectionTriplet;
  NWMRecHeader *currentIfNWMRHeader;
  NWMIfEntry *interfaceSection;

  iterationPointer = (void *)ifNWMRHeader;

  for (i = 0; i < ifsEntryCount; i++) {
    currentIfNWMRHeader = (NWMRecHeader *) iterationPointer;

    ifSectionTriplet = (NWMTriplet *)(iterationPointer + sizeof(NWMRecHeader));
    interfaceSection = (NWMIfEntry *)(iterationPointer + ifSectionTriplet->NWMTOffset);

    if (interfaceSection->NWMIfIdent == NWMIFIDENTIFIER &&
        interfaceSection->NWMIfFlags & NWMIFIPV6 &&
        interfaceSection->NWMIfType == NWMIFTLOOPB ) {
      return TRUE;
    }
    iterationPointer += currentIfNWMRHeader->NWMRecLength;
  }
  return FALSE;
}

int processAndRespondInfo(HttpResponse *response, CrossMemoryServerName *privilegedServerName,
                                char *tcpip) {
  char uint64Buffer[21];
  int commonEntryCount, ifNWMRHeaderCount;
  NMTP_PICommon *commonSection;      // pointer to first common section
  NWMRecHeader *firstIfNWMRHeader;   // pointer to first NWMR interface section
  NMIBufferType *respBufProf = NULL; // Make sure the memory pointed by the pointer is released.
  NMIBufferType *respBufIf = NULL;   // Make sure the memory pointed by the pointer is released.
  int rblp = 0, rbli = 0;       // response buffer length; used for safeFree function

  respBufProf = buildAndExecuteNWMService(&rblp,
                                        privilegedServerName,
                                        strupcase(tcpip),
                                        NWMPROFILETYPE,
                                        NULL);

  if (respBufProf == NULL) {
    respondWithJsonError(response, "Check zssServer log for more details", 500, "Internal Server Error");
    return 0;
  }
  respBufIf = buildAndExecuteNWMService(&rbli,
                                        privilegedServerName,
                                        strupcase(tcpip),
                                        NWMIFSTYPE,
                                        NULL);
  if (respBufIf == NULL) {
    safeFree((char *)respBufProf, rblp);
    respondWithJsonError(response, "Check zssServer log for more details", 500, "Internal Server Error");
    return 0;
  }

  commonSection = (NMTP_PICommon *) locateProfileDataSection(respBufProf, NWMP_SEC_PICO, &commonEntryCount);
  if (commonSection == NULL || commonSection->NMTP_PICOEye != NMTP_PICOEYEC) {
    safeFree((char *)respBufProf, rblp);
    safeFree((char *)respBufIf, rbli);
    respondWithJsonError(response, "Check zssServer log for more details", 500, "Internal Server Error");
    return 0;
  }

  firstIfNWMRHeader = getFirstNWMRHeader(respBufIf, &ifNWMRHeaderCount);
  if (firstIfNWMRHeader == NULL) {
    safeFree((char *)respBufProf, rblp);
    safeFree((char *)respBufIf, rbli);
    respondWithJsonError(response, "Check zssServer log for more details", 500, "Internal Server Error");
    return 0;
  }

  jsonPrinter *p = respondWithJsonPrinter(response);
  setResponseStatus(response, 200, "OK");
  setDefaultJSONRESTHeaders(response);
  writeHeader(response);
  jsonStart(p);
  jsonStartObject(p, "info");

  jsonAddString(p, "stackStartTime", convertUInt64ToString(*((NWM_ull *)commonSection->NMTP_PICOStartTime), uint64Buffer));

  existsIPv6LoobpackInterface(firstIfNWMRHeader, ifNWMRHeaderCount) ?
  jsonAddBoolean(p, "IPv6Enabled", TRUE) : jsonAddBoolean(p, "IPv6Enabled", FALSE);

  jsonEndObject(p);
  jsonEnd(p);

  safeFree((char *)respBufProf, rblp);
  safeFree((char *)respBufIf, rbli);

  finishResponse(response);

  return 0;
}

int processAndRespondPorts(HttpResponse *response, CrossMemoryServerName *privilegedServerName,
                                char *tcpip) {
  int i, portEntryCount;
  int rbl = 0;       // response buffer length; used for safeFree function
  void *collectionPointer;
  char localAddress[INET6_ADDRSTRLEN];
  unsigned short localPort;
  char jobname[9], safname[9];
  NMTP_PORT *portSection;
  NMIBufferType *respBuffer = NULL; // Make sure the memory pointed by the pointer is released.

  respBuffer = buildAndExecuteNWMService(&rbl,
                                        privilegedServerName,
                                        strupcase(tcpip),
                                        NWMPROFILETYPE,
                                        NULL);
  if (respBuffer == NULL) {
    respondWithJsonError(response, "Check zssServer log for more details", 500, "Internal Server Error");
    return 0;
  }

  portSection = (NMTP_PORT *) locateProfileDataSection(respBuffer, NWMP_SEC_PORT, &portEntryCount);
  if (portSection == NULL || portSection->NMTP_PORTEye != NMTP_PORTEYEC) {
    safeFree((char *)respBuffer, rbl);
    respondWithJsonError(response, "Check zssServer log for more details", 500, "Internal Server Error");
    return 0;
  }

  int portMinFilter = getPortMinFilter(response->request->processedParamList);
  int portMaxFilter = getPortMaxFilter(response->request->processedParamList);
  char *portRsvName = getRsvNameFilter(response->request->processedParamList);

  if (strlen(portRsvName) > 8) {
    safeFree((char *)respBuffer, rbl);
    respondWithJsonError(response, FPORTRSVNAME " parameter exceeded the allowable length (8 chars).", 500,
                                   "Internal Server Error");
    return 0;
  }

  jsonPrinter *p = respondWithJsonPrinter(response);
  setResponseStatus(response, 200, "OK");
  setDefaultJSONRESTHeaders(response);
  writeHeader(response);
  jsonStart(p);
  jsonStartArray(p,"ports");

  for (i = 0; i < portEntryCount; i++, portSection++ ) {

    if (portSection->NMTP_PORTEye != NMTP_PORTEYEC) { //check eyecatcher "NWMC" for TCP connection response
      zowelog(NULL, loggingId, ZOWE_LOG_DEBUG,
            "NMI Profile Port response data might be corrupted.\n");
      zowedump(NULL, loggingId, ZOWE_LOG_DEBUG,
              (char*)portSection - sizeof(NMTP_PORT), 3*sizeof(NMTP_PORT));
      continue;
    }
    // Evaluate portMin and portMax filters
    if ((portSection->NMTP_PORTBegNum < portMinFilter || portSection->NMTP_PORTBegNum > portMaxFilter) &&
        (portSection->NMTP_PORTEndNum < portMinFilter || portSection->NMTP_PORTEndNum > portMaxFilter)) {
      continue;
    }
    // Evaluate portRsvName filter
    memset(jobname, 0, 9);
    memset(safname, 0, 9);
    memcpy(jobname, portSection->NMTP_PORTJobName, findTrimmedLength(portSection->NMTP_PORTJobName));
    memcpy(safname, portSection->NMTP_PORTSafName, findTrimmedLength(portSection->NMTP_PORTSafName));

    if (portRsvName != NULL &&
        fnmatch(portRsvName, jobname, FNM_NOESCAPE) != 0 &&
        fnmatch(portRsvName, safname, FNM_NOESCAPE) != 0) {
      continue;
    }

    jsonStartObject(p, NULL);

    jsonAddUInt(p,   "portNumber",    portSection->NMTP_PORTBegNum);
    jsonAddUInt(p,   "portNumberEnd", portSection->NMTP_PORTEndNum);

    jsonAddLimitedString(p, "jobname",     portSection->NMTP_PORTJobName, findTrimmedLength(portSection->NMTP_PORTJobName));
    jsonAddLimitedString(p, "safname",     portSection->NMTP_PORTSafName, findTrimmedLength(portSection->NMTP_PORTSafName));

    jsonStartObject(p, "flags");
    portSection->NMTP_PORTFlags & NMTP_PORTIPV6
      ? jsonAddBoolean(p, "IPV6", TRUE)
      : jsonAddBoolean(p, "IPV6", FALSE);
    portSection->NMTP_PORTFlags & NMTP_PORTRANGE
      ? jsonAddBoolean(p, "RANGE", TRUE)
      : jsonAddBoolean(p, "RANGE", FALSE);
    portSection->NMTP_PORTFlags & NMTP_PORTUNRSV
      ? jsonAddBoolean(p, "UNRSV", TRUE)
      : jsonAddBoolean(p, "UNRSV", FALSE);
    portSection->NMTP_PORTFlags & NMTP_PORTTCP
      ? jsonAddBoolean(p, "TCP", TRUE)
      : jsonAddBoolean(p, "TCP", FALSE);
    jsonEndObject(p);

    jsonStartObject(p, "useType");
    if (portSection->NMTP_PORTUseType == NMTP_PORTUTRESERVED) {
      jsonAddBoolean(p, "RESERVED", TRUE);
    } else {
      jsonAddBoolean(p, "RESERVED", FALSE);
    }
    if (portSection->NMTP_PORTUseType == NMTP_PORTUTAUTHPORT) {
      jsonAddBoolean(p, "AUTHPORT", TRUE);
    } else {
      jsonAddBoolean(p, "AUTHPORT", FALSE);
    }
    if (portSection->NMTP_PORTUseType == NMTP_PORTUTJOBNAME) {
      jsonAddBoolean(p, "JOBNAME", TRUE);
    } else {
      jsonAddBoolean(p, "JOBNAME", FALSE);
    }
    jsonEndObject(p);

    jsonStartObject(p, "rsvOptions");
    portSection->NMTP_PORTRsvOptions & NMTP_PORTRAUTOLOG
      ? jsonAddBoolean(p, "AUTOLOG", TRUE)
      : jsonAddBoolean(p, "AUTOLOG", FALSE);
    portSection->NMTP_PORTRsvOptions & NMTP_PORTRDELAYACKS
      ? jsonAddBoolean(p, "DELAYACKS", TRUE)
      : jsonAddBoolean(p, "DELAYACKS", FALSE);
    portSection->NMTP_PORTRsvOptions & NMTP_PORTRSHAREPORT
      ? jsonAddBoolean(p, "SHAREPORT", TRUE)
      : jsonAddBoolean(p, "SHAREPORT", FALSE);
    portSection->NMTP_PORTRsvOptions & NMTP_PORTRSHAREPORTWLM
      ? jsonAddBoolean(p, "SHAREPORTWLM", TRUE)
      : jsonAddBoolean(p, "SHAREPORTWLM", FALSE);
    portSection->NMTP_PORTRsvOptions & NMTP_PORTRBIND
      ? jsonAddBoolean(p, "BIND", TRUE)
      : jsonAddBoolean(p, "BIND", FALSE);
    portSection->NMTP_PORTRsvOptions & NMTP_PORTRSAF
      ? jsonAddBoolean(p, "SAF", TRUE)
      : jsonAddBoolean(p, "SAF", FALSE);
    portSection->NMTP_PORTRsvOptions & NMTP_PORTRNOSMC
      ? jsonAddBoolean(p, "NOSMC", TRUE)
      : jsonAddBoolean(p, "NOSMC", FALSE);
    portSection->NMTP_PORTRsvOptions & NMTP_PORTRNOSMCR
      ? jsonAddBoolean(p, "NOSMCR", TRUE)
      : jsonAddBoolean(p, "NOSMCR", FALSE);
    jsonEndObject(p);

    jsonStartObject(p, "unrsvOptions");
    portSection->NMTP_PORTUnrsvOptions & NMTP_PORTUDENY
      ? jsonAddBoolean(p, "DENY", TRUE)
      : jsonAddBoolean(p, "DENY", FALSE);
    portSection->NMTP_PORTUnrsvOptions & NMTP_PORTUSAF
      ? jsonAddBoolean(p, "SAF", TRUE)
      : jsonAddBoolean(p, "SAF", FALSE);
    portSection->NMTP_PORTUnrsvOptions & NMTP_PORTUWHENLISTEN
      ? jsonAddBoolean(p, "WHENLISTEN", TRUE)
      : jsonAddBoolean(p, "WHENLISTEN", FALSE);
    portSection->NMTP_PORTUnrsvOptions & NMTP_PORTUWHENBIND
      ? jsonAddBoolean(p, "WHENBIND", TRUE)
      : jsonAddBoolean(p, "WHENBIND", FALSE);
    jsonEndObject(p);

    if(portSection->NMTP_PORTRsvOptions & NMTP_PORTRBIND){
      if(portSection->NMTP_PORTFlags & NMTP_PORTIPV6){
        char str[INET6_ADDRSTRLEN];
        inet_ntop(AF_INET6, &portSection->NMTP_PORTBindAddr.NMTP_PORTBindAddr6, str, INET6_ADDRSTRLEN);
        jsonAddString(p, "bindAddr", str);
      } else {
        char str[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &portSection->NMTP_PORTBindAddr.NMTP_PORTBindAddr4, str, INET_ADDRSTRLEN);
        jsonAddString(p, "bindAddr", str);
      }
    } else {
      jsonAddString(p, "bindAddr", "");
    }

    jsonEndObject(p);
  }

  jsonEndArray(p);
  jsonEnd(p);

  safeFree((char *)respBuffer, rbl);
  finishResponse(response);

  return 0;
}

/* High-level function to serve HTTP requests */
static int serveMappingService(HttpService *service, HttpResponse *response) {
  CrossMemoryServerName *privilegedServerName;

  HttpRequest *request = response->request;
  char *tcpip = stringListPrint(request->parsedFile, service->parsedMaskPartCount, 1, "/", 0);        // extract TCPIP name from the HTTP request
  char *requestType = stringListPrint(request->parsedFile, service->parsedMaskPartCount + 1, 1, "/", 0);  // extract NWM request type from the HTTP request

  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG,
          "Selected TCPIP stack is %s\n", tcpip);

  zowelog(NULL, loggingId, ZOWE_LOG_DEBUG,
          "The request type is: %s\n", requestType);

  // Validate tcpip parameter
  if (strlen(tcpip) > 8) {
    respondWithJsonError(response, "Tcpip name is too long", 400, "Bad Request");
    return 0;
  }
  // Get Zis server name
  privilegedServerName = getConfiguredProperty(service->server,
      HTTP_SERVER_PRIVILEGED_SERVER_PROPERTY);

  // Handle HTTP methods
  if (strcasecmp(request->method, methodGET) == 0) {
    // Process "connections" request type
    if (strcasecmp("connections", requestType) == 0) {
      processAndRespondConnections(response, privilegedServerName, strupcase(tcpip));
    }
    // Process "connections" request type
    else if (strcasecmp("ports", requestType) == 0) {
      processAndRespondPorts(response, privilegedServerName, strupcase(tcpip));
    }
    // Process "listeners" request type
    else if (strcasecmp("listeners", requestType) == 0) {
      processAndRespondListeners(response, privilegedServerName, strupcase(tcpip));
    }
    // Process "info" request type
    else if (strcasecmp("info", requestType) == 0) {
      processAndRespondInfo(response, privilegedServerName, strupcase(tcpip));
    }
    else {
      respondWithJsonError(response, "Endpoint not found.", 404, "Not Found");
      return 0;
    }
  }
  else {
    jsonPrinter *p = respondWithJsonPrinter(response);

    setResponseStatus(response, 405, "Method Not Allowed");
    setDefaultJSONRESTHeaders(response);
    addStringHeader(response, "Allow", "GET");
    writeHeader(response);

    jsonStart(p);
    {
      jsonAddString(p, "error", "Only GET requests are supported");
    }
    jsonEnd(p);
    finishResponse(response);
  }
  return 0;
}

void ipExplorerDataServiceInstaller(DataService *dataService, HttpServer *server)
{
  HttpService *httpService = makeHttpDataService(dataService, server);
  httpService->authType = SERVICE_AUTH_NATIVE_WITH_SESSION_TOKEN;
  httpService->serviceFunction = serveMappingService;
  httpService->runInSubtask = TRUE;
  httpService->doImpersonation = FALSE;

  // Maximum number of filters for NMI (NWM) service is 4 filters.
  httpService->paramSpecList =  makeStringParamSpec(FPORTRSVNAME, SERVICE_ARG_OPTIONAL, \
                                makeIntParamSpec(FCOUNT, SERVICE_ARG_OPTIONAL | SERVICE_ARG_HAS_VALUE_BOUNDS, 0, 0, 0, 4,
                                makeIntParamSpec(FPORTMIN, SERVICE_ARG_OPTIONAL | SERVICE_ARG_HAS_VALUE_BOUNDS, 0, 0, 1, 65535,
                                makeIntParamSpec(FPORTMAX, SERVICE_ARG_OPTIONAL | SERVICE_ARG_HAS_VALUE_BOUNDS, 0, 0, 1, 65535,
                                NMIFILTER(FNUMBER1,
                                NMIFILTER(FNUMBER2,
                                NMIFILTER(FNUMBER3,
                                NMIFILTER(FNUMBER4, NULL))))))));

  loggingId = dataService->loggingIdentifier;

}

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

