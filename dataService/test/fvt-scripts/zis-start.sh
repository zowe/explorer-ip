
export USERNAME=MYUSER
export ZSS_DIR=/u/MYUSER/zss
export FVT_DIR=/u/MYUSER
export INSTANCE_DIR=/u/MYUSER/instance
export VOLUME=T50102

# build zss from source
git clone --recursive https://github.com/zowe/zss/ 
./build.sh

# create ZWESIS01 JCL and its override
tsocmd 'alloc da(dev.jcl) DSORG(PO) RECFM(F,B) LRECL(80) DSNTYPE(LIBRARY) BLKSIZE(0) CYLINDERS SPACE(1,1)'
cp "${ZSS_DIR}/samplib/zis/ZWESIS01" "//'${USERNAME}.DEV.JCL'"
cp "${FVT_DIR}/ZWESISTT" "//'${USERNAME}.DEV.JCL'"

# copy ZWESIP00 PARMLIB
tsocmd 'alloc da(dev.parmlib) DSORG(PO) RECFM(F,B) LRECL(80) DSNTYPE(LIBRARY) BLKSIZE(0) CYLINDERS SPACE(1,1)'
cp "${ZSS_DIR}/samplib/zis/ZWESIP00" "//'${USERNAME}.DEV.PARMLIB'"

# Add APF Authorization
opercmd "SETPROG APF,ADD,DSNAME=${USERNAME}.DEV.LOADLIB,VOLUME=${VOLUME}"
# verify 'd prog,apf'

# submit JCL
tsocmd "submit '${USERNAME}.DEV.JCL(ZWESISTT)'"