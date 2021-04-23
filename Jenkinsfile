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
    nodeJsVersion: 'v10.24.1',
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
    disableLint: true
  )

  pipeline.build(
    operation: {
      echo "Default npm build will be skipped."
    }
  )

  pipeline.createStage(
    name          : "Init github from root",
    isSkippable   : true,
    stage         : {
      pipeline.github.initFromFolder()
    }
  )

  // we have pax packaging step
  pipeline.packaging(name: 'explorer-ip', baseDirectory:'.', extraFiles:['explorer-ip.tar'])

  pipeline.createStage(
    name          : 'Test',
    timeout       : [ time: 30, unit: 'MINUTES' ],
    stage         : {
      // tar necessary files then prepare to upload to zOS
      sh "mkdir prepareTest"
      sh "tar -C /prepareTest -xvf .pax/explorer-ip.tar"
      sh "ls -R prepareTest"
      

      echo "Preparing server for integration test ..."
      
      error

      ansiColor('xterm') {
        // prepare environtment for integration test
        sh "../dataService/test/fvt-scripts/prepare-fvt.sh"
      }
      // wait a while to give time for service to be started
      sleep time: 1, unit: 'MINUTES'

      

      echo "Starting integration test ..."
      try {
        withCredentials([
          usernamePassword(
            credentialsId: params.FVT_ZOSMF_CREDENTIAL,
            passwordVariable: 'PASSWORD',
            usernameVariable: 'USERNAME'
          )
        ]) 
        {
          ansiColor('xterm') {
            sh """
            ZSS_HOST=${USERNAME}
            ZOWE_USERNAME=${USERNAME} \
            ZOWE_PASSWORD=${PASSWORD} \
            npm run install
            npm run test:fvt
            """
          }
        }
      } catch (e) {
        echo "Error with integration test: ${e}"
        throw e
      } finally {
        // show logs (the folder should match the folder defined in prepare-fvt.sh)
        sh "find ../dataService/test/target -type f | xargs -i sh -c 'echo \">>>>>>>>>>>>>>>>>>>>>>>> {} >>>>>>>>>>>>>>>>>>>>>>>\" && cat {}'"
      }
    },
    junit         : "target/*.xml",
  )

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
  
  // define we need release stage
  pipeline.release(
    baseDirectory:'WEB_CLIENT',
    NODE_ENV:'production'
  )

  pipeline.end()
}