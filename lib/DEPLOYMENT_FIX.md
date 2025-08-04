# CloudFormation S3 Bucket Endpoint Fix

## Issue
The CloudFormation deployment was failing with the error:
```
S3 error: The bucket you are attempting to access must be addressed using the specified endpoint. Please send all future requests to this endpoint.
```

## Root Cause
The deployment command was not specifying the AWS region, causing a mismatch between the deployment region and the S3 bucket region. The S3 bucket `iac-rlhf-cfn-states` appears to be in `us-east-1`, but the project was configured to use `ap-south-1`.

## Solution
1. **Updated deployment commands** in `package.json` to explicitly specify the region using `--region $(cat lib/AWS_REGION 2>/dev/null || echo us-east-1)`
2. **Changed AWS_REGION** from `ap-south-1` to `us-east-1` to match the S3 bucket location

## Commands Fixed
- `cfn:deploy-yaml`: Now includes explicit region specification
- `cfn:deploy-json`: Now includes explicit region specification

## Testing
To test the fix, run:
```bash
npm run cfn:deploy-yaml
```

The deployment should now work without the S3 endpoint error.