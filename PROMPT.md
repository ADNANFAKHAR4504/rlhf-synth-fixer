# Task: AWS CloudFormation

## Background
A financial services startup needs to deploy their transaction processing web application in AWS with high availability requirements. The application consists of a web tier handling customer requests and a backend API that processes financial transactions, requiring strict security controls and multi-AZ redundancy.

## Problem Statement
Create a CloudFormation template to deploy a highly available web application infrastructure across multiple availability zones. MANDATORY REQUIREMENTS (Must complete): 1. Create a VPC with 3 public subnets and 3 private subnets across 3 AZs (CORE: VPC). 2. Deploy an RDS Aurora MySQL cluster with one writer and one reader instance (CORE: RDS). 3. Configure an Application Load Balancer in public subnets with target group health checks. 4. Set up an Auto Scaling Group with min 2, max 6 EC2 t3.medium instances in private subnets. 5. Implement NAT Gateways in each AZ for outbound internet access from private subnets. 6. Create all necessary security groups with explicit ingress/egress rules. 7. Configure CloudWatch Logs for VPC Flow Logs with specified retention. 8. Use Secrets Manager for RDS credentials with Lambda-based rotation. OPTIONAL ENHANCEMENTS (If time permits): � Add CloudFront distribution for static content caching (OPTIONAL: CloudFront) - improves performance globally. � Implement AWS WAF rules on ALB (OPTIONAL: WAF) - adds web application firewall protection. � Add Route 53 health checks with failover routing (OPTIONAL: Route 53) - enables DNS-based failover. Expected output: A single CloudFormation YAML template that creates all infrastructure components with proper dependencies, outputs for key resource IDs and endpoints, and parameters for environment-specific configuration.

## Environment
Production-grade infrastructure deployed in us-east-1 across 3 availability zones. Core services include Application Load Balancer for traffic distribution, Auto Scaling Group with EC2 instances running Amazon Linux 2023, and RDS Aurora MySQL cluster for data persistence. VPC configuration includes public subnets for ALB, private subnets for EC2 instances, and database subnets for RDS. NAT Gateways provide outbound internet access for private instances. Requires AWS CLI configured with appropriate IAM permissions for CloudFormation, EC2, RDS, VPC, and Secrets Manager services.

## Constraints
1. All database credentials must be stored in AWS Secrets Manager with automatic rotation enabled
2. The RDS instance must use encrypted storage with customer-managed KMS keys
3. Application Load Balancer must enforce HTTPS-only connections with SSL termination
4. EC2 instances must use IMDSv2 (Instance Metadata Service Version 2) exclusively
5. All resources must be tagged with Environment, Project, and CostCenter tags
6. VPC Flow Logs must be enabled and sent to CloudWatch Logs with 30-day retention
7. Security groups must follow least-privilege principle with no 0.0.0.0/0 inbound rules
8. CloudFormation stack must support blue-green deployments via parameter updates

## Platform and Language
- **Platform:** CloudFormation
- **Language:** JSON
- **Difficulty:** hard

## Subject Labels
aws, infrastructure, cloud-environment-setup

## Expected Output
A complete CloudFormation JSON template that creates all infrastructure components with proper dependencies, outputs for key resource IDs and endpoints, and parameters for environment-specific configuration.
