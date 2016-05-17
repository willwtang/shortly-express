var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  // initialize: function() {
  //   this.on('creating', function(model, attrs, options) {
  //     // var password = model.get('password');
  //     // var salt = bcrypt.genSaltSync(10);
  //     // var hash = bcrypt.hashSync(password, salt);
  //     // model.set('password', hash);
  //     // model.set('salt', salt);

  //     console.log('Successfully created user');
  //   });
  // },
  findOrCreate: function(criteria) {
    new User(criteria).fetch().then(function(exists) {
      if (!exists) {
        Users.create({
          // username: username,
          githubId: criteria.githubId
          // password: password
        })
        .then(function() {
          res.status(200).send('Success!');
        });
      }
    });
  }



  // new User({ username: username }).fetch().then(function(exists) {
  //   if (exists) {
  //     res.status(200).send('User already exists');
  //   } else {
  //     Users.create({
  //       username: username,
  //       password: password
  //     })
  //     .then(function() {
  //       res.status(200).send('Success!');
  //     });
  //   }
  // });
});

module.exports = User;