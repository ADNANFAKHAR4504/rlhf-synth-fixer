# AWS CloudFormation Template Design Challenge

## Overview

Build a production-ready AWS CloudFormation template that creates a secure, highly available infrastructure in us-east-1. The template should be deployable across different AWS accounts and combine all infrastructure components in a single YAML file.

## Core Infrastructure Requirements

### Network Layer

1. VPC Configuration
   - Main CIDR: 10.0.0.0/16

2. Subnet Layout
   - Public Subnets
     - 2 subnets across different AZs
     - CIDR ranges: 10.0.1.0/24, 10.0.2.0/24
   - Private Subnets
     - 2 subnets across different AZs
     - CIDR ranges: 10.0.3.0/24, 10.0.4.0/24

3. Gateway Setup
   - Internet Gateway
     - Attach to VPC for public access
   - NAT Gateway
     - Deploy in public subnet
     - Needs Elastic IP allocation

4. Routing Configuration
   - Public Routes
     - Default route (0.0.0.0/0) to Internet Gateway
     - Link to public subnets
   - Private Routes
     - Default route (0.0.0.0/0) to NAT Gateway
     - Link to private subnets

5. Network Security
   - Inbound Rules
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
   - Outbound Rules
     - Allow all traffic

### Access Management

1. IAM Configuration
   - EC2 instance role for S3 access
   - S3 bucket policy with list/get/put/delete permissions

2. Storage Setup
   - S3 Bucket
     - Enable versioning
     - Block all public access

### Database Layer

1. RDS Setup
   - MySQL deployment
   - Private subnet placement
   - Multi-AZ configuration
   - Automated backups
   - Configurable settings:
     - Instance class
     - Engine version
     - Backup retention
     - Access credentials
   - No public access

2. DynamoDB Configuration
   - Configurable table name
   - Capacity settings:
     - Read units: 5
     - Write units: 5
   - Schema:
     - Primary key: id (String)

## Technical Requirements

1. Cross-Account Support
   - Template must work in any AWS account
   - Region-independent deployment
   - No environment-specific modifications needed

2. Dynamic Configuration
   - No hardcoded values for:
     - ARNs
     - Account IDs
     - Region names
     - Resource names
   - Use parameters or AWS pseudo parameters
   - Example: ${AWS::AccountId}, ${AWS::Region}

3. Parameter Management
   - User inputs for:
     - CIDR ranges
     - Database credentials
     - Bucket names
   - Define as CloudFormation Parameters

4. Security Standards
   - Multi-AZ subnet distribution
   - Private resource protection
   - S3 security best practices
   - Database redundancy and backups