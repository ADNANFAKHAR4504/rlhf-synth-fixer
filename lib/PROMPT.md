You are a Senior Cloud Infrastructure Engineer. Create a secure, multi-region AWS environment using Infrastructure as Code. Build a single AWS CloudFormation template in YAML format that provisions foundational resources following security and operational best practices.

Task:

Build a CloudFormation template named infrastructure.yaml with these specifications. The template works in both us-east-1 and us-west-2 without changes.

Core Infrastructure & Security Requirements:

Regional Adaptability (Mappings):

Add a Mappings section for regional differences.

Define the correct Amazon Linux 2 AMI ID for t2.micro instances in both us-east-1 and us-west-2. Use this mapping to pick the AMI for the EC2 instance based on deployment region (AWS::Region).

Networking & Logging:

Create a new VPC with one public subnet.

Create a central AWS::Logs::LogGroup for service logs.

Enable VPC Flow Logs for the VPC, capturing all traffic (ALL). Send these logs to the CloudWatch Log Group above. This is required for network monitoring.

Secure Compute (EC2 & IAM):

Define an IAM Role for EC2 instances (EC2InstanceRole). The trust policy allows the EC2 service (ec2.amazonaws.com) to assume it.

Attach a minimal IAM policy to this role with permissions to write logs to CloudWatch (logs:CreateLogStream, logs:PutLogEvents). This follows least privilege principle.

Create an Instance Profile to make this IAM role available to an EC2 instance.

Launch one t2.micro EC2 instance in the public subnet. Attach the IAM Instance Profile to this instance.

Data Protection (S3 & DynamoDB):

Create an AWS::S3::Bucket with:

Versioning enabled (Status: Enabled).

Server-Side Encryption by default using AES256 algorithm.

Create an AWS::DynamoDB::Table with a simple primary key (e.g., an id of type String). Configure with:

Point-in-Time Recovery (PITR) enabled (PointInTimeRecoveryEnabled: true).

Universal Requirements:

Tagging: Tag every resource created by this template (VPC, Subnet, EC2 Instance, IAM Role, S3 Bucket, DynamoDB Table, etc.) with key Project and value IaCChallenge.

Outputs: Create an Outputs section exporting these resource identifiers:

S3BucketName: The name of the created S3 bucket.

DynamoDBTableName: The name of the created DynamoDB table.

EC2InstanceId: The ID of the launched EC2 instance.

Expected Output:

A single, valid infrastructure.yaml file. The template must be self-contained and pass AWS CloudFormation validation checks without errors, successfully provisioning all specified resources with correct configurations in either target region.