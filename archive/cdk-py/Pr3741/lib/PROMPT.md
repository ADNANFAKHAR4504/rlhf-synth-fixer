I want to build a serverless application on AWS using the CDK in Python (main.py- single stack). The goal is to create an API powered by Lambda and backed by DynamoDB, with all the modern serverless best practices in place — fast, secure, and easy to update without downtime.

Start by setting up S3 buckets whose names follow the pattern `cf-serverless-<random-8-char-id>`. These will be used for storage or logging as needed. The Lambda functions should use the latest available runtime, have a 30-second timeout, and use environment variables for configuration — but any sensitive ones should be encrypted using AWS KMS. All IAM roles tied to the functions should strictly follow the least-privilege principle; I don’t want broad or wildcard permissions.

Expose the Lambda functions through API Gateway. Make sure CORS is turned on so the API can be called from browsers, and log all API activity to CloudWatch with a 90-day retention period. The API responses should also be cached using CloudFront to speed up global access.

For the data layer, set up a DynamoDB table in `PAY_PER_REQUEST` mode. Add an SNS topic for notifications, and include at least one sample subscription — say, an email endpoint — so we can test alerts.

Every resource you create should be properly tagged with the following:
`Project: ServerlessInfra`, `Owner: DevTeam`, and `Environment: Production`.

Make sure all IAM policies deny public access unless explicitly required — the design should be secure by default. Also, configure Lambda aliases so we can do zero-downtime deployments using traffic shifting between versions.

Once the stack is deployed, it should all work smoothly — S3, DynamoDB, API Gateway, Lambda, CloudFront, SNS, and CloudWatch all connected, all secure, all manageable via CDK.
