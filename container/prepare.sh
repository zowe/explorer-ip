#!/bin/bash

################################################################################
# This program and the accompanying materials are made available under the terms of the
# Eclipse Public License v2.0 which accompanies this distribution, and is available at
# https://www.eclipse.org/legal/epl-v20.html
#
# SPDX-License-Identifier: EPL-2.0
#
# Copyright Contributors to the Zowe Project.
################################################################################

################################################################################
# prepare docker build context
#
# This script will be executed with 2 parameters:
# - linux-distro
# - cpu-arch

################################################################################
# This script prepares all required files we plan to put into explorer-ip
# image.
#
# Prereqs:
# - must run with Github Actions (with GITHUB_RUN_NUMBER and GITHUB_SHA)
# - must provide $GITHUB_PR_ID is it's pull request
# - jq

# exit if there are errors
set -e

###############################
# check parameters
linux_distro=$1
cpu_arch=$2
if [ -z "${linux_distro}" ]; then
  echo "Error: linux-distro parameter is missing."
  exit 1
fi
if [ -z "${cpu_arch}" ]; then
  echo "Error: cpu-arch parameter is missing."
  exit 1
fi

################################################################################
# CONSTANTS
BASE_DIR=$(cd $(dirname $0);pwd)
REPO_ROOT_DIR=$(cd $(dirname $0)/../;pwd)
WORK_DIR=tmp
JFROG_REPO_SNAPSHOT=libs-snapshot-local
JFROG_REPO_RELEASE=libs-release-local
JFROG_URL=https://zowe.jfrog.io/zowe/

###############################
echo ">>>>> prepare basic files"
cd "${REPO_ROOT_DIR}"
package_version=$(jq -r '.version' package.json)
package_release=$(echo "${package_version}" | awk -F. '{print $1;}')

###############################
# copy Dockerfile
echo ">>>>> copy Dockerfile to ${linux_distro}/${cpu_arch}/Dockerfile"
cd "${BASE_DIR}"
mkdir -p "${linux_distro}/${cpu_arch}"
if [ ! -f Dockerfile ]; then
  echo "Error: Dockerfile file is missing."
  exit 2
fi
cat Dockerfile | sed -e "s#version=\"0\.0\.0\"#version=\"${package_version}\"#" -e "s#release=\"0\"#release=\"${package_release}\"#" > "${linux_distro}/${cpu_arch}/Dockerfile"

###############################
echo ">>>>> clean up folder"
rm -fr "${BASE_DIR}/${WORK_DIR}"
mkdir -p "${BASE_DIR}/${WORK_DIR}"

###############################
echo ">>>>> build explorer-ip webClient"
cd "${REPO_ROOT_DIR}"
rm -rf zlux
mkdir zlux
cd zlux
git clone https://github.com/zowe/zlux-app-manager.git
git clone https://github.com/zowe/zlux-platform.git
git submodule foreach "git checkout master"
cd zlux-app-manager/virtual-desktop && npm ci

# create a softlink of explorer-ip inside zlux
cd ../..    # now should be in zlux
ln -s ${REPO_ROOT_DIR} explorer-ip
cd "explorer-ip/webClient"
npm install
export MVD_DESKTOP_DIR="${REPO_ROOT_DIR}/zlux/zlux-app-manager/virtual-desktop/"
mv tsconfig.json tsconfig.backup.json
mv tsconfig.pipeline.json tsconfig.json
npm run build

# clean up the symlink to reduce confusion
cd ../.. #now back at zlux
rm explorer-ip
cd ${REPO_ROOT_DIR} #reset current directory back to explorer-ip root

# copy web to container workspace
mkdir -p "${BASE_DIR}/${WORK_DIR}/web"
cp -r web "${BASE_DIR}/${WORK_DIR}"
# copy webClient source to container workspace
## remove node_modules to provide source only
#rm -rf webClient/node_modules
#mkdir -p "${BASE_DIR}/${WORK_DIR}/webClient"
#mv webClient/tsconfig.backup.json webClient/tsconfig.json
#cp -r webClient "${BASE_DIR}/${WORK_DIR}"
cp README.md "${BASE_DIR}/${WORK_DIR}"
cp LICENSE "${BASE_DIR}/${WORK_DIR}"
cp pluginDefinition.json "${BASE_DIR}/${WORK_DIR}"

###############################
echo ">>>>> prepare manifest.json"
cd "${REPO_ROOT_DIR}"
if [ -n "${GITHUB_PR_ID}" ]; then
  GITHUB_BRANCH=PR-${GITHUB_PR_ID}
else
  GITHUB_BRANCH=${GITHUB_REF#refs/heads/}
fi

echo "    - branch: ${GITHUB_BRANCH}"
echo "    - build number: ${GITHUB_RUN_NUMBER}"
echo "    - commit hash: ${GITHUB_SHA}"
# assume to run in Github Actions
cat manifest.yaml | \
  sed -e "s#{{build\.branch}}#${GITHUB_BRANCH}#" \
      -e "s#{{build\.number}}#${GITHUB_RUN_NUMBER}#" \
      -e "s#{{build\.commitHash}}#${GITHUB_SHA}#" \
      -e "s#{{build\.timestamp}}#$(date +%s)#" \
  > "${BASE_DIR}/${WORK_DIR}/manifest.yaml"

###############################
# copy to target context
echo ">>>>> copy to target build context"
cp -r "${BASE_DIR}/${WORK_DIR}" "${BASE_DIR}/${linux_distro}/${cpu_arch}/component"

###############################
# done
echo ">>>>> all done"
