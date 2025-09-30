
I need help writing a Python CDK stack that can spin up a secure AWS environment for me. The core services here are S3, DynamoDB, and Lambda, and everything should be tied together with strong security controls. For S3, I want the buckets encrypted with AES-256 server-side encryption and locked down so that only specific Lambda functions can access them through IAM roles. The Lambda functions themselves should be provisioned with the absolute minimum memory they need and still be able to interact with DynamoDB, but only with the least-privileged permissions that match their use case.

Every single resource created should have tags for Environment, Owner, and Project since that’s part of our governance. I also need CloudTrail set up to log all API activity in the account, and CloudWatch alarms that can monitor both S3 bucket access and DynamoDB read/write activity. To make sure traffic stays inside AWS, the stack should create VPC endpoints for both S3 and DynamoDB.

IAM credentials should be set to rotate regularly, and I want the whole setup deployed consistently in both us-west-1 and us-east-1, which means using StackSets so we can keep the same configuration in both regions.

Can you put together a single Python CDK app (main.py - single stack) that delivers this whole setup, taking into account all of these requirements?