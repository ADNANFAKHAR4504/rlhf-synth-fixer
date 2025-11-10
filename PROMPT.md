# Task: Environment Migration

## Background
A startup company has outgrown their single-environment infrastructure and needs to implement a proper development-to-production pipeline. Their current monolithic CloudFormation template manages all resources in one AWS account, causing deployment conflicts and accidental production changes.

## Environment
Multi-account AWS setup spanning us-east-1 region with separate AWS accounts for dev, staging, and prod environments. Infrastructure includes VPC with public/private subnets across 2 AZs, Application Load Balancer, Auto Scaling Group with EC2 instances, RDS MySQL database, and S3 buckets for static assets. Requires AWS CLI configured with appropriate cross-account roles. Each environment has isolated VPCs with CIDR blocks: dev (10.0.0.0/16), staging (10.1.0.0/16), prod (10.2.0.0/16). Production requires Multi-AZ RDS deployment.

## Problem Statement
Create a CloudFormation template to migrate a single-environment application stack to support multiple environments (dev, staging, production) across different AWS accounts. The configuration must: 1. Define a reusable template that accepts environment parameters 2. Configure VPC with environment-specific CIDR ranges 3. Deploy an Auto Scaling Group with environment-appropriate instance types (t3.micro for dev, t3.small for staging, t3.medium for prod) 4. Set up RDS MySQL with Single-AZ for dev/staging and Multi-AZ for production 5. Create S3 buckets with environment-specific naming and versioning enabled only for production 6. Configure Application Load Balancer with proper security group rules 7. Implement CloudWatch alarms with environment-specific thresholds 8. Use Conditions to enable/disable resources based on environment type 9. Output the ALB DNS name and RDS endpoint for each environment. Expected output: A single CloudFormation YAML template that can be deployed via StackSets to create consistent infrastructure across multiple AWS accounts, with environment-specific configurations controlled through parameters.

## Constraints
1. Use CloudFormation StackSets for multi-account deployment
2. Implement parameter-based environment differentiation
3. Resources must be tagged with Environment and CostCenter tags
4. S3 bucket names must include the environment suffix
5. Production RDS instances must have automated backups enabled

## CRITICAL NOTE
**CSV Authority**: This task's CSV record specifies Platform=Pulumi and Language=Python. The problem statement above references CloudFormation, but the iac-infra-generator agent will adapt these requirements to use Pulumi with Python instead. The multi-environment, multi-account architecture requirements remain the same, just implemented using Pulumi's stack configuration and Python resource definitions instead of CloudFormation templates.
