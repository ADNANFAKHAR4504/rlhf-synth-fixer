CDK Python Prompt: Cloud Environment Setup in AWS (us-east-2)

Your task is to implement an AWS infrastructure using AWS CDK in Python to support a scalable and cost-efficient web application. The solution must be written using a structured CDK Python project with the following folder layout:

bash
Copy
Edit
root/
├── tap.py                     # Entry point (app.py)
├── lib/
│   └── tap_stack.py          # Main CDK stack
└── tests/
    ├── unit/
    │   └── tests_tap_stack.py  # Unit tests
    └── integration/
        └── test_tap_stack.py  # Integration tests
📌 Requirements:
Region: us-east-2

Environment: preprod

Naming convention: Use 'project-env-resource' format (e.g., tap-preprod-s3)

Tags: Apply a tag CostCenter=ProjectX to all resources

🚀 Infrastructure Components to Implement:
S3 Bucket

Used for storing static files or backups

Name should follow the convention

Enable versioning

DynamoDB Table

Use on-demand billing mode (cost-efficient)

Partition key: id (string)

Lambda Function

Handle backend logic

Python 3.12 runtime

Access to both the above S3 bucket and DynamoDB table

Inline basic handler for demonstration

IAM Role

Grant least-privilege access for the Lambda to the S3 bucket and DynamoDB table

✅ Testing Requirements:
Unit Test (tests/unit/tests_tap_stack.py):
Validate that:

Resource names follow the correct format

Tags are applied

Integration Test (tests/integration/test_tap_stack.py):
Deploy the stack and confirm:

Resources exist

Lambda has access to S3 and DynamoDB

🧠 Best Practices to Follow:
Use CDK constructs and avoid low-level Cfn* APIs unless necessary

Keep code modular and reusable

Add comments and clear structure to support scaling