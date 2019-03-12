var fs = require('fs');
const router = express.Router();
const redis = require('redis');
const bodyParser = require('body-parser'
const express = require('express');
const app = express();
const path = require('path');
const chan = 'reporting';

var sub = redis.createClient(6379, 'reporting.cgh4sb.clustercfg.use1.cache.amazonaws.com');

sub.on('connect', function() {
  console.log('Redis subscriber connected');
});

sub.on('error', function(err) {
  console.log('Redis subscriber failed');
});

sub.subscribe(channel, (error, count) => {
  if(error) throw err;
  else {
    console.log(`Subscribed to ${channel} channel. Waiting for updates.`)
  }
});

sub.on('message', (channel, message) => {
    console.log(`Received the following message from ${channel}: ${message}`);
});