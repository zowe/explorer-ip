# pre clean up datasets
DS_JCL=${USERNAME}.DEV.JCL
DS_PARMLIB=${USERNAME}.DEV.PARMLIB
DS_LOADLIB=${USERNAME}.DEV.LOADLIB

function cleanup_dataset {
    DS=$1
    if [[ $(tsocmd "LISTDS '$DS'") ]]; 
    then
        echo "$DS exists, delete it now..."
        tsocmd "DELETE '$DS'"
    else
    fi
}

cleanup_dataset $DS_JCL
cleanup_dataset $DS_PARMLIB
cleanup_dataset $DS_LOADLIB

# purge active jobs if exists
tsocmd "P O OUTPUT(ZWESISTT)"
exit 0
