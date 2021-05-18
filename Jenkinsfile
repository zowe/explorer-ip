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
/*
  pipeline.createStage(
    name              : "Test",
    timeout: [time: 2, unit: 'HOURS'],
    isSkippable: true,
    stage : {
      // download full zowe from latest staging branch
      def buildName = "zowe-install-packaging :: staging"
      def branchName = "staging"

      def ZOWE_BUILD_REPOSITORY = 'libs-snapshot-local'
      def ZOWE_CLI_BUILD_REPOSITORY = 'libs-snapshot-local'
      def ZOWE_CLI_BUILD_NAME = 'Zowe CLI Bundle :: master'
      
      sourceRegBuildInfo = pipeline.artifactory.getArtifact([
        'pattern'      : "${ZOWE_BUILD_REPOSITORY}/*/zowe-*.pax",
        'build-name'   : buildName,
        'build-number' : env.BUILD_NUMBER
      ])
      cliSourceBuildInfo = pipeline.artifactory.getArtifact([
          'pattern'      : "${ZOWE_CLI_BUILD_REPOSITORY}/*/zowe-cli-package-*.zip",
          'build-name'   : ZOWE_CLI_BUILD_NAME
      ])
      if (sourceRegBuildInfo && sourceRegBuildInfo.path) { //run tests when sourceRegBuildInfo exists
        def testParameters = [
          booleanParam(name: 'STARTED_BY_AUTOMATION', value: true),
          string(name: 'TEST_SERVER', value: 'marist'),
          string(name: 'TEST_SCOPE', value: '?????????????????'),
          string(name: '?????????????????', value: '?????????????????'),
          string(name: 'ZOWE_ARTIFACTORY_PATTERN', value: sourceRegBuildInfo.path),
          string(name: 'ZOWE_ARTIFACTORY_BUILD', value: buildName),
          string(name: 'INSTALL_TEST_DEBUG_INFORMATION', value: 'zowe-install-test:*'),
          string(name: 'SANITY_TEST_DEBUG_INFORMATION', value: 'zowe-sanity-test:*'),
          booleanParam(name: 'Skip Stage: Lint', value: true),
          booleanParam(name: 'Skip Stage: Audit', value: true),
          booleanParam(name: 'Skip Stage: SonarQube Scan', value: true)
        ]
        if (cliSourceBuildInfo && cliSourceBuildInfo.path) {
          testParameters.add(string(name: 'ZOWE_CLI_ARTIFACTORY_PATTERN', value: cliSourceBuildInfo.path))
          testParameters.add(string(name: 'ZOWE_CLI_ARTIFACTORY_BUILD', value: ''))
        }

        def test_result = build(
          job: '/zowe-install-test/' + branchName.replace('/', '%2F'),
          parameters: testParameters
        )
        echo "Test result: ${test_result.result}"
        if (test_result.result != 'SUCCESS') {
          currentBuild.result='UNSTABLE'
          if (test_result.result == 'ABORTED') {
            echo "Test aborted"
          } else {
            echo "Test failed on ????????????????? ${sourceRegBuildInfo.path}, check failure details at ${test_result.absoluteUrl}"
          }
        }
      }
    }
  )
*/
  // define we need release stage
  pipeline.release(
    baseDirectory:'WEB_CLIENT',
    NODE_ENV:'production'
  )

  pipeline.end()
}