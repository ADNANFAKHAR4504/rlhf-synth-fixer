You are a Senior Cloud Infrastructure Engineer. Build secure AWS infrastructure where EC2 instances deployed in a monitored VPC use IAM roles to stream logs to CloudWatch, while VPC Flow Logs feed network data into the same centralized logging system, and S3 and DynamoDB provide integrated data protection through versioning and point-in-time recovery.

Task:

Build a CloudFormation template named infrastructure.yaml that works in both us-east-1 and us-west-2 without modification.

Regional Adaptability:

Add a Mappings section that defines the correct Amazon Linux 2 AMI ID for t2.micro instances in each region. The EC2 instance should use this mapping to automatically select the appropriate AMI based on where the stack is deployed.

Centralized Monitoring and Network Visibility:

Create a VPC with one public subnet. Set up a central CloudWatch Log Group that serves as the aggregation point for all infrastructure logs. VPC Flow Logs feed network traffic data into this central log group for unified monitoring alongside application logs, enabling real-time security analysis across the entire VPC.

Secure Compute with IAM-Based CloudWatch Integration:

Create an IAM Role that enables EC2 instances to authenticate with CloudWatch and stream application logs. This role should have a minimal inline policy granting only CreateLogStream and PutLogEvents permissions. Create an Instance Profile that connects this IAM role to EC2 instances. Launch a single t2.micro EC2 instance in the public subnet with this Instance Profile attached, enabling the EC2 instance to securely connect to and stream logs through CloudWatch into the same central log group that receives VPC Flow Logs.

Integrated Data Protection Strategy:

Create an S3 Bucket with versioning enabled and AES256 server-side encryption configured by default. Create a DynamoDB Table with a simple string primary key named id and enable Point-in-Time Recovery. S3 versioning integrates with DynamoDB PITR to provide comprehensive point-in-time recovery across both storage layers, ensuring data can be restored from any moment in time regardless of storage type.

Tagging and Outputs:

Tag every resource in this template with Project set to IaCChallenge. This includes the VPC, Subnet, EC2 Instance, IAM Role, Instance Profile, S3 Bucket, DynamoDB Table, CloudWatch Log Group, and VPC Flow Log. Export the S3BucketName, DynamoDBTableName, and EC2InstanceId as stack outputs for cross-stack reference.

Expected Output:

A single, valid infrastructure.yaml file that passes AWS CloudFormation validation and successfully provisions all resources with correct configurations in either target region.
