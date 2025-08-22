# Infrastructure Provisioning Prompt

You are asked to create a secure and production-ready web application infrastructure using AWS CloudFormation. All resources must be defined in a single **YAML-based CloudFormation template**.

## Technical Requirements

1. Deploy everything in a region within a newly created VPC.
2. Application access must be restricted to specific IP ranges using Security Group inbound rules.
3. Create an IAM role with the minimum permissions required to access both S3 and DynamoDB.
4. Provision an S3 bucket with:
   - Server-side encryption enabled
   - Default encryption set to AES-256
5. Enable AWS CloudTrail to log all API calls and store the logs in the newly created S3 bucket.
6. Create a VPC with public and private subnets spanning at least two Availability Zones.
7. Ensure that public subnets are configured with a NAT Gateway to allow outbound internet access for private subnets.
8. Configure Amazon CloudWatch alarms to alert on any unauthorized API calls detected by CloudTrail.
9. Enable AWS Config with rules configured to monitor changes to IAM policies.

## Project Constraints

- All resources must be defined in a single CloudFormation YAML template.
- Existing VPCs and IAM roles from the AWS account may not be used.
- The deployment must occur within a single AWS account.
- The template must pass AWS CloudFormation validation and deploy successfully.

## Expected Output

A single YAML CloudFormation template file that provisions all of the infrastructure described above and satisfies all constraints.
