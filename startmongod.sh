#!/usr/bin/bash
cd $(dirname $0)
output=output_file.txt 
now=$(date +"%T")
if [[ $(sudo netstat -tulpn | grep :27017) ]]; then
    echo "mongod running, starting server" >> now >> output
else
    echo "mongod not running, starting mongod" >> now >> output
    sudo mongod
fi
