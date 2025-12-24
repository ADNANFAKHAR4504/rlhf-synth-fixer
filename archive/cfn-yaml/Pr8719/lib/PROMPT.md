You are a Senior Cloud Infrastructure Engineer. Set up a VPC where EC2 instances use IAM roles to authenticate with and send application logs to CloudWatch, while VPC Flow Logs monitor network traffic and feed into the same log group for centralized analysis. Create infrastructure where S3 versioning works together with DynamoDB point-in-time recovery to provide integrated data protection across storage layers.

Task:

Build a CloudFormation template named infrastructure.yaml that works in both us-east-1 and us-west-2 without modification.

Regional Adaptability:

Add a Mappings section that defines the correct Amazon Linux 2 AMI ID for t2.micro instances in each region. The EC2 instance connects to this mapping to automatically select the appropriate AMI based on where the stack is deployed.

Centralized Logging Architecture:

Create a VPC with one public subnet. Set up a central CloudWatch Log Group that receives logs from multiple sources. VPC Flow Logs capture all network traffic and push this data into the central CloudWatch log group. EC2 instances also send their application logs to this same log group, creating a unified monitoring system where network and application data flow into a single destination for correlated analysis.

EC2 to CloudWatch Integration via IAM:

Create an IAM Role that EC2 instances assume to authenticate with CloudWatch. This role connects the EC2 instance to CloudWatch by granting CreateLogStream and PutLogEvents permissions. Create an Instance Profile that binds this IAM role to the EC2 instance. Launch a t2.micro EC2 instance in the public subnet with this Instance Profile attached. The EC2 instance uses this IAM role to authenticate with CloudWatch and push application logs to the same central log group that receives VPC Flow Logs.

Integrated Data Protection Across Storage Services:

Create an S3 Bucket with versioning enabled and AES256 encryption. Create a DynamoDB Table with a string primary key named id. Enable Point-in-Time Recovery on DynamoDB. S3 versioning works together with DynamoDB PITR to provide integrated point-in-time recovery across both storage layers. When data needs to be restored, S3 provides object version history while DynamoDB provides table state recovery, giving you complete data protection across your storage tier.

Tagging and Outputs:

Tag every resource with Project set to IaCChallenge including VPC, Subnet, EC2 Instance, IAM Role, Instance Profile, S3 Bucket, DynamoDB Table, CloudWatch Log Group, and VPC Flow Log. Export S3BucketName, DynamoDBTableName, and EC2InstanceId as stack outputs.

Expected Output:

A single, valid infrastructure.yaml file that passes AWS CloudFormation validation and provisions all resources in either target region.
