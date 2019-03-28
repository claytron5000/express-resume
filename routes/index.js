const express = require('express');
const router = express.Router();
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
// const Handlebars = require('handlebars');

/* GET home page. */
router.get('/', function (req, res, next) {

  fs.readFile('lastFetched.txt', 'utf8', (err, timestamp) => {
    const difference = Date.now() - parseInt(timestamp)
    // Cache the results for 6 minutes
    if (difference < 360000) {
      fs.readFile('resumeObject.json', 'utf8', (err, content) => {
        res.render('index', JSON.parse(content))
      })
    }
    else {
      fs.writeFile('lastFetched.txt', Date.now(), (err) => {
        if (err) console.log(err)
        console.log(difference)
      })
      refreshData();
    }

  });

  function refreshData() {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), doer);

      /**
       * This is the thing to controll all the things
       */
      function doer(auth) {
        const sheets = google.sheets({ version: 'v4', auth });
        // The let is to *let* you know it's going to change as we collect data.
        let resumeObject = {};

        promiseGetter(sheets, 'Basic Info!A1:C')
          .then(res => {
            if (res && res.data && res.data.values) { resumeObject['basicInfo'] = keyColumns(res.data.values) }
            return promiseGetter(sheets, 'Work Experience!A1:E');
          })
          .then(res => {
            if (res && res.data && res.data.values) { resumeObject['workExperience'] = keyColumns(res.data.values) }
            return promiseGetter(sheets, 'AccomplishmentsTranspose!$A:$F');
          })
          .then(res => {
            const array = keyRows(res.data.values)
            if (res && res.data && res.data.values) {
              const workExperience = resumeObject.workExperience.map(business => {
                return business['accomplishments'] = array[business.businessName]
              })
              console.log(workExperience)
            }
            return promiseGetter(sheets, 'Presenting!A1:C');
          })
          .then(res => {
            if (res && res.data && res.data.values) { resumeObject['presenting'] = keyColumns(res.data.values) }
            return promiseGetter(sheets, 'Education!A1:C')
          })
          .then(res => {
            if (res && res.data && res.data.values) { resumeObject['education'] = keyColumns(res.data.values) }
            return resumeObject;
          })
          .then(resumeObject => {
            console.log(resumeObject)
            fs.writeFile('resumeObject.json', JSON.stringify(resumeObject), (err) => {
              console.log('error:', err)
            })
            res.render('index', resumeObject);
          })
          .catch((err) => {
            console.log(err)
          })
      }
    })
  }

});

module.exports = router;

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}



/**
 * Promise wrapper for getter.
 */
function promiseGetter(sheets, range) {
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId: '1TKcDCZ0eILSaa5QCbGLGTQMmw2kmTEUgMLB8W44p8Sk',
      range: range,
    }, (err, res) => {
      if (err) { reject(err) }
      resolve(res)
    })
  })
}

/**
 * Turn the first row of a sheet into the keys for the each row.
 */
function keyColumns(tableArray) {
  // Legitimately the best use of splice.
  const keys = tableArray.splice(0, 1)[0].map(string => camelCaser(string));
  const rows = tableArray

  return rows.map(row =>
    // Reduce on keys so we can define empty values.
    keys.reduce((acc, curr, i) => {
      acc[curr] = row[i] ? row[i] : '';
      return acc;
    }, {})
  );
}

/**
 * Turn the first row of a sheet into keys for array of remainder of column.
 */
function keyRows(tableArray) {
  let accomplishments = {}
  return tableArray.reduce((prev, curr, i) => {
    const key = curr.splice(0, 1)
    const rest = curr
    prev[key] = rest
    return prev
  }, {})
}

/**
 * Turn capitalized and spaced columns names into camelCased variable names.
 * Thanks @CMS https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
 */
function camelCaser(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
}

/**
 * Handlebars null coalesce helper
 */
// Handlebars.registerHelper('nullCoalesce', function (item, replacement) {
//     if (item) {
//         return item;
//     }
//     else {
//         return replacement;
//     }
// })