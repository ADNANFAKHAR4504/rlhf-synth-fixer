# Cloud Environment Setup - CloudFormation YAML

## Task ID: trainr938
## Platform: CloudFormation
## Language: YAML
## Complexity: Medium

## Task Description
You are tasked with setting up a basic cloud environment using AWS CloudFormation in YAML format. This involves creating an S3 bucket, an EC2 instance, and a DynamoDB table while achieving specific operational requirements.

## Requirements
1. Define an S3 bucket with versioning enabled
2. Create an EC2 instance within a specific VPC and subnet
3. Attach an IAM role to the EC2 instance with s3:ListBucket permission
4. Ensure the EC2 instance has a security group allowing inbound SSH from a fixed IP address
5. Set up a CloudWatch alarm for CPU utilization exceeding 70% on the EC2 instance
6. Create a DynamoDB table with a specified primary key and read capacity set to 5
7. Ensure all resources are tagged with 'Project: CloudSetup'
8. Deploy infrastructure in the 'us-west-2' region
9. Utilize parameters for configurable values such as instance type and bucket name

## Environment Details
- The infrastructure should be deployed in the 'us-west-2' region
- A specific VPC and subnet must be used for the EC2 instance
- All resources must be tagged with 'Project: CloudSetup'

## Constraints
1. Define an S3 bucket with versioning enabled
2. Create an EC2 instance within a specific VPC and subnet
3. Attach an IAM role to the EC2 instance with s3:ListBucket permission
4. Ensure the EC2 instance has a security group allowing inbound SSH from a fixed IP address
5. Set up a CloudWatch alarm for CPU utilization exceeding 70% on the EC2 instance
6. Create a DynamoDB table with a specified primary key and read capacity set to 5
7. Ensure all resources are tagged with 'Project: CloudSetup'
8. Deploy infrastructure in the 'us-west-2' region
9. Utilize parameters for configurable values such as instance type and bucket name

## Expected Output
A properly structured CloudFormation template in YAML format that creates the defined resources and meets all constraints. The template should run without errors and all constraints should be verifiable through AWS console or CLI commands.

## File to Modify
- lib/TapStack.yml (CloudFormation template in YAML format)

## Notes
- CloudFormation is a service that enables you to model and setup your AWS resources so that you can spend less time managing those resources and more time focusing on your applications
- This challenge will help you understand how to use CloudFormation to automate resource configuration and deployment tasks