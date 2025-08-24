# Task: Security Configuration as Code with Terraform

## Task ID: trainr941

## Platform & Language
- Platform: Terraform
- Language: HCL

## Task Description
You are tasked with setting up a secure AWS environment using Terraform. The environment must meet the following requirements:

1. Deploy resources exclusively within the 'us-west-2' region.
2. Utilize AWS Key Management Service (KMS) to encrypt all data stored in S3 buckets.
3. Apply AWS Identity and Access Management (IAM) policies adhering to the principle of least privilege.
4. Configure a Virtual Private Cloud (VPC) with public and private subnets to ensure proper network segmentation.
5. All EC2 instances must be provisioned within private subnets and accessed via a Bastion host.
6. Restrict AWS RDS access to internal VPC traffic only, with automated backups having a retention of at least 7 days.
7. Deploy AWS CloudWatch alarms for any critical threshold infringements, alongside enabling VPC Flow Logs for traffic analysis.
8. Implement DNS logging using AWS Route 53 and ensure that security group rules are configured for minimal inbound access.

## Infrastructure Requirements

### AWS Services Required
- VPC with public and private subnets
- EC2 instances (in private subnets)
- Bastion host (in public subnet)
- S3 buckets with KMS encryption
- RDS database with Multi-AZ and automated backups
- CloudWatch for monitoring and alarms
- VPC Flow Logs
- Route 53 for DNS logging
- IAM roles and policies
- Security Groups
- KMS keys

### Architecture Details
- **Region**: us-west-2 (exclusively)
- **Network**: VPC with segregated public and private subnets
- **Security**: 
  - All data encrypted at rest using KMS
  - Least privilege IAM policies
  - Bastion host for secure access
  - Restricted security group rules
- **Monitoring**: CloudWatch alarms and VPC Flow Logs
- **Database**: RDS with internal VPC access only, 7+ days backup retention

## Constraints (12 total)
1. All resources must be deployed within the 'us-west-2' region.
2. Utilize AWS Key Management Service (KMS) to encrypt all S3 buckets.
3. Setup AWS Identity and Access Management (IAM) policies to enforce least privilege access.
4. Implement a VPC with public and private subnets for network segmentation.
5. Ensure all EC2 instances are launched in private subnets.
6. Use a Bastion host for SSH access to EC2 instances.
7. All traffic to AWS RDS must be restricted to internal VPC communication.
8. Configure automatic backups for RDS with a retention period of at least 7 days.
9. Deploy AWS CloudWatch alarms for any critical security or performance thresholds.
10. Enable VPC Flow Logs for traffic monitoring and analysis.
11. Ensure that security group rules do not allow unrestricted ingress traffic.
12. Implement DNS logging using AWS Route 53.

## Expected Output
A set of Terraform HCL files that fulfill the above requirements. The solution must successfully deploy all components and pass provided test cases, demonstrating compliance with specified constraints and security best practices.

## Key Requirements Summary
- Single region deployment (us-west-2)
- Complete encryption using KMS
- Network segmentation with VPC
- Bastion host architecture
- Comprehensive monitoring and logging
- Strict security group policies
- Database high availability with backups