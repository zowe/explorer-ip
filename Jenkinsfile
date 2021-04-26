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
      // first define test server credentials
      def serverCredentials = []
      Map TEST_SERVERS = [
        'marist': [
          ansible_host     : 'marist-1',
          ssh_hostport     : 'ssh-marist-server-zzow01-hostport',
          ssh_userpass     : 'ssh-marist-server-zzow01'
        ]
      ];
      
      TEST_SERVERS.each{ key, host ->
        serverCredentials.add(usernamePassword(
          credentialsId: host['ssh_hostport'],
          passwordVariable: "SSH_PORT".toString(),
          usernameVariable: "SSH_HOST".toString()
        ))
        serverCredentials.add(usernamePassword(
          credentialsId: host['ssh_userpass'],
          passwordVariable: "SSH_PASSWORD".toString(),
          usernameVariable: "SSH_USER".toString()
        ))
      }

      // then init some variables
      def tarFile = "exp-ip-test.tar"
      def serverWorkplaceRoot = "/ZOWE/tmp"
      def branch = env.BRANCH_NAME
      if (branch.startsWith('origin/')) {
        branch = branch.substring(7)
      }
      branch = branch.replaceAll(/[^a-zA-Z0-9]/, '-').replaceAll(/[\-]+/, '-').toLowerCase()
      def timestamp = sh(script: "date +%Y%m%d%H%M%S", returnStdout: true).trim()
      def processUid = "explorer-ip-test-${branch}-${timestamp}"
      def serverWorkplace = "${serverWorkplaceRoot}/${processUid}"

      // tar required files
      sh "mkdir testWorkspace"
      sh "tar -C testWorkspace -xf .pax/explorer-ip.tar dataService lib pluginDefinition.json"
      sh "cp -r zss testWorkspace/dataService/build"
      sh "tar -cf ${tarFile} testWorkspace"
      echo "now prepare to upload to zOS and run prepare script"

      withCredentials(serverCredentials) {
        def failure
        try {
          // send the tar to server
          sh """SSHPASS=${SSH_PASSWORD} sshpass -e sftp -o BatchMode=no -o StrictHostKeyChecking=no -P ${SSH_PORT} -b - ${SSH_USER}@${SSH_HOST} << EOF
put ${tarFile} ${serverWorkplaceRoot}
EOF"""

          sh """SSHPASS=${SSH_PASSWORD} sshpass -e ssh -tt -o StrictHostKeyChecking=no -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} << EOF
cd ${serverWorkplaceRoot}
tar -xf ${tarFile}
cd testWorkspace
chmod +x dataService/test/fvt-scripts/prepare-fvt.sh
. dataService/test/fvt-scripts/prepare-fvt.sh
sleep 60
exit 0
EOF"""
        }
        catch (ex1) {
          throw ex1
        }
      }

      echo "Preparing server for integration test ..."
      
      

      

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