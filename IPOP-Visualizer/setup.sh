#! /bin/bash

wget -qO- https://deb.nodesource.com/setup_9.x | bash -

sudo apt-get update
sudo apt-get install -y nodejs && sudo apt-get install npm


npm init
npm install express
npm install tippy.js






