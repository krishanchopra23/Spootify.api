var fs = require('fs');
var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var s3 = new AWS.S3();

const express = require('express');
const router = express.Router();
const path = require('path');
const app = express();

var items = [];

var parameters = {
	Bucket: "choprak-privatebucket01"
};

app.get('/', function(req, res) {
	items.length = 0;
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	s3.listObjects(parameters, function(err, data) {
		if(err) {
			console.log('Error: ' + err);
		} else {
			for(a = 0; a < (data.Contents).length; a++) {
				items.push({key: data.Contents[a].Key, url: 'https://s3.amazonaws.com/choprak-privatebucket01/' + data.Contents[a].Key});
			}
			console.log(items)
			res.send(items);
		}
	})
})

app.listen(3000);

/*
router.get('/', function(req, res, next) {
  var musicLibrary = req.app.get('musicLibrary');
  res.send({ musicLibrary });
});

module.exports = router;
*/