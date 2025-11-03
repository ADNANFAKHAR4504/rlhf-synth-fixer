# Task: Environment Migration

## Background
Your company is migrating a legacy on-premises application to AWS. The application consists of a web tier and database tier that need to be replicated in the cloud with minimal downtime. The migration must preserve existing network configurations and security policies while enabling a phased cutover approach.

## Problem Statement
Create a CloudFormation template to establish the AWS infrastructure needed for migrating an on-premises application. The configuration must:

1. Set up a VPC with public and private subnets across two availability zones
2. Configure a Site-to-Site VPN connection with customer gateway for on-premises connectivity
3. Deploy an RDS Aurora MySQL cluster in private subnets as the migration target
4. Create a DMS replication instance and endpoints for continuous data sync
5. Implement an Application Load Balancer in public subnets for the web tier
6. Configure security groups allowing VPN traffic and restricting database access
7. Set up Secrets Manager to store database credentials securely
8. Create CloudWatch alarms for DMS replication lag monitoring
9. Use Parameters for environment-specific values like VPN IP addresses
10. Enable deletion protection on critical resources

## Environment
Migration infrastructure deployed in us-east-2 for transferring on-premises workloads to AWS. Uses DMS for database replication from on-premises MySQL to RDS Aurora MySQL, Site-to-Site VPN for secure connectivity, and Application Load Balancer for web tier. VPC configured with 10.0.0.0/16 CIDR spanning 2 availability zones with public and private subnets. Requires AWS CLI configured with appropriate IAM permissions for DMS, VPC, RDS, and Secrets Manager services.

## Constraints
1. Use AWS Database Migration Service (DMS) for continuous data replication
2. Implement VPN connectivity between on-premises and AWS environments
3. Database credentials must be stored in AWS Secrets Manager
4. Enable CloudWatch monitoring for migration progress tracking
5. Use parameter store for environment-specific configurations
6. Implement rollback capability using CloudFormation stack policies

## Expected Output
A CloudFormation YAML template that creates all migration infrastructure components with proper dependencies and outputs for connection strings, VPN configuration details, and monitoring dashboard URLs.
