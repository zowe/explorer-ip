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
cd ./content/
chtag -Rtc ISO8859-1 web

# build dataService
echo "[${SCRIPT_NAME}] building dataService"
cd dataService/build
./build.sh
echo "[${SCRIPT_NAME}] successfully built dataService"

# cleanup before tar
rm -rf zss

# create tar
echo "[${SCRIPT_NAME}] creating tar"
cd "$SCRIPT_DIR"
rm -rf explorer-ip # pre-clean
cp -r content "explorer-ip"
tar -cvf "explorer-ip.tar" "explorer-ip"
rm -r "explorer-ip" # post-clean
echo "[${SCRIPT_NAME}] explorer-ip.tar is generated"
