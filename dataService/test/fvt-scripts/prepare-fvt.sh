# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ZSS_DIR=$(cd "${SCRIPT_DIR}/dataService/build/zss" && pwd)
TEST_DIR=$(cd "${SCRIPT_DIR}/dataService/test" && pwd)
export ROOT_DIR=$SCRIPT_DIR

# prepare instance directory
mkdir -p "${ZSS_DIR}/instance/workspace/app-server/serverConfig"
mkdir -p "${ZSS_DIR}/instance/workspace/app-server/plugins"
cd $TEST_DIR
cp fvt-scripts/dummy-server.json "${ZSS_DIR}/instance/workspace/app-server/serverConfig/server.json"
cp fvt-scripts/org.zowe.explorer-ip.json "${ZSS_DIR}/instance/workspace/app-server/plugins/org.zowe.explorer-ip.json"

#build zss 
cd $ZSS_DIR/build && ./build.sh 

#we stop here for now
exit

#start zis
cd $TEST_DIR
./zis-start.sh

# start zss
cd $ZSS_DIR/bin
chmod 640 ${INSTANCE_DIR}/workspace/app-server/serverConfig/server.json
./zssServer ${INSTANCE_DIR}/workspace/app-server/serverConfig/server.json

# opercmd 'd parmlib'
# PPT PGMNAME(ZWESIS01) KEY(4) NOSWAP
# PPT PGMNAME(ZWESAUX) KEY(4) NOSWAP