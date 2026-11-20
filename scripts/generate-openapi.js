'use strict';

const path = require('path');
const fs = require('fs');

require('dotenv').config();

const swaggerSpec = require('../src/docs/swagger');

const outputDir = path.resolve(__dirname, '../.polaira');
const outputFile = path.join(outputDir, 'openapi.json');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(swaggerSpec, null, 2) + '\n');

console.log(`OpenAPI spec written to ${path.relative(process.cwd(), outputFile)}`);
