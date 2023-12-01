# README.md

This tool is meant for searching against  key and/or value patterns in Vault.
It will generate the full path to the identified key.


## Installation Instructions

1. We recommend using `nvm` (Node Version Manager) for managing Node.js versions. You can find installation instructions for `nvm` [here](https://github.com/nvm-sh/nvm#installing-and-updating).
2. Clone the repository to your local machine.
3. Navigate to the project directory.
4. Install the necessary dependencies with `npm install`.

## Environment Management

This project uses environment variables for configuration. These can be set in a `.env` file in the project root. Here is an example `.env` file:
```.env
VAULT_URL=<url>
VAULT_TOKEN=<token>
```

## Command Line Instructions

1. After installing the dependencies, you can run the project using `npm start`.
2. To run tests, use the command `npm test`.
3. For building the project, use `npm run build`.

## ts-node Execution Command Line

To execute TypeScript files directly from the terminal, you can use the `ts-node findVaultPath.ts` command. Here are the options you can pass to the `ts-node findVaultPath.ts` command:

- `--key=^RDS.*`: This option allows you to specify a key.
- `--token=${env:VAULT_TOKEN}`: This option allows you to specify a token.
- `--url=${env:VAULT_URL}`: This option allows you to specify a URL.
- `--csv=output.csv`: This option allows you to specify an output CSV file.
-- `--collect-values`: This flag allows to retrieve values.

Here is an example command line that mirrors the configuration used in the `.vscode/launch.json`:
To execute the `findVaultPath.ts` script using `ts-node`, use the following command:
```shell
ts-node --project tsconfig.json findVaultPath.ts --key=^RDS.* --token=${VAULT_TOKEN} --url=${VAULT_URL} --csv=output.csv
``````

