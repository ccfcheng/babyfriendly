if (!process.env.FB_PAGE_TOKEN) {
  console.log('Error: Specify FB_PAGE_TOKEN in environment');
  process.exit(1);
}

if (!process.env.FB_VERIFY_TOKEN) {
  console.log('Error: Specify FB_VERIFY_TOKEN in environment');
  process.exit(1);
}

var Botkit = require('botkit');
var os = require('os');
var localtunnel = require('localtunnel');
var http = require('http');
var https = require('https');
var url = require('url');
var moment = require('moment');


var controller = Botkit.facebookbot({
  debug: !!process.env.BOT_DEBUG,
  access_token: process.env.FB_PAGE_TOKEN,
  verify_token: process.env.FB_VERIFY_TOKEN,
});

var bot = controller.spawn({
});
// Helper to wrap the https get request
// Configure with opts object, cb is invoked on JSON response
var fetch = function(opts, cb, message) {
  https.get(opts, function(res) {
    var body = '';
    res.on('data', function(d) {
      body += d;
    });
    res.on('end', function() {
      cb(JSON.parse(body), message);
    });
  });
};

var sendWyndowEvents = function(resData, message) {
  var results = resData.results;
  var elements = [];
  results.forEach(function(event) {
    elements.push(makeEventTemplate(event));
  });
  var attachment = {
    'type': 'template',
    'payload': {
      'template_type': 'generic',
      'elements': elements,
    },
  };
  bot.reply(message, {attachment: attachment});
};

var makeEventTemplate = function(event) {
  var template = {};
  template.title = event.name + ' - ' + moment(event.startDate).format('h:mm A');
  template.image_url = event.image || 'http://static.wyndow.com/assets/cityscape.jpg';
  template.subtitle = event.location.address;
  template.buttons = [{
    type: 'web_url',
    url: event.offers.url,
    title: 'More Info',
  }];
  return template;
};

var makeProfileTemplate = function(fbUser) {
  return {
    'type':'template',
    'payload':{
      'template_type':'generic',
      'elements':[{
        'title':fbUser.first_name + ' ' + fbUser.last_name,
        'image_url':fbUser.profile_pic,
        'subtitle':'A Facebook user',
      }],
    },
  };
};

var handleLocation = function(message) {
  // If message is a location, run this
  if (message.attachments && message.attachments[0].type === 'location') {
    var coords = message.attachments[0].payload.coordinates;
    var start = moment();
    var end = start.clone().add(1, 'd').hour(0).minute(0).second(0).millisecond(0);
    var apiURL = url.format({
      protocol: 'https',
      slashes: true,
      host: 'api.stage.wyndow.com',
      pathname: 'v1/events',
      query: {
        latitude: coords.lat,
        longitude: coords.long,
        startDate: start.format('YYYY-MM-DDTHH:mm:ss'),
        endDate: end.format('YYYY-MM-DDTHH:mm:ss'),
        distance: '10mi',
        perPage: 10,
      },
    });
    console.log('url:', apiURL);
    fetch(apiURL, sendWyndowEvents, message);
  }
};

controller.setupWebserver(process.env.port || 3000, function (err, webserver) {
  controller.createWebhookEndpoints(webserver, bot, function () {
    console.log('ONLINE!');
    if (process.env.BOT_LT) {
      var lt_opts = process.env.BOT_LTSUBDOMAIN ? {subdomain:process.env.BOT_LTSUBDOMAIN} : {};
      var tunnel = localtunnel(process.env.port || 3000, lt_opts, function (err, tunnel) {
        if (err) {
          console.log(err);
          process.exit();
        }
        console.log("Your bot is available on the web at the following URL: " + tunnel.url + '/facebook/receive');
      });

      tunnel.on('close', function () {
        console.log("Your bot is no longer available on the web at the localtunnnel.me URL.");
        process.exit();
      });
    }
  });
});

controller.hears(['image (.*)', 'img (.*)'], 'message_received', function (bot, message) {
  var tag = message.match[1].replace(/\s/g, '+');
  var opts = {
      host: 'api.giphy.com',
      path: '/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag='+tag
  };

  http.get(opts, function (response) {
      var body = '';
      response.on('data', function (d) {
          body += d;
      });
      response.on('end', function () {
          var parsed = JSON.parse(body);
          bot.reply(message, {
            attachment: {
              type: 'image',
              payload: {
                url: parsed.data.image_url
              }
            }
          });
      });
  });
});

var getFBProfile = function(message, userID) {
  var permissions = '?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=';
  var opts = {
    host: 'graph.facebook.com',
    path: '/v2.6/' + userID + permissions + process.env.FB_PAGE_TOKEN
  };
  https.get(opts, function(res) {
    var body = '';
    res.on('data', function(d) {
      body += d;
    });
    res.on('end', function() {
      var fbUser = JSON.parse(body);
      var attachment = makeProfileTemplate(fbUser);
      // first_name, last_name, profile_pic
      bot.reply(message, {
        attachment: attachment,
      });
    });
  });
};

controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {
  // console.log('message:', message);
  var user = message.user;
  var permissions = '?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=';
  var opts = {
    host: 'graph.facebook.com',
    path: '/v2.6/' + user + permissions + process.env.FB_PAGE_TOKEN
  };
  https.get(opts, function(res) {
    var body = '';
    res.on('data', function(d) {
      body += d;
    });
    res.on('end', function() {
      var fbUser = JSON.parse(body);
      var attachment = makeProfileTemplate(fbUser);
      // first_name, last_name, profile_pic
      bot.reply(message, {
        attachment: attachment,
      });
    });
  });
});

controller.on('facebook_postback', function(bot, message) {
  bot.reply(message, 'Great Choice!!!! (' + message.payload + ')');
});

controller.hears(['what is my name', 'who am i'], 'message_received', function(bot, message) {
  getFBProfile(message, message.user);
});

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'], 'message_received',
    function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':|] I am a bot. I have been running for ' + uptime + ' on ' + hostname + '.');
    });



controller.on('message_received', function(bot, message) {
  // console.log('message:', message);
  handleLocation(message);
  return false;
});


function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
