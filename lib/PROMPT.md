You are a Senior Cloud Infrastructure Engineer. Create a secure, multi-region AWS environment using Infrastructure as Code. Build a single AWS CloudFormation template in YAML format that provisions foundational resources following security and operational best practices.

Task:

Build a CloudFormation template named infrastructure.yaml that works in both us-east-1 and us-west-2 without modification.

Regional Adaptability:

Add a Mappings section that defines the correct Amazon Linux 2 AMI ID for t2.micro instances in each region. The EC2 instance should use this mapping to automatically select the appropriate AMI based on where the stack is deployed.

Networking and Centralized Logging:

Create a VPC with one public subnet. Set up a central CloudWatch Log Group that serves as the aggregation point for all infrastructure logs. Configure VPC Flow Logs to capture all network traffic and send it directly to this central log group, enabling real-time network monitoring and security analysis across the entire VPC.

Secure Compute with IAM Integration:

Create an IAM Role that EC2 instances can assume. This role should have a minimal inline policy granting only the permissions needed to write logs to CloudWatch, specifically CreateLogStream and PutLogEvents. Create an Instance Profile that links this IAM role to EC2 instances. Launch a single t2.micro EC2 instance in the public subnet with this Instance Profile attached, allowing the instance to authenticate with CloudWatch and stream application logs to the central log group without storing credentials on the instance.

Data Protection Strategy:

Create an S3 Bucket with versioning enabled and AES256 server-side encryption configured by default. This provides object-level recovery capabilities and data-at-rest protection. Create a DynamoDB Table with a simple string primary key named id and enable Point-in-Time Recovery. Together, the S3 versioning and DynamoDB PITR create a comprehensive data protection layer where both storage services support point-in-time restoration.

Tagging and Outputs:

Tag every resource in this template with Project set to IaCChallenge. This includes the VPC, Subnet, EC2 Instance, IAM Role, Instance Profile, S3 Bucket, DynamoDB Table, CloudWatch Log Group, and VPC Flow Log. Export the S3BucketName, DynamoDBTableName, and EC2InstanceId as stack outputs for cross-stack reference.

Expected Output:

A single, valid infrastructure.yaml file that passes AWS CloudFormation validation and successfully provisions all resources with correct configurations in either target region.
