Create an AWS CloudFormation template in JSON for a serverless Python application environment in the us-east-1 region.

Here are the requirements for the setup:

VPC and Networking: Create a VPC with two public subnets and two private subnets across multiple Availability Zones. Include an Internet Gateway for the VPC and NAT Gateways in the public subnets to provide private resources with outbound internet access.

Lambda Function: Deploy a Python AWS Lambda function as the main application. The Lambda function should have necessary IAM roles attached for accessing S3 and RDS securely.

API Gateway: Integrate API Gateway as an HTTP endpoint for the Lambda function to handle incoming requests.

S3 Bucket: Create an S3 bucket with versioning enabled for application data storage and resiliency.

RDS Database: Implement an RDS instance with a PostgreSQL engine. Ensure the RDS instance is deployed in a private subnet for security.

Security: Configure Security Groups to control inbound and outbound traffic for the application layers. Use AWS Secrets Manager to store and manage RDS credentials safely.

IAM and Monitoring: Create IAM roles for the Lambda function to securely interact with S3 and RDS. Set up CloudWatch for monitoring and capturing Lambda function execution logs.

Naming Convention: Ensure all resources follow the organization's naming conventions with the project prefix 'projX'.

Please ensure the final JSON template is valid and would pass standard AWS CloudFormation validation tests.
