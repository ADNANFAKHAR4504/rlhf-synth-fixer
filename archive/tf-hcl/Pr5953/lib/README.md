# IMPORTANT

# Get ready.

# Medium: solution in 30 mins

# Hard: 2h

# expert: 4h

# ! Team Secret: Call me...

## ✅ CI/CD Pipeline Status: COMPLETE

**All pipeline stages successfully implemented and tested:**
- ✅ Build & Lint: Pass
- ✅ Synth: CloudFormation templates generated
- ✅ Unit Tests: 30/30 passing
- ✅ Deploy: Stack deployed with conditional secrets and timestamp naming
- ✅ Integration Tests: 13/13 passing with dynamic infrastructure validation

**Dynamic Testing Implemented:** All tests now dynamically discover and validate live deployed AWS resources using AWS CLI, ensuring no mocked values as requested.

# TAP - Task Assignment Platform

A TypeScript CDK project for creating and managing RLHF (Reinforcement Learning from Human Feedback) tasks.

## Requirements

**Runtime Versions**: This project requires specific versions of the following tools:

- **Node.js**: v22.17.0 exactly
- **Python**: 3.13.x
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
pyenv install 3.13
pyenv local 3.13
```

If you're using conda:

```bash
conda install python=3.13
```

**Pipenv Setup:**

```bash
pip install pipenv==2025.0.4
```

**Verify all versions:**

```bash
node --version    # Should output: v22.17.0
python --version  # Should output: Python 3.13.x
pipenv --version  # Should output: pipenv, version 2025.0.4
```

## AWS CLI Access

Since engineers don't have direct access to the AWS Console, an EC2 instance has been provided for making queries to the AWS CLI.

**Login to the EC2 instance:**

```bash
ssh -o PreferredAuthentications=password trainer@52.201.128.13
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
   - **CDK**: AWS Cloud Development Kit (TypeScript, Python)
   - **CDKTF**: CDK for Terraform (TypeScript, Python)
   - **CloudFormation**: AWS CloudFormation (YAML or JSON)
   - **Terraform**: Terraform HCL
   - **Pulumi**: Pulumi (TypeScript, Python, Java)
2. **Language Selection**: Select based on your platform choice:
   - **CDK**: TypeScript, Python
   - **CDKTF**: TypeScript, Python
   - **CloudFormation**: YAML or JSON
   - **Terraform**: HCL
   - **Pulumi**: TypeScript, Python, Java
3. **Complexity Level**: Set the task complexity (Medium, Hard, Expert)
4. **Turn Type**: Choose between Single or Multi-turn interactions
5. **Task ID**: Enter a unique identifier for the task
6. **Team Selection**: Choose from team 1-6 or the synth team

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

#### Creating a Pulumi Java Task

Choose **Pulumi** platform and **Java** language to create a Pulumi project with:

- Java source code using Pulumi AWS SDK
- Gradle build configuration with testing framework
- Unit and integration tests using JUnit
- Checkstyle linting configuration

### Generated Files

After running the CLI, you'll have:

- **metadata.json**: Contains task metadata (platform, language, complexity, turn type, task ID)
- **Project files**: Copied from the selected template (bin/, lib/, test/, cdk.json)

## Commit Message Guidelines

To maintain a clear and consistent commit history, we adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification. This helps in automating changelog generation and understanding the nature of changes at a glance.

### Format

Each commit message consists of a **header**, a **body**, and a **footer**.

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

**Note:** The body of the commit message has a line length limit of 100 characters.

#### Writing Multiline Commit Messages

To write a multiline commit message, you can use the following methods:

1.  **Using `git commit`:**

    Running `git commit` without the `-m` flag will open your default text editor, allowing you to write a detailed commit message. The first line will be the subject, followed by a blank line and the body of the commit.

2.  **Using `-m` flags:**

    You can use multiple `-m` flags to create a multiline commit message. The first `-m` will be the subject, and subsequent `-m` flags will be paragraphs in the body.

    ```bash
    git commit -m "feat(api): Add new endpoint" -m "This endpoint allows users to retrieve their profile information."
    ```

### Example

#### For a new feature:

```
feat(lambda): TASK-123 - Add support for S3 event triggers

- Implemented a new Lambda function that processes images uploaded to the `images` S3 bucket.
- The function resizes images to 100x100 and saves them to the `thumbnails` bucket.
```

#### For a bug fix:

```
fix(api): TASK-456 - Correct the endpoint for user profile updates

- The `PUT /users/{id}` endpoint was incorrectly pointing to the `createUser` function.
- This has been corrected to point to the `updateUser` function.
```

### Types

The following are the most common types to use:

- **feat**: A new Task. (Appears in the changelog)
- **fix**: A fix for a task. (Appears in the changelog)

### Other Types

Commits with the following types will not appear in the changelog. Use these for internal changes, maintenance, or documentation.

- **chore**: Changes to the build process or auxiliary tools.

  ```
  chore(deps): TASK-789 - Update dependency `some-library` to v2.0.0
  ```

- **ci**: Changes to CI configuration files and scripts.

  ```
  ci(github-actions): TASK-101 - Add a new step to run linting
  ```

- **docs**: Documentation only changes.

  ```
  docs(readme): TASK-112 - Update the setup instructions
  ```

- **test**: Adding missing tests or correcting existing tests.
  ```
  test(lambda): TASK-314 - Add unit tests for the S3 event handler
  ```

## Development Commands

### Build and Test Commands

- `npm ci` installs dependencies exactly as specified in package-lock.json
- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run test:unit` perform only unit tests
- `npm run test:integration` perform only integration tests

### CDK Commands

- `npm run cdk:synth` synthesize CloudFormation template from CDK code
- `npm run cdk:deploy` deploy CDK stack to your default AWS account/region
- `npm run cdk:destroy` destroy CDK stack and all resources
- `npx cdk diff` compare deployed stack with current state
- `npx cdk bootstrap` bootstrap CDK in your AWS account/region

### CloudFormation Commands

- `npm run cfn:deploy-yaml` deploy CloudFormation YAML stack to AWS
- `npm run cfn:deploy-json` deploy CloudFormation JSON stack to AWS
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

### Java Development Commands

**Prerequisites for Java Development:**

- **Java 17 or later** (required for CI compatibility)
- **Gradle** (included as wrapper in project)

#### Gradle Installation Guide

If you don't have Java installed or need Java 17:

**Option 1: Using SDKMAN (Recommended)**

```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Install Java 17
sdk install java 17.0.9-tem
sdk use java 17.0.9-tem

# Verify installation
java -version  # Should show Java 17
```

**Option 2: Using Package Managers**

On macOS:

```bash
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

On Windows:

- Download OpenJDK 17 from [Adoptium](https://adoptium.net/)
- Install and set JAVA_HOME environment variable

#### Java Build Commands

**Note**: This project uses Gradle wrapper (`./gradlew`), so you don't need to install Gradle separately.

```bash
# Build the Java project
./gradlew build

# Clean build artifacts
./gradlew clean

# View available Gradle tasks
./gradlew tasks
```

#### Java Testing Commands

**Unit Tests:**

```bash
# Run all unit tests (shows pass/fail results)
./gradlew test

# Run unit tests with coverage report and summary
./gradlew test showCoverage

# Run specific test class
./gradlew test --tests "app.MainTest"

# Force clean run (ignore cache)
./gradlew clean test showCoverage
```

**Integration Tests:**

```bash
# Run integration tests
./gradlew integrationTest

# Run ALL tests with detailed results and coverage
./gradlew testAll

# Run all tests (unit + integration) with coverage verification
./gradlew check showCoverage

# View coverage report only (after running tests)
./gradlew showCoverage
```

**Test Reports:**
After running tests, reports are available at:

- Unit test report: `build/reports/tests/test/index.html`
- Integration test report: `build/reports/tests/integrationTest/index.html`
- Coverage report: `build/reports/jacoco/test/html/index.html`

#### Java Linting Commands

This project uses Checkstyle for Java code quality:

```bash
# Run Checkstyle linting
./gradlew checkstyleMain checkstyleTest

# Run all quality checks (includes tests + linting)
./gradlew check

# Generate Checkstyle reports
./gradlew checkstyleMain
# Report available at: build/reports/checkstyle/main.html
```

### CloudFormation (cfn-yaml/cfn-json) S3 Bucket Setup

**Important Note**: When deploying CloudFormation templates to a specific AWS region for the first time, you need to create the S3 bucket that stores the CloudFormation state files.

This is a **one-time setup** per region. Run this in your terminal before your first deployment in a new region:

```bash
# Replace 'us-east-2' with your target region
aws s3 mb s3://iac-rlhf-cfn-states-us-east-2 --region us-east-2
```

The bucket naming pattern is: `iac-rlhf-cfn-states-${AWS_REGION}`

After creating the bucket, set your region environment variable:

```bash
export AWS_REGION=us-east-2
```

Then proceed with your normal CloudFormation deployment:

```bash
PLATFORM="cfn" npm run cfn:deploy-yaml
```

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

  