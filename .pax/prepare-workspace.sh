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
# no longer need the following as we are now using github actions
# set +x
# . /home/jenkins/.nvm/nvm.sh
# nvm use v10.24.1
# set -x
# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
EXPLIP_ROOT_DIR=$(cd "$SCRIPT_DIR" && cd .. && pwd)
PAX_WORKSPACE_DIR=.pax
cd "${EXPLIP_ROOT_DIR}/webClient"
PACKAGE_NAME=$(node -e "console.log(require('./package.json').name)")
PACKAGE_VERSION=$(node -e "console.log(require('./package.json').version)")
PACKAGE_DESC=$(node -e "console.log(require('./package.json').description)")
ZOWE_PLUGIN_ID="org.zowe.${PACKAGE_NAME}"

cd "${EXPLIP_ROOT_DIR}"

# prepare pax workspace
echo "[${SCRIPT_NAME}] pre-clean and recreate PAX workspace ..."
rm -fr "${PAX_WORKSPACE_DIR}/content"
mkdir -p "${PAX_WORKSPACE_DIR}/content"

# prepare content folder
echo "[${SCRIPT_NAME}] copying explorer-ip root files to PAX workspace"
cp  pluginDefinition.json "${PAX_WORKSPACE_DIR}/content"
cp  manifest.yaml "${PAX_WORKSPACE_DIR}/content"
cp  README.md "${PAX_WORKSPACE_DIR}/content"
cp  LICENSE "${PAX_WORKSPACE_DIR}/content"

#####################################
# Step A. Building webClient and copy
#####################################

# setup zlux repo, then build virtual desktop
echo "[${SCRIPT_NAME}] setting up zLux plugins"
cd "${EXPLIP_ROOT_DIR}"
rm -rf zlux
mkdir zlux
cd zlux
git clone https://github.com/zowe/zlux-app-manager.git
git clone https://github.com/zowe/zlux-platform.git
git submodule foreach "git checkout master"
cd zlux-app-manager/virtual-desktop && npm ci

# build webClient
echo "[${SCRIPT_NAME}] building webClient"
# create a softlink of explorer-ip inside zlux
cd ../..    # now should be in zlux
ln -s ${EXPLIP_ROOT_DIR} explorer-ip
cd "explorer-ip/webClient"
npm install
export MVD_DESKTOP_DIR="${EXPLIP_ROOT_DIR}/zlux/zlux-app-manager/virtual-desktop/"
mv tsconfig.json tsconfig.backup.json
mv tsconfig.pipeline.json tsconfig.json
npm run build
echo "[${SCRIPT_NAME}] Successfully built webClient"

# clean up the symlink to reduce confusion
cd ../.. #now back at zlux
rm explorer-ip
cd ${EXPLIP_ROOT_DIR} #reset current directory back to explorer-ip root

# copy web to PAX workspace
echo "[${SCRIPT_NAME}] copying web dir to PAX workspace"
mkdir -p "${PAX_WORKSPACE_DIR}/content/web"
cp -r web "${PAX_WORKSPACE_DIR}/content"

# copy webClient source to PAX workspace
echo "[${SCRIPT_NAME}] copying webClient source to PAX workspace"
## remove node_modules to provide source only
rm -rf webClient/node_modules
mkdir -p "${PAX_WORKSPACE_DIR}/content/webClient"
mv webClient/tsconfig.backup.json webClient/tsconfig.json
cp -r webClient "${PAX_WORKSPACE_DIR}/content"


#################################
# Step B. copy dataService source
#################################

# clone zss and copy to dataService (zss cannot be built on Unix)
echo "[${SCRIPT_NAME}] clone zss and copy to dataService"
git clone --recursive https://github.com/zowe/zss/   # this line also downloads zowe-common-c
rm -rf zss/.git*
cp -r zss dataService/build

# remove test files - tests should not be shipped
rm -rf dataService/test

# copy dataService source to PAX workspace
echo "[${SCRIPT_NAME}] copying dataService source to PAX workspace"
mkdir -p "${PAX_WORKSPACE_DIR}/content/dataService"
cp -r dataService "${PAX_WORKSPACE_DIR}/content"

#make sure .git folder is not inside .pax
rm -rf "${PAX_WORKSPACE_DIR}/.git"
rm -rf "${PAX_WORKSPACE_DIR}/content/.git"


#######################################################
# Step C. create ascii folder for dealing with encoding 
#######################################################

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

exit 0