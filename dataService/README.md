# Description
The source code and build instructions for network data service in ZSS.

# Steps To Build
- In the `build/` directory, git clone https://github.com/zowe/zss/ OR create a symbolic link to already existing zss repository, e.g. using `ln -s /path/to/existing/zss build/zss`.
- Run the `build/build.sh` script.
- The build should succeed and create a /lib folder in the git root directory, which contains a compiled dll (.so).

# File Structure Example
install-dir
- dataService
    - build
        - build.sh
        - pluginAPI.x
        - tmp
        - zss
    - deploy.sh
    - src
        - ipExplorerDataService.c
- lib
    - ipExplorer.so
- pluginDefinition.json
- webClient
- ...

# Filtering
Filters are supported for `connections`, `listeners` and `ports` endpoints of the explorer-ip data service. Filters are passed to the data service as HTTP GET request parameters, e.g. <code>ht<span>tp://</span>example.com<b>?filter1=foo&filter2=bar</b></code> where two parameters are specified, the `filter1` parameter with the `foo` value and the `filter2` parameter with the `bar` value.

## Filters for connections and listeners endpoints
Filtering for `connections` and `listeners` is designed to be consistent with the filtering that is supported in the EZBNMIFR callable interface (https://www.ibm.com/support/knowledgecenter/SSLTBW_2.4.0/com.ibm.zos.v2r4.halx001/filterrs.htm). The HTTP filter parameters are processed in the data service so that they can be passed further into EZBNMIFR where actual filtering is done.

As described in the [link](https://www.ibm.com/support/knowledgecenter/SSLTBW_2.4.0/com.ibm.zos.v2r4.halx001/filterrs.htm), you can specify up to 4 filter elements. Such filter elements are in the logical OR relation if more than one filter element is specified. Each filter element consists of filter items (filter items might differ for different request types - endpoints). These filter items are in the logical AND relation (within a filter element).

You have to specify a number of filter elements using the `filterCount` parameter. A filter item is associated to a certain filter element using appended number in the filter item name. For example,
```
http://localhost:8542?filterCount=2&fLocalIp_1=127.0.0.1&fLocalPort_1=8542&fResourceName_2=FTP*
```
where we specify two filter elements. The first filter element consists of two filter items, `fLocalIp_1` and `fLocalPort_1`. The appended `_1` denotes the relation to a first filter element. Connections data that match both specified filter items of the first filter element will be returned. In this example, connections with the local IP address 127.0.0.1 and the local port 8542 will be returned.

Similarly, the second filter element which consists of the `fResourceName_2` filter item causes all connections with a resource name beginning with the `FTP` string to be also returned.

**Edge cases:**
- If you specify a filter element which doesn't have any filter item specified then all the data will be matched by such a filter element causing all the data will be returned (for example, let's have `filterCount=2` and `fLocalPort_1=21`; in this example, we specify two filter elements but we provide filter items only for one which causes all the data will be matched by the filter with no criteria). This behaviour is consistent with the [EZBNMIFR](https://www.ibm.com/support/knowledgecenter/SSLTBW_2.4.0/com.ibm.zos.v2r4.halx001/filterrs.htm) filtering.
- If you specify filter item(s) for a filter element that is not reflected by the `filterCount` parameter then the filter item(s) are ignored (for example, let's have `filterCount=1`, `fLocalPort_1=21` and `fRemotePort_2=1234`; in this example, `fRemotePort_2` parameter will be ignored).

### Conections filters
A list of filter items supported by the `connections` request type:
```
fApplData
fAsid
fLocalIp
fLocalIpPrefix
fLocalPort
fRemoteIp
fRemoteIpPrefix
fRemotePort
fResourceId
fResourceName
fServerResourceId
```
The `_1`, `_2`, `_3` or `_4` suffix has to be appended to keywords above to create a valid filter item. A detailed description of the filter items can be found [here](https://www.ibm.com/support/knowledgecenter/SSLTBW_2.4.0/com.ibm.zos.v2r4.halx001/filterrs.htm).

### Listeners filters
A list of filter items supported by the `listeners` request type:
```
fApplData
fAsid
fLocalIp
fLocalIpPrefix
fLocalPort
fResourceId
fResourceName
```
The `_1`, `_2`, `_3` or `_4` suffix has to be appended to keywords above to create a valid filter item. A detailed description of the filter items can be found [here](https://www.ibm.com/support/knowledgecenter/SSLTBW_2.4.0/com.ibm.zos.v2r4.halx001/filterrs.htm).

## Filters for ports endpoint
Filtering for `ports` request type is performed directly in the data service. The `ports` endpoint supports three filter criteria:
```
fPortMin
fPortMax
fPortRsvName
```
If the `fPortMin` filter is used and set to a number in <1, 65535> interval then the request returns results whose `portNumber` attribute value is equal or greater than `fPortMin` value. In case of a result object containing a port range, the `portNumberEnd` attribute is also evaluated by the filter in the same way as for the `portNumber` attribute.

If the `fPortMax` filter is used and set to a number in <1, 65535> interval then the request returns results whose `portNumber` attribute value is equal or lower than `fPortMax` value. In case of a result object containing a port range, the `portNumberEnd` attribute is also evaluated by the filter in the same way as for the `portNumber` attribute.

The `fPortRsvName` filter is to be set to a string that has up to 8 characters. The filter is matched with the `jobname` and `safname` attributes of a result object. The filter string can contain `*` (represents zero or more characters) and `?` (represents exactly one character) wildcards.

# Troubleshooting
To turn on logging, add the following snippet into your zluxserver.json file:

```
"logLevels": {
   "org.zowe.explorer-ip": 4
}
```

The number after the plugin identifier represents the level of logging. This is read into the server at startup.