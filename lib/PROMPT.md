You are tasked with generating an AWS CDK application in TypeScript with the following folder structure:

bin/tap.ts → entry point for the CDK app.

lib/tapstack.ts → defines the main infrastructure stack.

test/ → contains CDK tests.

The project must implement the following requirements:

All resources should reside within a single VPC in the us-west-2 region.

EC2 instances must:

Be launched inside the VPC.

Use IAM roles for access instead of embedding credentials.

Restrict SSH access only to a specific IP CIDR range using security groups.

RDS instance must:

Be inside the VPC in private subnets.

Use security groups to allow inbound access only from specified IP addresses.

Be encrypted at rest.

Lambda functions must:

Be deployed in the same VPC.

Have CloudWatch logging enabled.

Retrieve sensitive values (e.g., database credentials) from AWS Secrets Manager instead of hardcoding.

S3 buckets must:

Use the company naming convention (corp-<project>-<resource-type>).

Have server-side encryption enabled.

Block all public access.

IAM policies and roles must:

Follow the least privilege principle.

Be attached to EC2, RDS, and Lambda as needed.

MFA enforcement must be applied for the AWS Management Console.

All resources should follow the company naming convention:

Prefix with "corp" followed by projectName and the resource type (e.g., corp-nova-ec2, corp-nova-s3).

Do not include AWS Config Rules or CloudTrail in this stack.

Generate TypeScript CDK code that fully implements these requirements. The main stack should be defined in lib/tapstack.ts, and the app entry point in bin/tap.ts.