# pre clean up datasets
USERNAME=$1
DS_JCL=${USERNAME}.DEV.JCL
DS_PARMLIB=${USERNAME}.DEV.PARMLIB
DS_LOADLIB=${USERNAME}.DEV.LOADLIB

function cleanup_dataset {
    DS=$1
    tsocmd "LISTDS '$DS'" > /dev/null 2>&1    #suppress stdout&stderr
    rc=$?
    if [[ $rc == 0 ]]; 
    then
        echo "$DS exists, delete it now..."
        tsocmd "DELETE '$DS'"
    else
        echo "$DS not exist, skip cleanup dataset"
    fi
}

cleanup_dataset $DS_JCL
cleanup_dataset $DS_PARMLIB
cleanup_dataset $DS_LOADLIB

# purge active jobs if exists
opercmd "P O OUTPUT(ZWESISTT)"
exit 0
