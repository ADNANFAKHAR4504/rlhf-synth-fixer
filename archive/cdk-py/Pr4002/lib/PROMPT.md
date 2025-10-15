You need to build a small but production-grade serverless setup on AWS using the AWS CDK in Python. The idea is to define everything inside a single CDK stack (say, `main.py`) that represents your complete serverless backend.

The application should start with a **Lambda function** that runs your backend logic. You’ll package and deploy the Lambda from an **S3 bucket**, which means your CDK should handle creating and managing that S3 bucket for deployment artifacts. Make sure the bucket uses **server-side encryption (SSE-S3)** so data is protected automatically, and give it clear naming and tagging conventions.

Next, expose that Lambda function through an **API Gateway** so it can respond to HTTP requests. The API Gateway should be wired to the Lambda function as its integration target. Make sure you configure permissions properly — the API Gateway must be able to invoke the Lambda, and the Lambda itself should have an **IAM role** that allows it to perform only what it needs, nothing more. Follow the principle of least privilege.

Your Lambda will also need to interact with a **DynamoDB table** — it should be able to read and write data to it, so define that table in the same stack. Keep it simple, something like a partition key named `id`. Configure the IAM role to give the Lambda exactly those DynamoDB permissions.

On the observability side, turn on **CloudWatch logging** for both the Lambda and API Gateway. Add a **CloudWatch alarm** that triggers if your Lambda’s error rate exceeds a reasonable threshold — this will help simulate production monitoring. Enable **X-Ray tracing** for both API Gateway and Lambda to get deeper visibility into performance and request flow.

You’ll want to include environment variables in your Lambda for configuration purposes but make sure you don’t expose any sensitive data directly — assume secrets would come from AWS Secrets Manager in a real scenario.

you must tag every single resource with `project: serverless-automation` and `environment: production` for tracking and management.

Once finished, your CDK app should synthesize cleanly and deploy without requiring any manual tweaks afterward. Keep it minimal — no extra resources or unnecessary constructs. When the stack is deleted, everything should tear down neatly.

In short, build a neat, self-contained Python CDK stack that spins up a Lambda connected to an API Gateway, backed by DynamoDB, with logs, encryption, and alarms — all following AWS best practices for a real production environment.

