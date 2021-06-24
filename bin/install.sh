if [! -z ${ROOT_DIR}] && cd ${ROOT_DIR}/components/app-server/share/explorer-ip

cd lib && extattr +p ipExplorer.so
cd ../web/assets && chtag -b *.png