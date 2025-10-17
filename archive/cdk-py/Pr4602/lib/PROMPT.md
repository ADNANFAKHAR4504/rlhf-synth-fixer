I want to build a small serverless application using the AWS CDK in Python (main.py - single stack). The idea is to have a simple Lambda function (written in Python) that’s exposed through an API Gateway endpoint — specifically, an HTTP GET request that triggers the Lambda. The function should connect to a DynamoDB table for data, and also interact with an S3 bucket for storing or retrieving files when needed.

The DynamoDB table should use on-demand capacity and have `userId` as its partition key. The S3 bucket needs versioning turned on, but it must stay private — no public read access at all. 

For the API, I only want GET requests to be allowed, and CORS should be configured accordingly — no other methods should be permitted. Logging should be set up for the Lambda, but we don’t want to flood CloudWatch with INFO-level logs; it should only record warnings, errors, or anything higher.

The Lambda itself will need permission to access DynamoDB and S3, so create an IAM role with just the right amount of access — nothing excessive. Keep it minimal and follow least-privilege principles.

When deployed, this CDK Python stack should bring everything up — the Lambda, API Gateway, DynamoDB table, and S3 bucket — all properly wired, secure, and ready to test through the GET endpoint.

