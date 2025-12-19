I’m working on a project where I need to define AWS infrastructure using the **AWS CDK with Python**.  
My folder structure is simple: at the root I have a `tap.py` entry file, and inside a `lib` folder I have a `tap_stack.py` file where the main stack will live.  

The goal is to build a **serverless infrastructure on AWS** that follows best practices. Specifically, I need Lambda functions that are triggered through API Gateway, a DynamoDB table in on-demand mode for storing application data, and proper IAM roles and policies so that the Lambdas only have the permissions they actually need. I also want to run these inside a VPC that has both public and private subnets.  

In addition to that, I’ll need S3 buckets set up with lifecycle policies to handle old data automatically, CloudWatch logging for all my Lambda functions, and the ability for the system to handle asynchronous tasks (for example with EventBridge or SQS). All of the resources should be tagged with both `Project` and `Environment` keys for cost tracking and identification.  

Everything should be deployed in **us-east-1**, and I want the code to be clean, parameterized, and production-ready. At the end, I expect the output to be Python CDK code that I can drop into `tap.py` and `lib/tap_stack.py`, and then just run `cdk deploy` to provision the whole thing.  