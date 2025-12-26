# Infrastructure Provisioning Prompt

Create a secure and production-ready web application infrastructure using AWS CloudFormation. All resources must be defined in a single YAML-based CloudFormation template.

## Infrastructure Requirements

### Network Architecture

Create a VPC with public and private subnets spanning at least two Availability Zones. The public subnets connect to an Internet Gateway for inbound internet access. Configure NAT Gateways in the public subnets to provide outbound internet access for resources in the private subnets. Route tables associated with each subnet control traffic flow between subnets and external networks.

### Security Configuration

Security groups attached to application resources control inbound and outbound traffic. Configure security group inbound rules to restrict application access to specific IP ranges. Create an IAM role with the minimum permissions required to access both S3 and DynamoDB. Attach this IAM role to application instances through instance profiles.

### Storage and Data

Provision an S3 bucket with server-side encryption enabled using AES-256 default encryption. Applications write data to the S3 bucket through IAM roles attached to instances. Create a DynamoDB table for application data storage. Applications access the DynamoDB table through IAM role permissions.

### Logging and Monitoring

Enable AWS CloudTrail to log all API calls and store the logs in the newly created S3 bucket. CloudTrail sends log files to the S3 bucket automatically. Configure CloudWatch alarms that monitor CloudTrail logs for unauthorized API calls. CloudWatch alarms trigger notifications when unauthorized activity is detected.

Enable AWS Config to monitor infrastructure changes. AWS Config sends configuration snapshots to an S3 bucket. Configure AWS Config rules to monitor changes to IAM policies. AWS Config integrates with CloudWatch to send compliance findings.

## Project Constraints

- All resources must be defined in a single CloudFormation YAML template
- Existing VPCs and IAM roles from the AWS account may not be used
- The deployment must occur within a single AWS account
- The template must pass AWS CloudFormation validation and deploy successfully

## Expected Output

A single YAML CloudFormation template file that provisions all of the infrastructure described above and satisfies all constraints.
