#!groovy

/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2021
 */

def WEB_CLIENT = 'webClient'
def DATASERVICE = 'dataService'

node('zowe-jenkins-agent-dind') {
  def lib = library("jenkins-library").org.zowe.jenkins_shared_library

  def pipeline = lib.pipelines.nodejs.NodeJSPipeline.new(this)

  pipeline.admins.add("nakul")

  pipeline.setup(
    packageName: 'org.zowe.explorer-ip',
    baseDirectory: WEB_CLIENT,
    nodeJsVersion: 'v10.18.1',
    installRegistries: [
      [
        email                      : lib.Constants.DEFAULT_LFJ_NPM_PRIVATE_REGISTRY_EMAIL,
        usernamePasswordCredential : lib.Constants.DEFAULT_LFJ_NPM_PRIVATE_REGISTRY_CREDENTIAL,
        registry                   : lib.Constants.DEFAULT_LFJ_NPM_PRIVATE_REGISTRY_INSTALL,
      ]
    ],
    publishRegistry: [
      email                      : lib.Constants.DEFAULT_LFJ_NPM_PRIVATE_REGISTRY_EMAIL,
      usernamePasswordCredential : lib.Constants.DEFAULT_LFJ_NPM_PRIVATE_REGISTRY_CREDENTIAL,
    ],
    github: [
      email                      : lib.Constants.DEFAULT_GITHUB_ROBOT_EMAIL,
      usernamePasswordCredential : lib.Constants.DEFAULT_GITHUB_ROBOT_CREDENTIAL,
    ],
    disableLint: true,
  )

  pipeline.build(
    operation: {
      echo "Default npm build will be skipped."
    }
  )

  // we have pax packaging step
  pipeline.packaging(name: 'explorer-ip', baseDirectory:'.', extraFiles:['explorer-ip.tar'])

  // define we need publish stage
  pipeline.publish(
    operation: {
      echo "Default npm publish will be skipped."
    },
    baseDirectory:'.',
    artifacts: [
      '.pax/explorer-ip.pax',
      '.pax/explorer-ip.tar'
    ],
    allowPublishWithoutTest: true // There are no tests
  )

  pipeline.createStage(
    operation: {
      echo "DEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUG"
      ls -al
      git remote -v
      echo "DEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUG"
    }
  )
  // define we need release stage
  pipeline.release()

  pipeline.end()
}