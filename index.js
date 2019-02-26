var fs = require('fs');
var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var s3 = new AWS.S3();

const express = require('express');
const router = express.Router();
const path = require('path');
const app = express();
AWS.config.update({region:'us-east-1'});

var items = [];

var ddb = new AWS.DynamoDB.DocumentClient();

var parameters = {
	Bucket: "choprak-privatebucket01"
};

var parameters_genre_ddb = {
	TableName: 'music',
	ExpressionAttributeValues: {
		":letter1": "A",
		":letter2": "z"
	},
	FilterExpression: "genre between :letter1 and :letter2"

}

function parameters_artists_genre(genreName) {
	return {
		TableName: 'music',
		ExpressionAttributeValues: {
			":gn": `${genreName}`,
			":letter1": "A",
			":letter2": "z"
		},
		FilterExpression: "genre = :gn and artist between :letter1 and :letter2"
	}
}

function parameters_albums_artist(artistName) {
	return {
		TableName: 'music',
 		IndexName: "artist_gsi",
 		ExpressionAttributeValues: {
 			":art": `${artistName}`,
 		},
 		KeyConditionExpression: "artist = :art"
	}
}

function parameters_songs_albums(albumName) {
 	return {
 		TableName: 'music',
 		ExpressionAttributeValues: {
 			":an": `${albumName}`
 		},
 		FilterExpression: "contains(artist_album_song, :an)"
 	}
}

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

app.get('/genres', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	ddb.scan(parameters_genre_ddb, function(err, data) {
		if(err) {
			console.log('Error: ' + err);
		} else {
			console.log(data);
			var genreCurrent = ''
			var obj = []
			data.Items.forEach(function(item) {
				console.log(item.genre);
				if(item.genre != genreCurrent) {
					obj.push(item.genre)
				}
				genreCurrent = item.genre;
			})
			console.log(obj)
			res.send(obj);
		}
	})
})

app.get('/artists/for/genre', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var url = req.url
	url = (url.split('?')[1]).split('=')[1]

	ddb.scan(parameters_artists_genre(url), function(err, data) {
		if(err) {
			console.log('Error: ' + err);
		} else {
			var artistCurrent = ''
			var obj = []
			data.Items.forEach(function(item) {
				if(item.artist != artistCurrent) {
					obj.push(item.artist)
				}
				artistCurrent = item.artist;
			})
			console.log(obj)
			res.send(obj);
		}
	})
})

app.get('/albums/for/artist', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var url = req.url
	url = (url.split('?')[1]).split('=')[1]

	ddb.query(parameters_albums_artist(url), function(err, data) {
		if(err) {
			console.log('Error: ' + err);
		} else {
			var albumCurrent = ''
			var obj = []
			data.Items.forEach(function(item) {
				if(item.artist_album_song != albumCurrent) {
					obj.push(item.artist_album_song.split('#')[1])
				}
				artistCurrent = item.artist_album_song;
			})
			console.log(obj)
			res.send(obj);
		}
	})
})

app.get('/songs/for/album', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var url = req.url
	url = (url.split('?')[1]).split('=')[1]

	ddb.scan(parameters_songs_albums(url), function(err, data) {
		if(err) {
			console.log('Error: ' + err);
		} else {
			var songCurrent = ''
			var obj = []
			data.Items.forEach(function(item) {
				if(item.artist_album_song != songCurrent) {
					var title = item.artist_album_song.split('#')[1]
					if(title == url) {
						obj.push(item.artist_album_song.split('#')[2])
					}
				}
				songCurrent = item.artist_album_song;
			})
			console.log(obj)
			res.send(obj);
		}
	})
})

app.get('/song', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var url = req.url;
	url = (url.split('?')[1]).split('=')[1]

	if(url == 'wonderwall') {
		s3.listObjects(parameters, function(err, data) {
		if (err) {
			console.log('ERROR: ' + err);
		} else {
			res.send('https://s3.amazonaws.com/choprak-privatebucket01/' + data.Contents[1].Key)
			}
		})
	}
})

app.listen(3000);

/*
router.get('/', function(req, res, next) {
  var musicLibrary = req.app.get('musicLibrary');
  res.send({ musicLibrary });
});

module.exports = router;
*/