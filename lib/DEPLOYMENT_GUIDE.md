# CDK Bootstrap and Deployment Guide

## CDK Bootstrap Fix

### Issue
CDK bootstrap was failing with the error:
```
Unable to resolve AWS account to use. It must be either configured when you define your CDK Stack, or through the environment
```

### Root Cause
Two issues were preventing CDK bootstrap from working:
1. The `cdk.json` configuration was not using `pipenv` but the CI/CD environment expects it
2. The CDK application needed better environment variable handling for AWS credentials

### Solution
Applied the following fixes:

1. **Fixed CDK App Configuration**:
   - Changed `cdk.json` from `"app": "python3 tap.py"` to `"app": "pipenv run python3 tap.py"`
   - This ensures compatibility with CI/CD environments that use pipenv

2. **Enhanced Environment Configuration** in `tap.py`:
   - Added debug output to show which account/region configuration is being used
   - Improved environment variable fallback logic

#### Configuration Details:

1. **Region Configuration Priority**:
   - First: Check for `lib/AWS_REGION` file (for region-specific deployments)
   - Second: Use `CDK_DEFAULT_REGION` environment variable
   - Third: Use `AWS_DEFAULT_REGION` environment variable  
   - Fourth: Default to `us-east-1`

2. **Account Configuration**:
   - Only set explicit account if `CDK_DEFAULT_ACCOUNT` is available
   - Otherwise, let CDK resolve account from AWS credentials/profile

### Deployment Instructions

#### For CI/CD Environments
```bash
# Bootstrap (requires AWS credentials to be configured)
npm run cdk:bootstrap

# Deploy
npm run cdk:deploy
```

#### For Local Development
1. Configure AWS credentials:
   ```bash
   aws configure
   # OR set environment variables:
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_DEFAULT_REGION=us-east-1
   ```

2. Bootstrap and deploy:
   ```bash
   npm run cdk:bootstrap
   npm run cdk:deploy
   ```

#### For Region-Specific Deployments
Create a `lib/AWS_REGION` file with the desired region:
```bash
echo "us-west-2" > lib/AWS_REGION
```

### Environment Variables
- `CDK_DEFAULT_ACCOUNT`: AWS account ID (optional, CDK will resolve from credentials if not set)
- `CDK_DEFAULT_REGION`: AWS region (optional, defaults to us-east-1)
- `AWS_DEFAULT_REGION`: Alternative AWS region variable
- `ENVIRONMENT_SUFFIX`: Environment suffix for stack naming (defaults to 'dev')

### Testing
```bash
# Verify CDK synthesis works
npm run cdk:synth

# Run unit tests
pipenv run test-py-unit

# Run integration tests (requires deployment)
pipenv run test-py-integration
```