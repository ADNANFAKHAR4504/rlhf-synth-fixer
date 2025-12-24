You are tasked with writing a TypeScript AWS CDK application that will be structured with bin/tap.ts as the entry point, lib/tapstack.ts defining the main stack, and test/ folder for unit tests.

The stack must deploy a highly secure infrastructure in the us-east-1 region that includes:

VPC: A new VPC with public and private subnets across at least two Availability Zones.

Security Groups: Strictly allow inbound traffic only on ports 80 and 443 for EC2 instances. Outbound should be open only as necessary for system operations. No other inbound ports are allowed.

EC2 Instances: Launch multiple EC2 instances inside the VPC with IAM roles that follow least privilege, allowing only specific permissions like SSM:GetParameter, SSM:GetParameters, and CloudWatch:PutLogEvents.

RDS Database: Deploy a highly available RDS instance such as MySQL or PostgreSQL with storage encryption enabled using AWS KMS, running inside private subnets only, with restricted access through security groups so only EC2 instances in the VPC can connect.

IAM Roles: Define minimal IAM roles for EC2 that grant only specific permissions such as SSM:GetParameter for accessing Parameter Store and CloudWatch:CreateLogStream for logging, nothing broader than required.

Tagging: Tag all resources with Environment: Production.

Exclusions: Do not include AWS Config rules or CloudTrail setup in this stack.

Deliverables:

A complete CDK app in TypeScript, following the described folder structure.

Ensure the resulting CloudFormation template passes validation and meets all the constraints.

Security emphasis: least privilege IAM with specific permissions, strict security groups, and encryption at rest via KMS.