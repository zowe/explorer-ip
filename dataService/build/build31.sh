#!/bin/sh
################################################################################
#  This program and the accompanying materials are
#  made available under the terms of the Eclipse Public License v2.0 which accompanies
#  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
#
#  SPDX-License-Identifier: EPL-2.0
#
#  Copyright Contributors to the Zowe Project.
################################################################################
WORK_DIR=$(cd $(dirname $0);pwd)
mkdir ${WORK_DIR}/tmp 2>/dev/null
cd ${WORK_DIR}/tmp

ZSS="../zss"
ZOWECOMMON="${ZSS}/deps/zowe-common-c"
TARGET="../../../lib/ipExplorer31.so"
LIBDIR=$(dirname "${TARGET}")
mkdir "${LIBDIR}" 2>/dev/null
rm -f "${TARGET}"

if ! c89 -D_OPEN_THREADS -D_XOPEN_SOURCE=600 -DAPF_AUTHORIZED=0 -DNOIBMHTTP \
"-Wa,goff" "-Wc,langlvl(EXTC99),float(HEX),agg,expo,list(),so(),search(),\
goff,xref,gonum,roconst,gonum,asm,asmlib('SYS1.MACLIB'),asmlib('CEE.SCEEMAC'),dll" -Wl,dll \
-I ${ZSS}/h -I ${ZOWECOMMON}/h \
-o "${TARGET}" \
../../src/ipExplorerDataService.c \
../pluginAPI31.x 
then
  echo "ipExplorer31.so build failed"
  RC=8
else
  echo "ipExplorer31.so build successful"
  extattr +p "${TARGET}"
  RC=0
fi

exit $RC
################################################################################
#  This program and the accompanying materials are
#  made available under the terms of the Eclipse Public License v2.0 which accompanies
#  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
#
#  SPDX-License-Identifier: EPL-2.0
#
#  Copyright Contributors to the Zowe Project.
################################################################################
