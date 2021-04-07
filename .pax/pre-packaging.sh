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

#ascii tagging of web folder if not already
cd ./content/
chtag -Rtc ISO8859-1 web

# npm install on z/OS to build zss plugin
cd ./content/dataService/build
./build.sh