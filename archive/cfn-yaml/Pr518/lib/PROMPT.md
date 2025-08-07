You are a Senior Cloud Infrastructure Engineer tasked with creating a secure, multi-region, and fully compliant AWS environment using Infrastructure as Code. Your deliverable must be a single, comprehensive AWS CloudFormation template in YAML format that provisions a foundational set of resources adhering to strict security and operational best practices.

Task:

Construct a valid CloudFormation template named infrastructure.yaml that meets the following detailed specifications. The template must be designed for deployment in either the us-east-1 or us-west-2 region without modification.

Core Infrastructure & Security Requirements:

Regional Adaptability (Mappings):

Implement a Mappings section to handle regional differences.

This map must define the correct Amazon Linux 2 AMI ID for a t2.micro instance in both us-east-1 and us-west-2. Use this mapping to dynamically select the AMI for the EC2 instance based on the region where the stack is deployed (AWS::Region).

Networking & Logging:

Provision a new VPC with a single public subnet.

Create a central AWS::Logs::LogGroup to aggregate logs from various services.

Enable VPC Flow Logs for the created VPC, capturing all traffic (ALL). Configure these logs to be delivered directly to the CloudWatch Log Group created above. This is critical for network monitoring.

Secure Compute (EC2 & IAM):

Define an IAM Role for EC2 instances (EC2InstanceRole). The role's trust policy must allow the EC2 service (ec2.amazonaws.com) to assume it.

Attach a minimal IAM policy to this role that grants permissions to write logs to CloudWatch (logs:CreateLogStream, logs:PutLogEvents). This demonstrates the principle of least privilege.

Create an Instance Profile to make this IAM role available to an EC2 instance.

Launch one t2.micro EC2 instance within the public subnet. Crucially, this instance must be launched with the IAM Instance Profile attached.

Data Protection (S3 & DynamoDB):

Provision an AWS::S3::Bucket. This bucket must be configured with:

Versioning enabled (Status: Enabled).

Server-Side Encryption by default, using the AES256 algorithm.

Provision an AWS::DynamoDB::Table. The table should have a simple primary key (e.g., an id of type String). This table must be configured with:

Point-in-Time Recovery (PITR) enabled (PointInTimeRecoveryEnabled: true).

Universal Requirements:

Tagging: Every single resource created by this template (VPC, Subnet, EC2 Instance, IAM Role, S3 Bucket, DynamoDB Table, etc.) must be tagged with the key Project and the value IaCChallenge.

Outputs: Create an Outputs section to export the following critical resource identifiers for easy access after deployment:

S3BucketName: The name of the created S3 bucket.

DynamoDBTableName: The name of the created DynamoDB table.

EC2InstanceId: The ID of the launched EC2 instance.

Expected Output:

A single, valid, and well-commented infrastructure.yaml file. The template must be self-contained and pass AWS CloudFormation validation checks without any errors, successfully provisioning all specified resources with the correct configurations in either target region.
