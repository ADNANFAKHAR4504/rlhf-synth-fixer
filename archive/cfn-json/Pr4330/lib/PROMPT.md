Hey team,

We need to build a HIPAA-compliant infrastructure for our healthcare client's data processing system. They're handling sensitive patient information, so security and audit logging are absolutely critical here.

## What we need

Can you set up a CloudFormation template (needs to be in JSON format) that includes:

1. S3 buckets - we'll need a few of these:
   - Main bucket for patient data with SSE-S3 encryption
   - Make sure versioning is on
   - No public access whatsoever
   - Set up lifecycle policies to manage old data
   - Enable logging to track all access

2. KMS setup for encryption:
   - We want our own customer-managed key
   - Turn on automatic rotation
   - Set up the key policy properly

3. Lambda for processing the data:
   - Should handle patient data coming from S3
   - Let's use Node.js 20.x since that's the latest
   - Pull config from SSM parameters
   - Put it in a VPC for better security

4. CloudWatch Logs configuration:
   - Set up log groups for the Lambda
   - Keep logs for 14 days (compliance requirement)
   - Make sure logs are encrypted too

5. CloudTrail for full audit trail:
   - We need multi-region coverage
   - Store trail logs in a dedicated S3 bucket
   - Turn on log file validation
   - Integrate with CloudWatch Logs for real-time monitoring

6. VPC setup for network isolation:
   - Create private subnets across 2 AZs for redundancy
   - Add VPC endpoints for S3 and CloudWatch so traffic stays private
   - Lock down security groups as much as possible

7. IAM roles and permissions:
   - Lambda needs an execution role but keep it minimal
   - S3 bucket policies should be restrictive
   - CloudTrail needs its own role for logging

8. SNS for alerts:
   - Enable encryption here too
   - We'll use this to notify the team about processing errors

9. DynamoDB for maintaining our audit records:
   - Enable point-in-time recovery for compliance
   - Encrypt everything at rest
   - Use on-demand billing to keep costs down

10. SSM Parameter Store for configs - better than hardcoding values

## Important notes

Make sure all resource names include the environmentSuffix parameter. We use this pattern everywhere: {resource-type}-${EnvironmentSuffix}. This helps us deploy to different environments without naming conflicts.

We're deploying to eu-west-3 for this project.

Thanks! Just give me the complete CloudFormation template in JSON format when you're done.
