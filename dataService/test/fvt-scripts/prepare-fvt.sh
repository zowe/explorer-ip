# constants
USERNAME=$1
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ZSS_DIR=${SCRIPT_DIR}/zss
TEST_DIR=$(cd "${SCRIPT_DIR}/dataService/test" && pwd)
export INSTANCE_DIR=${SCRIPT_DIR}/instance

# prepare instance directory
mkdir -p "${INSTANCE_DIR}/workspace/app-server/serverConfig"
mkdir -p "${INSTANCE_DIR}/workspace/app-server/plugins"
cd $TEST_DIR/fvt-scripts
cp dummy-server.json "${INSTANCE_DIR}/workspace/app-server/serverConfig/server.json"
cp org.zowe.explorer-ip.json "${INSTANCE_DIR}/workspace/app-server/plugins/org.zowe.explorer-ip.json"

#pre-cleanup
./cleanup.sh $USERNAME

#build zss
cd $ZSS_DIR/build && ./build.sh 

#start zis
cd $TEST_DIR/fvt-scripts && ./zis-start.sh $USERNAME ${ZSS_DIR} ${TEST_DIR}/fvt-scripts

# start zss
cd $ZSS_DIR/bin
chmod -R 640 ${INSTANCE_DIR}/workspace/app-server/serverConfig
#./zssServer ${INSTANCE_DIR}/workspace/app-server/serverConfig/server.json

# opercmd 'd parmlib'
# PPT PGMNAME(ZWESIS01) KEY(4) NOSWAP
# PPT PGMNAME(ZWESAUX) KEY(4) NOSWAP