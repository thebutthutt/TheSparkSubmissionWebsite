#!/usr/bin/bash
cd $(dirname $0)
if [[ $(sudo netstat -tulpn | grep :27017) ]]; then
    echo "mongod running, starting server"
else
    echo "mongod not running, starting mongod"
    sudo mongod
fi

if [[ $(sudo netstat -tulpn | grep :$1) ]]; then
    echo "killing old process"
    echo sudo fuser -k $1/tcp
else
    echo "port is clear"
fi
