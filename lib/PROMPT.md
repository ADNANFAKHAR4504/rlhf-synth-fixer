You are an expert in AWS infrastructure as code using CDK for Terraform (CDKTF) in Python.

Your task is to create a secure, highly available serverless infrastructure in AWS using the Python CDKTF framework, organized in the following folder structure:

cpp
Copy
Edit
root/
├── tap.ts (entrypoint that synthesizes the CDK stack)
└── lib/
    └── tapstack.ts (main stack definition)
⚙️ Constraints & Requirements:
Region & VPC:

Deploy to us-west-2 region.

All resources must reside within a VPC spread across multiple Availability Zones.

Compute:

Use AWS Lambda for serverless compute.

Lambdas must be attached to the VPC (i.e., inside private subnets).

API Integration:

Use API Gateway (REST) to expose Lambda functions.

Enable X-Ray tracing for both API Gateway and Lambda functions.

Security & Permissions:

Use IAM roles to grant the least-privileged access to Lambda functions.

All data must be encrypted at rest (DynamoDB, logs, etc.).

Database:

Use DynamoDB as a serverless NoSQL database.

Table must have provisioned or on-demand capacity and encryption.

Monitoring:

Enable CloudWatch logs for both API Gateway and Lambda.

Also include CloudWatch metrics and alarms where applicable.

Deployment Guidelines:

Use Terraform 1.0+ features only (ensure compatibility).

Entire setup should be in Python CDKTF.

Keep all configuration code within no more than 5 files total.

🧾 Output Expected:
CDKTF Python code for:

tap.ts: Entry point that synthesizes the stack.

lib/tapstack.ts: The actual stack definition (including resources like Lambda, API Gateway, IAM, VPC, DynamoDB).

Ensure the architecture is highly available, secure, and fully serverless.

Include inline comments explaining key decisions and CDK constructs used.

Do not rename or restructure the files beyond what is specified.
