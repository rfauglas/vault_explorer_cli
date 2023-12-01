import vault from 'node-vault';
// import yargs from 'yargs';
import yargs from 'yargs/yargs';
import * as fs from 'fs';

import * as csvWriter from 'csv-write-stream';

// Define Entry type with path, key, and optional value
type Entry = {
  path: string;
  key: string;
  value?: string;
};

// Parse command line arguments
const argv = yargs(process.argv.slice(2))
  .option('k', {
    alias: 'key',
    description: 'Key pattern',
    type: 'string',
  })
  .option('v', {
    alias: 'value',
    description: 'Value pattern',
    type: 'string',
  })
  .option('t', {
    alias: 'token',
    description: 'Vault token',
    type: 'string',
  })
  .option('u', {
    alias: 'url',
    description: 'Vault URL',
    type: 'string',
  })
  .option('csv', {
    alias: 'csv',
    description: 'CSV output file with path and key as columns',
    type: 'string',
  })
  .option('p', {
    alias: 'print',
    description: 'Print values as a column in the CSV output',
    type: 'boolean',
  })
  .option('c', {
    alias: 'collect-values',
    description: 'Collect values as an optional value',
    type: 'boolean',
  })
  .check(argv => {
    if (argv.k || argv.v) {
      return true;
    } else {
      throw new Error('Please provide at least one pattern to match (-k or -v)');
    }
  })
  .help()
  .alias('help', 'h')
  .argv  as { [x: string]: unknown; t: string | undefined; u: string | undefined; k: string; v: string|undefined; p: boolean|undefined; c: boolean|undefined; _: (string | number)[]; $0: string; };

// Initialize the vault client
const options = {
  apiVersion: 'v1', // default
  endpoint: argv.u || process.env.VAULT_URL || 'http://127.0.0.1:8200', // use command line argument, environment variable, or default
  token: argv.t || process.env.VAULT_TOKEN || '123', // use command line argument, environment variable, or default
};

const client = vault(options);

// Function to recursively retrieve all paths that match a given key pattern
async function getMatchingPaths(
    path: string = 'secret/metadata/',
    collectedData: Array<Entry> = []
  ): Promise<Array<Entry>> {      
    try {
      // List all secrets in the secret engine at the given path
      const listResult = await client.list(path).catch((error: any) => {
        console.error(`Error listing secrets at path ${path}:`, error);
        throw error; // Rethrow the error to handle it in the outer catch block
      });
  
      // Process each key and recurse if it is a folder, or retrieve secret if it's a key
      for (const key of listResult.data.keys) {
        const fullPath = `${path}${key}`;
        if (key.endsWith('/')) {
          // It's a folder, recurse into it
          await getMatchingPaths(fullPath, collectedData);
        } else {
          // It's a secret, construct the path to read its data
          const dataPath = fullPath.replace('metadata', 'data');
          // Retrieve the secret's data
          const secretResult = await client.read(dataPath).catch((error: any) => {
            console.error(`Error reading secret at path ${dataPath}:`, error);
            throw error; // Rethrow the error to handle it in the outer catch block
          });
  
        // Match the keys within the secret against the provided key pattern
        const keyPattern = argv.k ? new RegExp(argv.k) : null; // Create a RegExp from the key pattern if provided
        const valuePattern = argv.v ? new RegExp(argv.v) : null; // Create a RegExp from the value pattern if provided
        const secretData = secretResult.data.data; // Adjust this according to the structure of your secret data

        for (const [secretKey, secretValue] of Object.entries(secretData)) {
        let keyMatch = keyPattern ? keyPattern.test(secretKey) : false;
        let valueMatch = valuePattern ? valuePattern.test((secretValue as string).toString()) : false;

        // If the key matches the key pattern or the value matches the value pattern, collect the path, key, and value
        if (keyMatch || valueMatch) {
            collectedData.push({ path: fullPath, key: secretKey, value: argv.c ? secretValue as string : undefined });
        }
        }
          }
      }
    } catch (error) {
      console.error(`Error retrieving paths: ${(error as Error).message}`);
      return collectedData; // Exit the function on error
    }
    return collectedData;
  }
  
// Call the function
async function main() {
    var collectedData = await getMatchingPaths();
    if (typeof argv.csv === 'string') {
        // User has provided a file name, write to CSV
        const headers = argv.p ? ['path', 'key', 'value'] : ['path', 'key','value'];
        const writer = csvWriter.default({ headers: headers });
        writer.pipe(fs.createWriteStream(argv.csv));
        collectedData.forEach(data => writer.write(argv.p ? [data.path, data.key, data.value] : [data.path, data.key, data.value]));
        writer.end();
        console.log(`Data written to CSV file: ${argv.csv}`);
      } else {
        // No file provided, just log the data
        console.log(collectedData);
      }
      }
  
  main();