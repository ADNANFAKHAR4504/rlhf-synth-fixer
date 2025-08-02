# IMPORTANT
# Get ready. 
# Since now Claude Code is available and ready for attempting to complete TAP tasks.
# Medium: solution in 30 mins
# Hard: 2h
# expert: 4h
# ! Team Secret: Call me... 






# TAP - Task Assignment Platform

A TypeScript CDK project for creating and managing RLHF (Reinforcement Learning from Human Feedback) tasks.

## Requirements

**Runtime Versions**: This project requires specific versions of the following tools:
- **Node.js**: v22.17.0 exactly
- **Python**: 3.12.11 exactly
- **Pipenv**: 2025.0.4 exactly

### Quick Setup

Run the setup script to automatically check your runtime versions and install dependencies:

```bash
./setup.sh
```

### Manual Setup

**Node.js Setup:**
If you're using NVM:
```bash
nvm use
```

If you're using nodenv:
```bash
nodenv install 22.17.0
nodenv local 22.17.0
```

**Python Setup:**
If you're using pyenv:
```bash
pyenv install 3.12.11
pyenv local 3.12.11
```

If you're using conda:
```bash
conda install python=3.12.11
```

**Pipenv Setup:**
```bash
pip install pipenv==2025.0.4
```

**Verify all versions:**
```bash
node --version    # Should output: v22.17.0
python --version  # Should output: Python 3.12.11
pipenv --version  # Should output: pipenv, version 2025.0.4
```

## AWS CLI Access

Since engineers don't have direct access to the AWS Console, an EC2 instance has been provided for making queries to the AWS CLI.

**Login to the EC2 instance:**

```bash
ssh -o PreferredAuthentications=password devuser@35.175.34.151
```

**Password**: Ask your team leader for the password.

Once connected to the EC2 instance, you can use standard AWS CLI commands to interact with your AWS resources, check deployment status, and troubleshoot issues.

## CLI Usage

This project includes a CLI tool for creating RLHF tasks with predefined templates and metadata.

### Create an RLHF Task

```bash
npm start rlhf-task
```

If required, run the following command for installing dependencies. Run this command at the root of the repository.

```bash
npm ci
```

This command will launch an interactive prompt that guides you through:

1. **Platform Selection**: Choose the Infrastructure as Code platform:
   - **CDK**: AWS Cloud Development Kit (TypeScript)
   - **CloudFormation**: AWS CloudFormation (YAML or JSON)
2. **Language Selection**: Select based on your platform choice:
   - **CDK**: TypeScript
   - **CloudFormation**: YAML or JSON
3. **Complexity Level**: Set the task complexity (Medium, Hard, Expert)
4. **Turn Type**: Choose between Single or Multi-turn interactions
5. **Task ID**: Enter a unique identifier for the task

The CLI will:

- Copy the appropriate template from `templates/{platform}-{language}/`
- Generate a `metadata.json` file with your task configuration
- Set up the project structure for your RLHF task

#### Creating a CDK TypeScript Task

Choose **CDK** platform and **TypeScript** language to create an AWS CDK project with:

- TypeScript stack definitions
- CDK-specific build and deploy scripts
- Unit and integration tests using CDK testing framework

#### Creating a CloudFormation YAML Task

Choose **CloudFormation** platform and **YAML** language to create a CloudFormation project with:

- YAML template definitions
- CloudFormation-specific deploy and destroy scripts
- Stack-level parameter and tag support

#### Creating a CloudFormation JSON Task

Choose **CloudFormation** platform and **JSON** language to create a CloudFormation project with:

- JSON template definitions
- CloudFormation-specific deploy and destroy scripts
- Stack-level parameter and tag support

### Generated Files

After running the CLI, you'll have:

- **metadata.json**: Contains task metadata (platform, language, complexity, turn type, task ID)
- **Project files**: Copied from the selected template (bin/, lib/, test/, cdk.json)

## Development Commands

### Build and Test Commands

- `npm ci`          installs dependencies exactly as specified in package-lock.json
- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `npm run test:unit`    perform only unit tests
- `npm run test:integration`    perform only integration tests

### CDK Commands

- `npm run cdk:synth`   synthesize CloudFormation template from CDK code
- `npm run cdk:deploy`  deploy CDK stack to your default AWS account/region
- `npm run cdk:destroy` destroy CDK stack and all resources
- `npx cdk diff`    compare deployed stack with current state
- `npx cdk bootstrap` bootstrap CDK in your AWS account/region

### CloudFormation Commands

- `npm run cfn:deploy-yaml`  deploy CloudFormation YAML stack to AWS
- `npm run cfn:deploy-json`  deploy CloudFormation JSON stack to AWS
- `npm run cfn:destroy-yaml` destroy CloudFormation YAML stack and all resources
- `npm run cfn:destroy-json` destroy CloudFormation JSON stack and all resources

### Terraform Commands
Quick Note:
Install terraform cli on your computer: https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli

- To init Terraform config: `npm run tf:init`
- To preview changes: `npm run tf:plan`
- To Deploy your changes: `npm run tf:deploy`
- To Destroy your changes: `npm run tf:destroy`
- To Refresh TF state your changes: `npm run tf:refresh`
- To Get lost state file: `npm run tf:reconfigure`
- To Format your changes: `npm run tf:fmt`
- For Quick reminder: `npm run tf:help`
- For Validate Hashicorp syntax: `npm run tf:validate`
- For Get TF state in json: `npm run tf:output`

## Templates

Templates are stored in the `templates/` directory and organized by platform and language:

```text
templates/
├── cdk-ts/       # CDK TypeScript template
├── cdk-ts/       # CDK TypeScript template
├── cfn-yaml/     # CloudFormation YAML template
├── cfn-json/     # CloudFormation JSON template
├── tf-hcl/       # Terraform Hashicorp template
└── ...
```

Each template contains a complete project structure that gets copied when creating a new RLHF task.

## Special Instructions/Guidelines for CDK Terraform

- The workflow has been created in a way that the trainer does not need to worry about configuring the AWS Provider or the Remote S3 Backend - it comes configured in the `lib/tap-stack.ts` or `lib/tap-stack.py` file.
- To ensure the above setup executes correctly, please make any stacks you create extend the `Construct` class instead of the `TerraformStack` class, as opposed to the usual practice. The `TerraformStack` requires its own backend to be configured and we do not want a situation of duplicate backends in the same application, across stacks.
- Please prompt the LLM models you use for the problem accordingly - include something like the following snippet in your prompt - 
  ```
  - Complete **CDKTF code in TypeScript**, including all necessary imports and constructs
    - Create the entire solution as a single stack. 
    - Make the stack extend the Construct class instead of the TerraformStack class. 
    - Omit code to initialize AWS Providers or backends.
    - Generate only the code for this stack, do not include main entrypoint code.
  ```