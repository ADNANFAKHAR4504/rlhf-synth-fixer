# Docker Deployment Guide

This guide explains how to use the Docker container to deploy AWS infrastructure using this repository.

## Prerequisites

- Docker installed on your system
- AWS credentials configured (AWS CLI or environment variables)
- The Docker image from this repository

## Getting Started

### 1. Load the Docker Image

```bash
# Download the Docker image from S3 (requires AWS credentials)
# The S3 location can be found in the metadata.json file in the archived folder
# Format: s3://iac-rlhf-aws-release/{platform}-{language}/Pr{number}/docker-image-{po_id}.tar
aws s3 cp s3://iac-rlhf-aws-release/{platform}-{language}/Pr{number}/docker-image-{po_id}.tar .

# Load the Docker image
docker load -i docker-image-{po_id}.tar

# Run the container
docker run -it --name tap-deployment tap-app:{po_id} /bin/bash
```

**Note**: You need proper AWS credentials configured to download the Docker image from S3. The exact S3 location is stored in the `metadata.json` file under the `dockerS3Location` field.

### 2. Configure AWS Credentials

Inside the container, configure your AWS credentials:

```bash
# Option 1: Configure AWS CLI
aws configure

# Option 2: Set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1

# Option 3: Use AWS profiles
export AWS_PROFILE=your_profile_name
```

### 3. Set Environment Variables

```bash
# Set environment suffix (defaults to 'dev' if not set)
export ENVIRONMENT_SUFFIX=dev

# Optional: Set repository and commit author for tagging
export REPOSITORY=your-repo-name
export COMMIT_AUTHOR=your-name
```

### 4. Install Dependencies

Since the Docker image comes with only the runtime environments (Node.js 22.17.0, Python 3.12.11, and pipenv 2025.0.4), you need to install project dependencies:

```bash
# Install Node.js dependencies
npm ci

# Install Python dependencies (if Pipfile exists)
if [ -f "Pipfile" ]; then
    pipenv install --dev
else
    echo "No Pipfile found, skipping Python dependencies"
fi

# Verify installations
npm list --depth=0
pipenv graph
```

**Note**: This step is required every time you start a new container since dependencies are not pre-installed in the Docker image.

## Deployment Options

This repository supports multiple deployment platforms and languages. Check your `metadata.json` to determine which commands to use.

### Version Verification

Before deploying, verify all versions are correct:

```bash
# Check all versions (Node.js, Python, pipenv)
npm run check-versions

# Individual checks
npm run check-node
npm run check-python
npm run check-pipenv
```

### CDK TypeScript Projects

For CDK projects with TypeScript (`platform: "cdk"`, `language: "ts"`):

```bash
# 1. Build the project
npm run build

# 2. Synthesize CloudFormation templates
npm run cdk:synth

# 3. Bootstrap CDK (first time only)
npm run cdk:bootstrap

# 4. Deploy all stacks
npm run cdk:deploy

# 5. Verify deployment
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```

### CDK Python Projects

For CDK projects with Python (`platform: "cdk"`, `language: "py"`):

```bash
# 1. Install Python dependencies (required)
pipenv install --dev

# 2. Activate virtual environment
pipenv shell

# 3. Synthesize and deploy using CDK
npx cdk synth --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}
npx cdk bootstrap --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}
npx cdk deploy --all --require-approval never --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}
```

### CloudFormation YAML Projects

For CloudFormation YAML projects (`platform: "cfn"`, `language: "yaml"`):

```bash
# 1. Validate CloudFormation template
pipenv run cfn-validate-yaml

# 2. Deploy using AWS CLI
npm run cfn:deploy-yaml

# Alternative: Direct AWS CLI command
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev} \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX:-dev} \
  --tags Repository=${REPOSITORY:-unknown} CommitAuthor=${COMMIT_AUTHOR:-unknown}
```

### CloudFormation JSON Projects

For CloudFormation JSON projects (`platform: "cfn"`, `language: "json"`):

```bash
# 1. Validate CloudFormation template
pipenv run cfn-validate-json

# 2. Deploy using AWS CLI
npm run cfn:deploy-json

# Alternative: Convert YAML to JSON first (if needed)
pipenv run cfn-flip-to-json > lib/TapStack.json
```

## Testing

### Unit Tests

```bash
# TypeScript projects
npm run test:unit

# Python projects
pipenv run test-py-unit
```

### Integration Tests

```bash
# TypeScript projects (requires deployed resources)
npm run test:integration

# Python projects (requires deployed resources)
pipenv run test-py-integration
```

### Linting

```bash
# TypeScript projects
npm run lint

# Python projects
pipenv run lint
```

## Resource Management

### Monitoring Deployment

```bash
# List CloudFormation stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Get stack outputs
aws cloudformation describe-stacks --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev} --query 'Stacks[0].Outputs'

# Monitor CDK stacks
npx cdk list
```

### Cleanup Resources

**⚠️ WARNING: This will delete all deployed resources!**

```bash
# CDK projects
npm run cdk:destroy

# CloudFormation projects
npm run cfn:destroy

# Or directly with AWS CLI
aws cloudformation delete-stack --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure AWS credentials have sufficient permissions
2. **Stack Already Exists**: Use a different `ENVIRONMENT_SUFFIX` or delete existing stack
3. **Bootstrap Required**: Run `npm run cdk:bootstrap` for CDK projects
4. **Version Mismatch**: Run `npm run check-versions` to verify runtime versions

### Debug Commands

```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify AWS region
echo $AWS_DEFAULT_REGION

# Check environment variables
env | grep -E "(AWS_|ENVIRONMENT_)"

# View CDK context
cat cdk.context.json

# Check synthesized templates
ls -la cdk.out/
```

### Logs and Outputs

```bash
# View CDK deployment logs
npx cdk deploy --verbose

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev}

# Check Lambda logs (if applicable)
aws logs describe-log-groups
```

## Advanced Usage

### Custom Environment Suffix

```bash
export ENVIRONMENT_SUFFIX=staging
npm run cdk:deploy
```

### Multiple Regions

```bash
export AWS_DEFAULT_REGION=us-west-2
npm run cdk:bootstrap
npm run cdk:deploy
```

### Development Mode

```bash
# Watch for changes and rebuild
npm run watch

# Start development server (if applicable)
npm start
```

## Support

- Check `lib/PROMPT.md` for project-specific requirements
- Review `lib/MODEL_RESPONSE.md` for expected behavior
- Examine test files in `test/` or `tests/` directories for usage examples
- Refer to `metadata.json` for project configuration details