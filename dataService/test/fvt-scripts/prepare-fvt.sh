# constants
USERNAME=$1
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ZSS_DIR=${SCRIPT_DIR}/zss
TEST_DIR=$(cd "${SCRIPT_DIR}/dataService/test" && pwd)
export ROOT_DIR=$SCRIPT_DIR
export INSTANCE_DIR=${ROOT_DIR}/instance

# prepare instance directory
mkdir -p "${ROOT_DIR}/instance/workspace/app-server/serverConfig"
mkdir -p "${ROOT_DIR}/instance/workspace/app-server/plugins"
cd $TEST_DIR
cp fvt-scripts/dummy-server.json "${ROOT_DIR}/instance/workspace/app-server/serverConfig/server.json"
cp fvt-scripts/org.zowe.explorer-ip.json "${ROOT_DIR}/instance/workspace/app-server/plugins/org.zowe.explorer-ip.json"

#pre-cleanup
cd $TEST_DIR/fvt-scripts
./cleanup.sh $USERNAME

#build zss
chtag -Rtc ISO8859-1 $ZSS_DIR
cd $ZSS_DIR/build && ./build.sh 

#start zis
cd $TEST_DIR/fvt-scripts
./zis-start.sh $USERNAME ${ZSS_DIR} ${TEST_DIR}

exit #hardstop here

# start zss
cd $ZSS_DIR/bin
chmod 640 ${INSTANCE_DIR}/workspace/app-server/serverConfig/server.json
./zssServer ${INSTANCE_DIR}/workspace/app-server/serverConfig/server.json

# opercmd 'd parmlib'
# PPT PGMNAME(ZWESIS01) KEY(4) NOSWAP
# PPT PGMNAME(ZWESAUX) KEY(4) NOSWAP