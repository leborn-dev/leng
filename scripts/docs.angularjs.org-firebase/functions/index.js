'use strict';

const functions = require('firebase-functions/v1');
const fs = require('fs');
const path = require('path');

const BROWSER_CACHE_DURATION = 60 * 60;
const CDN_CACHE_DURATION = 60 * 60 * 12;

const headers = {
  'Cache-Control': `public max-age=${BROWSER_CACHE_DURATION} s-maxage=${CDN_CACHE_DURATION}`
};

const buildSnapshot = data => `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <base href="/">
    </head>
    <body>
      ${data}
    </body>
  </html>`;

function sendFile(request, response) {

  const snapshotRequested = typeof request.query._escaped_fragment_ !== 'undefined';
  let filePath = 'content/index.html';
  if (snapshotRequested) {
    const partialsRoot = path.resolve(__dirname, 'content/partials');
    let requestPath;
    try { requestPath = decodeURIComponent(request.path); } catch (error) {
      return response.status(404).end();
    }
    filePath = path.resolve(partialsRoot, `.${requestPath}.html`);
    if (requestPath.includes('\\') || requestPath.includes('\0') || !filePath.startsWith(partialsRoot + path.sep)) {
      return response.status(404).end();
    }
  }

  if (snapshotRequested) {
    fs.readFile(filePath, {encoding: 'utf8'}, (error, data) => {
      if (error) {
        response
          .status(404)
          .end();
      } else {
        response
          .set(headers)
          .send(buildSnapshot(data));
      }
    });
  } else {
    response
      .set(headers)
      .sendFile(filePath, {root: __dirname});
  }
}

exports.sendFile = functions.https.onRequest(sendFile);
