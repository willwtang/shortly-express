var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');  // dependency of passport
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

var github = require('./env/config.js');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GitHubStrategy({
  clientID: github.GITHUB_CLIENT_ID,
  clientSecret: github.GITHUB_CLIENT_SECRET,
  callbackURL: 'http://127.0.0.1:3000/auth/github/callback'
},
function(accessToken, refreshToken, profile, done) {
  User.findOrCreate({ githubId: profile.id }, function (err, user) {
    return done(err, user);
  });
}
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});



app.get('/', 
// passport.authenticate('local'),
function(req, res) {
    res.render('index');
});

// app.get('/signup',
// function(req, res) {
//   res.render('signup');
// });

// app.post('/signup',
// function(req, res) {
//   var username = req.body.username;
//   var password = req.body.password;

//   new User({ username: username }).fetch().then(function(exists) {
//     if (exists) {
//       res.status(200).send('User already exists');
//     } else {
//       Users.create({
//         username: username,
//         password: password
//       })
//       .then(function() {
//         res.status(200).send('Success!');
//       });
//     }
//   });

// });

app.get('/create', 
function(req, res) {
  if ('user' in req.session) {
    res.render('index');
    return;
  }
  res.redirect(301, '/login');
});

app.get('/links', 
function(req, res) {
  if ('user' in req.session) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
    return;
  }
  res.redirect(301, '/login');
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// app.get('/login', 
// function(req, res) {
//   res.render('login');
// });

// app.post('/login',
// function(req, res) {
//   var username = req.body.username;
//   var password = req.body.password;

//   new User({ username: username }).fetch().then(function(exists) {
//     if (!exists) {
//       res.status(200).send('User doesn\'t exist');
//     } else {
//       var authenticated = util.passwordMatch(password, exists.attributes.password, exists.attributes.salt);
//       if (authenticated) {
//         req.session.user = username;
//         res.redirect('/');
//         res.end();
//         return;
//       } 
//       res.end('Error');
//     }
//   });  
// });

app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  function(req, res) {
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('127.0.0.1:4568/');
  });

app.get('/logout', 
function(req, res) {
  req.logout();
  // req.session.destroy();
  res.redirect('/login');
  res.end();
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
