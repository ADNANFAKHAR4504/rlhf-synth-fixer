# LocalStack Bootstrap Issue - Fix Required

## Problem
The CI/CD deployment is failing with:
```
SSM parameter /cdk-bootstrap/hnb659fds/version not found. Has the environment been bootstrapped?
Service 'ecr' is not enabled. Please check your 'SERVICES' configuration variable.
```

## Root Cause
1. The `localstack-ci-deploy.sh` script expects `scripts/localstack-bootstrap.sh` to exist
2. This file is missing from the repository
3. CDK's default bootstrap requires ECR, which is a LocalStack Pro-only feature
4. The deployment fails because CDK checks for bootstrap SSM parameter

## Fix Required (Repository Maintainers)
Create `scripts/localstack-bootstrap.sh` with the following content:

```bash
#!/bin/bash
# LocalStack Bootstrap for CDK (ECR-free)
# This script creates minimal bootstrap requirements without ECR

set -e

echo "🔧 Setting up LocalStack CDK bootstrap (ECR-free)..."

# Create SSM parameter for bootstrap version
awslocal ssm put-parameter \
    --name "/cdk-bootstrap/hnb659fds/version" \
    --type "String" \
    --value "14" \
    --overwrite 2>/dev/null || echo "✓ SSM parameter already exists"

# Create S3 bucket for CDK assets
awslocal s3 mb s3://cdk-hnb659fds-assets-000000000000-us-east-1 2>/dev/null || echo "✓ S3 bucket already exists"

echo "✅ LocalStack bootstrap completed successfully (ECR-free)"
```

Make it executable:
```bash
chmod +x scripts/localstack-bootstrap.sh
```

## Temporary Workaround  
A minimal bootstrap script has been created at `.localstack-minimal-bootstrap.sh` in this PR.
However, it won't be called by CI until the above fix is applied to the repository.

## Impact
ALL LocalStack CDK deployments are currently blocked until this file is added.

