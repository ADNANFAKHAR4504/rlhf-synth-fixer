You are tasked with writing a TypeScript AWS CDK application that will be structured with:

bin/tap.ts → entry point of the app.

lib/tapstack.ts → defines the main stack.

test/ → folder for unit tests.

The stack must deploy a highly secure infrastructure in the us-east-1 region that includes:

VPC: A new VPC with public & private subnets across at least two Availability Zones.

Security Groups: Strictly allow inbound traffic only on ports 80 (HTTP) and 443 (HTTPS) for EC2 instances. Outbound should be open only as necessary for system operations. No other inbound ports are allowed.

EC2 Instances: Launch multiple EC2 instances inside the VPC with IAM roles that follow least privilege (only allow essential permissions).

RDS Database: Deploy a highly available RDS instance (e.g., MySQL or PostgreSQL) with:

Storage encryption enabled using AWS KMS.

Running inside private subnets only.

Restricted access through security groups (only EC2 instances in the VPC can connect).

IAM Roles: Define minimal IAM roles for EC2 and RDS that grant only necessary permissions (e.g., EC2 read from SSM Parameter Store if needed, nothing broader).

Tagging: Tag all resources with Environment: Production.

Exclusions: Do not include AWS Config rules or CloudTrail setup in this stack.

Deliverables:

A complete CDK app in TypeScript, following the described folder structure.

Ensure the resulting CloudFormation template passes validation and meets all the constraints.

Security emphasis: least privilege IAM, strict security groups, and encryption at rest via KMS.