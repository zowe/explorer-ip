#!/bin/sh -e
set -x

################################################################################
# This program and the accompanying materials are made available under the terms of the
# Eclipse Public License v2.0 which accompanies this distribution, and is available at
# https://www.eclipse.org/legal/epl-v20.html
#
# SPDX-License-Identifier: EPL-2.0
#
# Copyright IBM Corporation 2021
################################################################################

# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

#content tagging of web folder if not already
echo "[${SCRIPT_NAME}] tagging web folder as content"
cd content
chtag -Rtc IBM-1047 web
cd web/assets
chtag -b icon.png

# build dataService
echo "[${SCRIPT_NAME}] building dataService"
cd "${SCRIPT_DIR}"/content/dataService/build
./build.sh
echo "[${SCRIPT_NAME}] successfully built dataService"

# cleanup before tar
# rm -rf zss

# cleanup source & build assets
cd "${SCRIPT_DIR}"/content
rm -rf dataService
rm -rf webClient

# create tar
echo "[${SCRIPT_NAME}] creating tar"
tar -cf ../explorer-ip.tar *
cd ..
echo "[${SCRIPT_NAME}] explorer-ip.tar is generated"