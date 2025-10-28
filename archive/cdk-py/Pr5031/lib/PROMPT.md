You’re building a serverless REST API on AWS, but this time you’ll do it using the AWS CDK with **Python** (main.py - single stack). The whole setup should run in the **us-west-2** region and be fully automated through CloudFormation when synthesized and deployed.

Start by designing a simple yet production-grade architecture: you’ll expose an **AWS Lambda function** through an **API Gateway**, and this function will handle HTTP requests — GET, POST, maybe DELETE — that interact with a **DynamoDB table** for persistent data storage. The Lambda function should have environment variables configured for dynamic or sensitive data, like table names or API keys, rather than hardcoding them.

Every resource you create should follow the principle of least privilege. That means your IAM roles should only allow the Lambda function to perform the specific DynamoDB and CloudWatch actions it actually needs. Don’t forget to wire up **Amazon CloudWatch** for logging and monitoring, so you can see detailed logs of API requests and Lambda executions later on.

Finally, make sure your CDK app in Python can fully synthesize into a working **CloudFormation stack** that creates all the resources correctly. Include code-level validation or simple integration checks to confirm it behaves as expected in AWS.

When you’re done, your output should be a deployable AWS CDK Python project that defines the full infrastructure for this REST API — Lambda, API Gateway, DynamoDB, IAM, CloudWatch — all wired up cleanly and ready to launch.


