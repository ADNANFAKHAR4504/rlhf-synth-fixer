# Secure VPC Infrastructure with S3 and DynamoDB

Create a CloudFormation template in YAML that provisions a secure multi-tier VPC infrastructure with integrated storage and database services.

## VPC and Networking

The VPC connects to the internet through an Internet Gateway attached to public subnets. Two public subnets span different Availability Zones and route outbound traffic directly through the Internet Gateway. Two private subnets also span different Availability Zones and route outbound traffic through a NAT Gateway deployed in the first public subnet. The NAT Gateway associates with an Elastic IP address that enables private resources to initiate outbound connections to the internet.

## Security Groups

A public security group attaches to resources in public subnets and allows inbound HTTP and HTTPS traffic from the internet. A private security group attaches to resources in private subnets and accepts traffic originating from the public security group. Both security groups permit outbound connections to external destinations for software updates and API calls.

## S3 Bucket Configuration

An S3 bucket stores artifacts and integrates with EC2 instances through IAM roles. The bucket enables versioning for data durability and recovery. Server side encryption protects data at rest. Public access blocks prevent any public exposure of bucket contents.

## IAM Roles and Instance Profiles

An IAM role grants EC2 instances in private subnets least privilege access to the S3 bucket. The role policy allows only ListBucket and GetObject actions on the specific bucket resource. An instance profile associates the IAM role with EC2 instances that connect to S3 for artifact retrieval.

## DynamoDB Table

A DynamoDB table stores application data using on demand capacity mode. The table uses a string partition key and integrates with application services deployed in the VPC.

## Outputs

The template outputs the VPC ID, subnet IDs, NAT Gateway ID, S3 bucket name, security group IDs, IAM role ARN, instance profile ARN, and DynamoDB table name and ARN for integration with other stacks.
