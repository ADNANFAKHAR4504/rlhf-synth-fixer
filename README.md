# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npm run test:unit`    perform only unit tests
* `npm run test:integration`    perform only integration tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Integration Tests

The integration tests in `test/tap-stack.int.test.ts` make real HTTP requests to your deployed API Gateway endpoint. 

### Setup for Integration Tests

1. Deploy your stack first: `npx cdk deploy`
2. Set the required environment variables:
   ```bash
   export API_GATEWAY_ENDPOINT=https://your-api-id.execute-api.region.amazonaws.com/prod
   export READ_ONLY_API_KEY=your-read-only-api-key
   export ADMIN_API_KEY=your-admin-api-key
   ```
3. Run the integration tests: `npm run test:integration`

### What the Integration Tests Cover

- **PUT operations**: Creating new records, handling duplicates, validation errors
- **GET operations**: Retrieving records, handling non-existent records
- **PATCH operations**: Updating existing records, validation
- **DELETE operations**: Removing records, idempotency
- **API Key Authentication**: Testing both read-only and admin keys
- **Rate Limiting**: Validating throttling behavior
- **Content-Type Validation**: Ensuring proper request headers

Note: Integration tests require a deployed API Gateway endpoint and will make real requests to AWS services.

## VS Code Configuration

This project includes VS Code configuration files in the `.vscode/` directory:

- **`settings.json`**: Jest integration with environment variables, TypeScript settings, and project preferences
- **`launch.json`**: Debug configurations for Jest tests and CDK commands
- **`tasks.json`**: Build and test tasks accessible via `Ctrl+Shift+P` > "Tasks: Run Task"
- **`extensions.json`**: Recommended extensions for AWS CDK and TypeScript development

### Environment Variables in VS Code

The VS Code configuration includes default environment variables for Jest. Update them in:
- `.vscode/settings.json` - for Jest extension
- `.vscode/launch.json` - for debugging  
- `.vscode/tasks.json` - for task runner

Or use a `.env.local` file and the terminal for running tests.
