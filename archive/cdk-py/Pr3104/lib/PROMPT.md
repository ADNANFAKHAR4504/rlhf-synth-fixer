I need help building out a serverless infrastructure in AWS using the AWS CDK with Python (main.py - single stack). The setup should include multiple Lambda functions, an API Gateway, DynamoDB tables, an S3 bucket, and CloudWatch for monitoring. I want everything deployed in us-west-2 and the resource names should reflect whether it’s dev or prod, so that the environment context is baked into the naming.

All the Lambdas should run on Python 3.9, and they need proper versioning so I can roll back if necessary. I also want environment variables passed in so I can manage deployment stages cleanly. For the S3 bucket, I need server-side encryption enabled with KMS. Every Lambda should have its own CloudWatch log group.

The DynamoDB tables need auto scaling enabled for both reads and writes. For API Gateway, logging should be set to INFO at the stage level. IAM roles should only have the minimum privileges needed, and IAM users shouldn’t have direct access—everything should run through roles.

Can you put together a single Python CDK stack that meets all of these requirements and will work consistently in both dev and prod environments?