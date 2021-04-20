# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ZSS_DIR=$(cd "${SCRIPT_DIR}/content/dataService/build/zss" && pwd)
TEST_DIR=$(cd "${SCRIPT_DIR}/content/dataService/test" && pwd)
export ROOT_DIR=$SCRIPT_DIR

# prepare instance directory
mkdir -p "${SCRIPT_DIR}/instance/workspace/app-server/serverConfig"
mkdir -p "${SCRIPT_DIR}/instance/workspace/app-server/plugins"
cd $TEST_DIR
cp dummy-server.json "${SCRIPT_DIR}/instance/workspace/app-server/serverConfig/server.json"
cp org.zowe.explorer-ip.json "${SCRIPT_DIR}/instance/workspace/app-server/org.zowe.explorer-ip.json"

#build zss 
cd $ZSS_DIR/build && ./build.sh 

#start zis & zss
# todo <start-zis>
cd $ZSS_DIR/bin && ./zssServer $SCRIPT_DIR/instance/workspace/app-server/serverConfig/server.json