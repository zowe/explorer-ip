#!/bin/bash -e

################################################################################
# This program and the accompanying materials are made available under the terms of the
# Eclipse Public License v2.0 which accompanies this distribution, and is available at
# https://www.eclipse.org/legal/epl-v20.html
#
# SPDX-License-Identifier: EPL-2.0
#
# Copyright IBM Corporation 2021
################################################################################

################################################################################
# Build script
# 
# - build client
#################################################################################

# contants
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR" && cd .. && pwd)
PAX_WORKSPACE_DIR=.pax
cd "${ROOT_DIR}/webClient"
PACKAGE_NAME=$(node -e "console.log(require('./package.json').name)")
PACKAGE_VERSION=$(node -e "console.log(require('./package.json').version)")
PACKAGE_DESC=$(node -e "console.log(require('./package.json').description)")
ZOWE_PLUGIN_ID="org.zowe.${PACKAGE_NAME}"

cd "${ROOT_DIR}"

# prepare pax workspace
echo "[${SCRIPT_NAME}] cleaning PAX workspace ..."
rm -fr "${PAX_WORKSPACE_DIR}/content"
mkdir -p "${PAX_WORKSPACE_DIR}/content"

# copy web explorer-ip to target folder
# build steps 
# cd webClient && npm install --prod && npm run build
echo "[${SCRIPT_NAME}] copying explorer-ip web"
mkdir -p "${PAX_WORKSPACE_DIR}/content/web"
cp -r web "${PAX_WORKSPACE_DIR}/content"
cp  pluginDefinition.json "${PAX_WORKSPACE_DIR}/content"
cp  manifest.yaml "${PAX_WORKSPACE_DIR}/content"
cp  README.md "${PAX_WORKSPACE_DIR}/content"
cp  LICENSE "${PAX_WORKSPACE_DIR}/content"

# copy webClient source explorer-ip to target folder
echo "[${SCRIPT_NAME}] copying webClient source to explorer-ip"
## remove node_modules to provide source only
rm -rf webClient/node_modules
mkdir -p "${PAX_WORKSPACE_DIR}/content/webClient"
cp -r webClient "${PAX_WORKSPACE_DIR}/content"

# copy lib explorer-ip to target folder
# build steps on z/OS
# cd dataService/build && git clone https://github.com/zowe/zss/ && ./build.sh
mkdir -p "${PAX_WORKSPACE_DIR}/content/lib"
cp -r lib "${PAX_WORKSPACE_DIR}/content"

# copy dataService source explorer-ip to target folder
echo "[${SCRIPT_NAME}] copying dataService source to explorer-ip"
## remove node_modules to provide source only
mkdir -p "${PAX_WORKSPACE_DIR}/content/dataService"
cp -r dataService "${PAX_WORKSPACE_DIR}/content"

# move content to another folder
rm -fr "${PAX_WORKSPACE_DIR}/ascii"
mkdir -p "${PAX_WORKSPACE_DIR}/ascii"

# update build information
# BRANCH_NAME and BUILD_NUMBER is Jenkins environment variable
commit_hash=$(git rev-parse --verify HEAD)
current_timestamp=$(date +%s%3N)
sed -e "s|{{build\.branch}}|${BRANCH_NAME}|g" \
    -e "s|{{build\.number}}|${BUILD_NUMBER}|g" \
    -e "s|{{build\.commitHash}}|${commit_hash}|g" \
    -e "s|{{build\.timestamp}}|${current_timestamp}|g" \
    "${PAX_WORKSPACE_DIR}/content/manifest.yaml" > "${PAX_WORKSPACE_DIR}/content/manifest.yaml.tmp"
mv "${PAX_WORKSPACE_DIR}/content/manifest.yaml.tmp" "${PAX_WORKSPACE_DIR}/content/manifest.yaml"
echo "[${SCRIPT_NAME}] manifest:"
cat "${PAX_WORKSPACE_DIR}/content/manifest.yaml"
echo
  
rsync -rv \
  --include '*.json' --include '*.html' --include '*.jcl' --include '*.template' --include '*.so' \
  --exclude '*.zip' --exclude '*.png' --exclude '*.tgz' --exclude '*.tar.gz' --exclude '*.pax' \
  --prune-empty-dirs --remove-source-files \
  "${PAX_WORKSPACE_DIR}/content/" \
  "${PAX_WORKSPACE_DIR}/ascii"

echo "[${SCRIPT_NAME}] ${PAX_WORKSPACE_DIR} folder is prepared."

# prepare tar file as well
echo "[${SCRIPT_NAME}] ${PAX_WORKSPACE_DIR} prepare *.tar.gz"
cd "${PAX_WORKSPACE_DIR}"
# remove folder for local build & tar
rm -fr "explorer-ip"
rm -f "explorer-ip.tar.gz"

# copy ascii to explorer-ip
cp -r "ascii" "explorer-ip"

# tar explorer-ip
tar -cvf "explorer-ip.tar" "explorer-ip"
echo "[${SCRIPT_NAME}] ${PAX_WORKSPACE_DIR} *.tar is generated"

exit 0