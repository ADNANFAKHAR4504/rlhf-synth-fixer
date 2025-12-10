# LocalStack Integration Implementation

## Overview

I have successfully integrated LocalStack support into our IaC test automation pipeline. This allows developers to test infrastructure deployments locally using LocalStack before deploying to real AWS services. The implementation supports all our platforms: CDK, CloudFormation, Terraform, CDKTF, and Pulumi.

## What Was Implemented

### 1. Task Creation CLI Updates

Modified the `cli/create-task.ts` file to add provider selection as the very first question when running `npm start rlhf-task`. Users now see two options:
- AWS (Real AWS Services)
- LocalStack (Local AWS Emulation)

When a user selects LocalStack, the following happens automatically:

- The provider field is added to metadata.json
- A docker-compose.yml file is created in the project root for easy LocalStack setup
- A lib/localstack-env.sh file is generated with LocalStack environment variables
- A lib/LOCALSTACK.md file is created with documentation on how to use LocalStack

The metadata.json interface was updated to include a new optional field called "provider" that stores either "aws" or "localstack".

### 2. Metadata Detection Script

Updated `scripts/detect-metadata.sh` to read and export the provider field from metadata.json. The script now:
- Extracts the provider value (defaults to "aws" if not specified)
- Exports it as an environment variable for use in other scripts
- Outputs it to GitHub Actions for use in the CI/CD pipeline

### 3. CI/CD Workflow Changes

Made comprehensive updates to `.github/workflows/ci-cd.yml`:

**Added provider to detect-metadata job outputs**
The detect-metadata job now outputs the provider value so other jobs can access it.

**Updated deploy job**
- Added a new step that starts LocalStack using `scripts/localstack-start-ci.sh` when provider is localstack
- Modified the deploy step to check the provider and use either `localstack-ci-deploy.sh` or the regular `deploy.sh`
- Passes the LOCALSTACK_API_KEY from GitHub Secrets to both the start and deploy steps

**Updated integration-tests-live job**
- Added conditional AWS configuration that only runs when provider is aws
- Added a step to start LocalStack when provider is localstack
- Modified the test step to use either `localstack-ci-test.sh` or `integration-tests.sh` based on provider
- Passes the LOCALSTACK_API_KEY to both start and test steps

**Left other jobs unchanged**
- Unit tests continue to use the normal flow (language-determined, no LocalStack changes)
- Build, lint, and other jobs remain as they were

### 4. LocalStack CI Scripts

Created three new scripts specifically for CI/CD LocalStack operations:

**scripts/localstack-start-ci.sh**
This script starts LocalStack using Docker in CI environments. It:
- Checks if Docker is installed
- Removes any existing LocalStack containers
- Starts a new LocalStack container with all required AWS services
- Waits for LocalStack to be healthy (up to 60 attempts)
- Supports the LOCALSTACK_API_KEY environment variable for Pro features
- Shows detailed status and health information

**scripts/localstack-ci-deploy.sh**
A comprehensive deployment script that handles all platforms. It:
- Reads the platform from metadata.json in the project root
- Changes to the lib directory where infrastructure code lives
- Sets up LocalStack environment variables (endpoint URL, credentials, region)
- Deploys based on the detected platform:
  - CDK: Uses cdklocal bootstrap and cdklocal deploy
  - CloudFormation: Uses AWS CLI with LocalStack endpoint
  - Terraform: Uses tflocal init, plan, and apply
  - CDKTF: Uses cdktf synth and cdktf deploy
  - Pulumi: Configures Pulumi for LocalStack and runs pulumi up
- Includes proper error handling and colored output for better readability

**scripts/localstack-ci-test.sh**
Runs integration tests against deployed LocalStack infrastructure. It:
- Detects the platform from metadata.json
- Sets up LocalStack environment variables
- Runs platform-specific tests:
  - CDK/CDKTF: Runs npm test if package.json exists
  - CloudFormation: Verifies stack deployment with AWS CLI
  - Terraform: Runs Go tests or bash test scripts
  - Pulumi: Verifies stack and runs language-specific tests
  - Generic: Runs tests based on language (npm test, pytest, go test)
- Checks both tests and test directories for test files

### 5. Setup Environment Action Updates

Modified `.github/actions/setup-environment/action.yml` to:

**Added a new provider input parameter**
This allows jobs to specify whether they need LocalStack tools.

**Added LocalStack dependencies installation step**
When provider is localstack, this step installs:
- LocalStack CLI (localstack and localstack-ext)
- AWS CLI Local (awscli-local) - wrapper for AWS CLI
- CDK Local (aws-cdk-local) - wrapper for CDK
- Terraform Local (terraform-local) - wrapper for Terraform
- CDKTF CLI when platform is cdktf
- Verifies all installations with version checks

**Updated workflow jobs to pass provider parameter**
Only the deploy and integration-tests-live jobs receive the provider parameter. Other jobs (build, lint, unit-tests, iac-optimization) do not get LocalStack tools installed, keeping them fast and efficient.

### 6. LocalStack API Key Configuration

The implementation uses the LOCALSTACK_API_KEY from GitHub Secrets to enable LocalStack Pro features. The key is:
- Passed to the localstack-start-ci.sh script when starting the container
- Exported as an environment variable during deployment
- Exported as an environment variable during testing

The actual key value that needs to be added to GitHub Secrets is:
`ls-COfECODE-WOBe-GEyu-KIfe-5500HEFE0a7b`

This should be added in the repository settings under:
Settings > Secrets and variables > Actions > New repository secret
Name: LOCALSTACK_API_KEY
Value: (the key above)

### 7. Platform-Specific LocalStack Scripts

Created additional platform-specific deployment scripts:

**scripts/localstack-cdktf-deploy.sh**
Handles CDKTF deployments to LocalStack with npm dependency installation and cdktf commands.

**scripts/localstack-pulumi-deploy.sh**
Handles Pulumi deployments to LocalStack with support for TypeScript, Python, and Go projects. Configures Pulumi endpoints for LocalStack services.

## How It Works

The flow is straightforward:

1. Developer runs `npm start rlhf-task`
2. First question asks: AWS or LocalStack?
3. Developer selects LocalStack
4. Continues with normal flow (platform, language, team, AWS services, etc.)
5. Metadata.json is generated with provider: "localstack"
6. LocalStack configuration files are created in lib and project root
7. Developer writes infrastructure code in lib directory
8. When PR is created, CI/CD detects provider from metadata.json
9. Deploy job installs LocalStack tools and starts LocalStack container
10. Deploy job runs localstack-ci-deploy.sh which deploys to LocalStack
11. Integration tests job starts LocalStack and runs tests against it
12. All other jobs run normally without LocalStack

## Benefits

- Developers can test infrastructure locally without AWS costs
- Faster iteration cycles during development
- Same CI/CD pipeline supports both AWS and LocalStack
- All platforms (CDK, CloudFormation, Terraform, CDKTF, Pulumi) are supported
- Easy to switch between AWS and LocalStack by just changing metadata.json
- LocalStack Pro features available via API key
- Clean separation - LocalStack tools only installed where needed

## Files Modified

- cli/create-task.ts
- scripts/detect-metadata.sh
- .github/workflows/ci-cd.yml
- .github/actions/setup-environment/action.yml

## Files Created

- scripts/localstack-start-ci.sh
- scripts/localstack-ci-deploy.sh
- scripts/localstack-ci-test.sh
- scripts/localstack-cdktf-deploy.sh
- scripts/localstack-pulumi-deploy.sh

## Testing

To test this implementation:

1. Run `npm start rlhf-task`
2. Select "LocalStack (Local AWS Emulation)"
3. Complete the rest of the task setup
4. Write infrastructure code in lib directory
5. Create a PR
6. Watch the CI/CD pipeline deploy to LocalStack instead of AWS

The deployment will use LocalStack endpoints, test credentials, and run entirely locally in the GitHub Actions runner.

## Notes

- The normal AWS deployment flow is completely preserved and unaffected
- Bootstrap step in deploy job runs before LocalStack start (bootstrap is for AWS, not LocalStack)
- Unit tests remain language-determined and do not use LocalStack
- Integration tests can run against either LocalStack or real AWS based on provider
- All scripts include proper error handling and colored output for debugging
