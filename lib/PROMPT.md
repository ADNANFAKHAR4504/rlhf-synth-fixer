✅ Prompt for AWS CDK (Python)
You are a cloud automation engineer tasked with implementing a serverless application using AWS CDK in Python. Your solution must follow the AWS Free Tier limits and deploy all resources in the us-east-1 region. Use the following folder structure:

bash
Copy
Edit
root/
├── tap.py              # Entry point, like app.py
└── lib/
    └── tap_stack.py     # CDK Stack definition
✅ Requirements:
Create AWS Lambda functions to handle HTTP requests. These will serve as REST API endpoints.

Expose the Lambda functions via API Gateway (HTTP API) so that they can be triggered by external HTTP requests.

Ensure all resources are deployed in the us-east-1 AWS region.

Design within AWS Free Tier limits, particularly using Lambda’s Free Tier allocation (1M invocations, 400,000 GB-seconds/month).

The solution should be:

Modular

Scalable

Easy to deploy using cdk deploy

✅ Expected Output:
You must provide a CDK Python project with:

tap.py – Initializes the CDK app and stack.

lib/tap_stack.py – Contains a stack class that defines:

A simple Lambda function handler (e.g., returning a "Hello, World!" response)

An API Gateway HTTP API that triggers this Lambda

Also include a README.md describing:

How to install dependencies (pip install -r requirements.txt)

How to bootstrap and deploy the stack (cdk bootstrap & cdk deploy)

Cost-awareness tips for staying within the Free Tier

