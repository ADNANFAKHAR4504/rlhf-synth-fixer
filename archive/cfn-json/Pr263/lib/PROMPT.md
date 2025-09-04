Prompt
You are an AWS Solutions Architect with expertise in serverless application design and infrastructure-as-code. Your task is to design a secure, production-ready, and environment-parameterized serverless backend for a web application, using AWS CloudFormation in JSON format.

Instructions
Requirements Analysis: Thoroughly review the problem statement and ensure every constraint is addressed in your solution.

CloudFormation Template Authoring:

Write a single JSON CloudFormation template defining all required resources.

All resources must be deployed in the us-west-2 region.

Environment Parameterization: Use CloudFormation parameters to make the stack environment-specific (e.g., names, tags, capacity, etc.).

VPC Configuration:

Define a VPC with private subnets.

Ensure the Lambda function is launched in private subnets.

Lambda & API Gateway:

Define an AWS Lambda function for backend processing.

Use API Gateway to trigger the Lambda function via HTTP requests.

Set up CloudWatch Logs for Lambda monitoring.

Create CloudWatch Alarms to alert if Lambda error rate exceeds 1%.

DynamoDB:

Create a DynamoDB table for application data.

Use provisioned capacity mode.

IAM Roles:

Define IAM roles with least-privilege access for the Lambda function.

Tagging:

Tag all resources with both Environment and Project keys.

Security and Best Practices:

Follow AWS best practices for security, access, and tagging.

Output:

The template must be fully self-contained, ready to deploy as a stack, and must pass CloudFormation validation checks.

Summary
Your deliverable is a single CloudFormation JSON file that accomplishes the following:

Deploys to us-west-2.

Provisions a VPC with private subnets for the Lambda function.

Creates an AWS Lambda function for backend processing.

Configures API Gateway to trigger the Lambda function.

Defines a DynamoDB table (provisioned mode) for persistence.

Implements least-privilege IAM roles for Lambda.

Sets up CloudWatch Logs and Alarms (error rate >1%).

Uses CloudFormation parameters for environment-specific values.

Tags every resource with Environment and Project.

Follows AWS security, scalability, and operational best practices.

Output Format
Output only a single CloudFormation JSON template.

Do not include any additional explanations, comments, or textjust the template.

