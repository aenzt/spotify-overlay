const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const querystring = require("querystring");
const SpotifyWebApi = require("spotify-web-api-node");
const request = require("request");
const fs = require("fs");
const { nextTick } = require("process");

var client_id = "727cced3396f4edabf7e7d98b826b168"; // Your client id
var client_secret = "102965d90b614e5e9fe7ce5de1eadbdb"; // Your secret
var redirect_uri = "http://localhost:5000/callback"; // Your redirect uri

var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "spotify_auth_state";

const app = express();
const router = express.Router();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

var client_id = "727cced3396f4edabf7e7d98b826b168"; // Your client id
var client_secret = "102965d90b614e5e9fe7ce5de1eadbdb"; // Your secret
var redirect_uri = "https://aqueous-scrubland-03780.herokuapp.com/api/callback"; // Your redirect uri

var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "spotify_auth_state";

var scopes = ["user-read-private", "user-read-playback-state"],
  state = "some-state-of-my-choice";
(showDialog = true), (responseType = "code");

var spotifyApi = new SpotifyWebApi({
  redirectUri: redirect_uri,
  clientId: client_id,
  clientSecret: client_secret,
});

var authorizeURL = spotifyApi.createAuthorizeURL(
  scopes,
  state,
  showDialog,
  responseType
);

app.get("/api/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  res.redirect(authorizeURL);
});

app.get("/api/callback", function (req, res) {
  var code = req.query.code || null;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    json: true,
  };
  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var access_token = body.access_token,
        refresh_token = body.refresh_token;
      res.redirect(
        "https://spotify-overlay.herokuapp.com/nowplaying?" +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token,
          })
      );
    }
  });
});

app.get('/api/refreshtoken', function(req, res){
  var refresh_token = req.query.refresh_token || null;
  var refreshOption = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      client_id: client_id,
      refresh_token: refresh_token,
      grant_type: "refresh_token",
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    json: true,
  };
  request.post(refreshOption, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var access_token = body.access_token;
      res.redirect(
        "https://spotify-overlay.herokuapp.com/nowplaying?" +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token,
          })
      );
      console.log("New Access Token generated");
    }
  });
});



app.get("/api/nowplaying", function (req, res) {
  var acces_token = req.query.access_token || null;
  var refresh_token = req.query.refresh_token || null;
  spotifyApi.setAccessToken(acces_token);
  // function refreshToken() {
  //   spotifyApi.setRefreshToken(refresh_token);
  //   spotifyApi.refreshAccessToken().then(
  //     function(data){
  //       console.log('The acces token has been refreshed!');

  //       spotifyApi.setAccessToken(data.body['access_token']);
  //     }
  //   )
  //   console.log("token refresh");
  // }
  // setInterval(refreshToken(), 120000);
  spotifyApi.getMyCurrentPlaybackState().then(
    function (data) {
      // Output items
      if (data.body && data.body.is_playing && !data.body.error) {
        var artist = data.body.item.artists[0].name;
        var albumimg = data.body.item.album.images[1].url;
        var track = data.body.item.name;
        var data = {
          is_playing : true,
          artist : artist,
          albumimg : albumimg,
          track : track,
          progress : data.body.progress_ms,
          song_length : data.body.item.duration_ms,
        };
        return res.send(data);
      } else {
        var is_playing;
        var data = {
          is_playing : false,
          artist : ".",
          track : "Paused",
        };
        return res.send(data);
      }
    },
    function (err) {
      console.log("Something went wrong!", err.statusCode);
      return res.status(err.statusCode)
    }
  );
  // var song = fs.readFileSync("D:/Snip/Snip.txt", "utf8");
  // let songsep = song.split("―");
  // console.log(songsep);
  // if (songsep[0] == ""){
  //   var data = {
  //     is_playing: true,
  //     artist: "N/A",
  //     albumimg: 'https://i.scdn.co/image/ab67616d00001e02f640ccb7d43d740ab30bc7b5',
  //     track: 'Not Playing',
  //     // progress: data.body.progress_ms,
  //     // song_length: data.body.item.duration_ms,
  //   };
  // }else{
  //   var data = {
  //     is_playing: true,
  //     artist: songsep[1],
  //     albumimg: 'https://i.scdn.co/image/ab67616d00001e02f640ccb7d43d740ab30bc7b5',
  //     track: songsep[0],
  //     // progress: data.body.progress_ms,
  //     // song_length: data.body.item.duration_ms,
  //   };
  // }
  // res.send(data);
});

if (process.env.NODE_ENV === 'production'){
  app.use(express.static(__dirname + '/public/'))

  app.get(/.*/, (req, res) => res.sendFile(__dirname + '/public/index.html'))
}

const port = process.env.PORT || 5000;

// 3600000

app.listen(port, () => console.log(`Server Started on ${port}`));
