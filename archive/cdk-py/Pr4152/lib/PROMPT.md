You need to design and deploy a secure, serverless application on AWS using the **AWS CDK in Python** (main.py - single stack). The goal is to build a production-grade architecture where **Lambda**, **API Gateway**, **S3**, and supporting services work together efficiently under a well-structured, secure setup.

At the core, your compute layer should be **AWS Lambda**, running the **Python 3.8 runtime**. These Lambda functions should scale automatically based on demand and handle application logic triggered by **API Gateway HTTP APIs**. 

Security should be handled carefully throughout. Use **AWS IAM** roles and managed policies that strictly follow the **least privilege** model, giving the Lambda functions only the permissions they absolutely need. Sensitive environment variables and credentials should be stored in **AWS Secrets Manager**, never in plain text, and accessed dynamically at runtime.

For observability, enable **CloudWatch Logs** for every Lambda function so you can track executions and errors. Add **AWS X-Ray** tracing to gain full visibility into how requests flow between API Gateway and Lambda, making it easier to identify performance bottlenecks or latency issues. If a Lambda execution fails, use **AWS SNS** to send out notifications so administrators can react quickly.

Use **Amazon S3** for data storage or temporary files. Make sure your S3 bucket policies are locked down — no public access — while allowing secure read/write access from your Lambda functions.


Your deliverable should be a **Python-based AWS CDK application** (`cdk_app.py`) that defines and deploys this infrastructure end-to-end using CloudFormation. It should synthesize cleanly, deploy successfully, and reflect best practices for building scalable, observable, and secure serverless systems on AWS.