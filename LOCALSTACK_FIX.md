# LocalStack ECR Fix

## Problem
CDK bootstrap was failing with:
```
Service 'ecr' is not enabled. Please check your 'SERVICES' configuration variable.
```

## Root Cause
- The default CDK bootstrap template creates an ECR repository for container assets
- ECR is a LocalStack **Pro-only** service, not available in Community edition
- This blocked all stack deployments

## Solution
Configured `CliCredentialsStackSynthesizer` in `bin/tap.ts`:
- This synthesizer bypasses the standard bootstrap stack
- Uses direct CloudFormation deployment
- Only requires S3 for file assets (Lambda code)
- No ECR repository needed

## Changes Made
1. Modified `bin/tap.ts` to detect LocalStack environment
2. Applied `CliCredentialsStackSynthesizer` when running in LocalStack
3. Configured file assets bucket name explicitly

## Result
- CDK can deploy to LocalStack Community without ECR
- Lambda functions use S3 assets instead
- Bootstrap stack no longer required
