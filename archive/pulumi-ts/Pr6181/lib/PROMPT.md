# Multi-Region Disaster Recovery Infrastructure

Hey! I need your help setting up a robust disaster recovery infrastructure across multiple AWS regions using Pulumi with TypeScript.

## Background

We're building a high-availability application that needs to be resilient to regional failures. The application should be able to automatically failover between us-east-1 (primary) and us-west-2 (secondary) regions in case of a disaster.

## What I Need

### 1. Multi-Region VPC Setup
- Deploy identical VPCs in both us-east-1 and us-west-2
- Each VPC should have:
  - Public and private subnets across 2 availability zones
  - NAT Gateway for private subnet internet access
  - Internet Gateway for public subnets
- Set up VPC Peering between the two regional VPCs
- Configure proper routing tables for cross-region communication

### 2. Application Layer
- Deploy Lambda functions in both regions
- Lambda functions should:
  - Have Function URLs enabled for HTTP access
  - Store and retrieve data from DynamoDB
  - Be deployed in the VPC for secure database access
  - Have proper IAM permissions for all operations

### 3. Database Layer
- Set up DynamoDB Global Tables for cross-region replication
- Table should have:
  - Replica in both us-east-1 and us-west-2
  - Automatic data synchronization between regions
  - On-demand billing mode

Alternatively, if using Aurora:
- Deploy Aurora Global Database
- Primary cluster in us-east-1, secondary in us-west-2
- Store database credentials in AWS Secrets Manager
- Enable automatic backups

### 4. Storage Layer
- Create S3 buckets in both regions
- Enable cross-region replication from primary to secondary bucket
- Enable versioning on both buckets

### 5. DNS and Traffic Management
- Configure Route 53 health checks for both regions
- Set up failover routing policy:
  - Primary record pointing to us-east-1 Lambda URL
  - Secondary record pointing to us-west-2 Lambda URL
  - Automatic failover when health check fails

Note: For testing purposes, we can use a subdomain or make Route 53 optional if domain validation is complex.

## Technical Requirements

- Use Pulumi with TypeScript
- Leverage the environmentSuffix variable for resource naming
- All resources should be tagged appropriately
- Ensure proper security groups and IAM roles
- Make Route 53 health checks optional or use simple endpoints
- VPC-connected Lambdas should either:
  - Skip VPC configuration (simpler for testing), OR
  - Include VPC endpoints for DynamoDB, S3, and Secrets Manager access

## Expected Outcomes

1. Infrastructure that can survive a complete regional outage
2. Automatic failover with minimal downtime
3. Data replication between regions
4. Health checks to detect failures
5. Clean deployment and teardown (no persistent resources)

## Simplifications Allowed

Since this is for testing and validation:
- Can use simple Lambda Function URLs instead of complex ALB setup
- Can make Route 53 failover optional/conditional
- Can use DynamoDB instead of Aurora if simpler
- Can remove VPC from Lambda if it causes deployment complexity
- Focus on demonstrating the DR pattern rather than production-scale setup

Let me know if you need any clarification on the requirements!