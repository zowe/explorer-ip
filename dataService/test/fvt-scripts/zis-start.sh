USERNAME=$1
ZSS_DIR=$2
FVT_DIR=$3

# parsing volume of LOADLIB
# Reference: https://github.com/zowe/zowe-install-packaging/blob/master/shared/scripts/check-dataset-exist.sh
VOLUME= $(tsocmd "LISTDS '${USERNAME}.DEV.LOADLIB'" | awk '/^--VOLUMES/{f=1;next} f{f=0;$1=$1;print}')

# create ZWESIS01 JCL and its override
tsocmd 'alloc da(dev.jcl) DSORG(PO) RECFM(F,B) LRECL(80) DSNTYPE(LIBRARY) BLKSIZE(0) CYLINDERS SPACE(1,1)'
if [ $? -eq 0 ] 
then
    cp "${ZSS_DIR}/samplib/zis/ZWESIS01" "//'${USERNAME}.DEV.JCL'"
    cp "${FVT_DIR}/ZWESISTT" "//'${USERNAME}.DEV.JCL'"
else
    echo "Could not allocate ${USERNAME}.DEV.JCL"
    exit 8
fi

# copy ZWESIP00 PARMLIB
tsocmd 'alloc da(dev.parmlib) DSORG(PO) RECFM(F,B) LRECL(80) DSNTYPE(LIBRARY) BLKSIZE(0) CYLINDERS SPACE(1,1)'
if [ $? -eq 0 ] 
then
    cp "${ZSS_DIR}/samplib/zis/ZWESIP00" "//'${USERNAME}.DEV.PARMLIB'"
else
    echo "Could not allocate ${USERNAME}.DEV.PARMLIB"
    exit 8
fi


# Add APF Authorization
opercmd "SETPROG APF,ADD,DSNAME=${USERNAME}.DEV.LOADLIB,VOLUME=${VOLUME}"
# verify 'd prog,apf'

# submit JCL
tsocmd "submit '${USERNAME}.DEV.JCL(ZWESISTT)'"