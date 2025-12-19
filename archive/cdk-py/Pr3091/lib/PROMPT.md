I need your help building a secure serverless infrastructure, but this time I don’t want a CloudFormation YAML file — I’d like you to give me a complete AWS CDK implementation in Python. The whole idea is to spin up a serverless app in us-west-2, and it needs to follow best practices around security, monitoring, and least privilege.

Here’s what I’m aiming for: two Lambda functions that handle backend processing, and they should both be exposed through API Gateway but on different endpoints. I’ll need DynamoDB as the single data store for user information, with a clear primary key and a secondary index defined. The Lambdas should talk to the table through environment variables (like connection strings), and I also want AWS X-Ray tracing enabled so I can actually see what’s happening when things run.

Logging should go into an S3 bucket that has versioning turned on, but I want to make sure the bucket only allows encrypted objects with AES256. While we’re at it, please include CloudWatch alarms that notify me if either Lambda’s error rate is over 5% in a five-minute window.

For security, the stack should create VPC endpoints for both S3 and DynamoDB, so traffic stays inside the VPC. IAM roles should be tight — only minimum permissions for each service. And don’t forget to turn on CORS for API Gateway so the endpoints can be called from web apps.

Finally, when the stack is deployed, I’d like CloudFormation outputs that give me the API endpoint URLs.

So basically: AWS CDK in Python (main.py - single stack), one single stack that defines everything, and when it’s deployed in us-west-2, it should just work.