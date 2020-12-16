// post-install.js

/**
 * Script to run after npm install
 *
 * Copy selected files to user's directory
 */

'use strict';
// User's local directory
var userPath = process.env.INIT_CWD;

const fs = require('fs'); //${userPath}/node_modules/@techops/azure-func
fs.copyFileSync(
  `./tools/app-package-json.ts`,
  `${userPath}/tools/app-package-json.ts`
);
