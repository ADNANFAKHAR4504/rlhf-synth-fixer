Design an AWS CloudFormation YAML template for a serverless web application with the following requirements and constraints:

Environment & Architecture:

Purpose: Set up a backend for a new web application using AWS managed serverless services.

Backend compute: Use AWS Lambda functions written in Python 3.12.

API management: API Gateway should be configured to handle HTTP requests and route them to Lambda functions. It must support all standard CRUD HTTP methods (GET, POST, PUT, DELETE).

Data layer: Store application data in a DynamoDB table, configured to use on-demand capacity mode (PAY_PER_REQUEST).

Security & Access:

Define IAM Roles and Policies using the principle of least privilege. Restrict each role to only the permissions necessary for its function (e.g., Lambda can access only the required DynamoDB actions and logs).

Ensure that API Gateway is able to securely invoke Lambda functions.

Networking & Regional Constraints:

All resources should be explicitly created in the us-east-1 AWS region.

The Lambda functions must be deployed into an existing VPC and specified private subnets in us-east-1.

Enable any necessary security group configuration to allow Lambda connectivity within those subnets and to DynamoDB (assume VPC endpoints are present).

Additional Requirements:

Enable encryption at rest on the DynamoDB table.

Environment variables should be used in Lambda for configuration where appropriate.

Constraints Recap:

Lambda runtime: Python 3.12

DynamoDB: On-demand (PAY_PER_REQUEST) capacity mode

API Gateway: Triggers Lambda functions, enables full CRUD

IAM roles: Principle of least privilege, grant only required permissions

Region: us-east-1

Network: Use existing VPC and private subnets
