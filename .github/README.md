# GitHub Actions CI/CD Setup

This document describes how to set up the required secrets and variables for the GitHub Actions CI/CD pipeline.

## Required GitHub Secrets

Navigate to your repository **Settings > Secrets and variables > Actions** and add the following secrets:

### AWS Credentials (Secrets)
These are sensitive and should be stored as **repository secrets**:

- `AWS_ACCESS_KEY_ID`: Your AWS access key ID for deployment
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key for deployment

## Required GitHub Variables

Add the following **repository variables** (these are non-sensitive configuration):

### AWS Configuration
- `AWS_REGION`: AWS region for deployment (e.g., `us-east-1`)

### API Configuration
- `API_GATEWAY_ENDPOINT`: Your API Gateway endpoint URL for integration tests
- `READ_ONLY_API_KEY`: API key for read-only operations in integration tests  
- `ADMIN_API_KEY`: API key for admin operations in integration tests

## How to Set Up

### Setting up Secrets:
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value

### Setting up Variables:
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click the **Variables** tab
4. Click **New repository variable**
5. Add each variable with its name and value

## Pipeline Behavior

### On Pull Requests:
- ✅ Build
- ✅ CDK Synth (validation only)
- ✅ Unit Tests
- ✅ Mocked Integration Tests (using fake values)

### On Push to Main:
- ✅ Build
- ✅ Unit Tests
- ✅ CDK Deploy (to AWS)
- ✅ Integration Tests (against live environment)
- ✅ CDK Destroy (cleanup)

## Security Best Practices

- **Secrets**: Used for sensitive data like AWS credentials
- **Variables**: Used for non-sensitive configuration like region names and API endpoints
- **Environment Protection**: Production deployments use GitHub environments for additional security
- **Least Privilege**: AWS credentials should have minimal required permissions

## Local Development

For local development, you can set these values in your environment:

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key" 
export AWS_REGION="us-east-1"
export API_GATEWAY_ENDPOINT="https://your-api.execute-api.region.amazonaws.com/prod"
export READ_ONLY_API_KEY="your-readonly-key"
export ADMIN_API_KEY="your-admin-key"
```

Or create a `.env` file (make sure it's in `.gitignore`):

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
API_GATEWAY_ENDPOINT=https://your-api.execute-api.region.amazonaws.com/prod
READ_ONLY_API_KEY=your-readonly-key
ADMIN_API_KEY=your-admin-key
```
