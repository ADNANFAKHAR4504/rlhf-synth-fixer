Need to build out a multi-region serverless app with proper failover capabilities using Pulumi. Here's what we're looking to deploy across us-east-1 and us-west-2.

## Core Setup

The main application is serverless Lambda functions that need to access a Multi-AZ RDS database. Lambda needs to read/write to both DynamoDB and S3 buckets. Everything should be properly networked with security in mind.

## Networking Requirements

Set up a VPC in each region with both public and private subnets across multiple availability zones. The Application Load Balancer goes in the public subnets while Lambda functions and the RDS instance should be in private subnets only.

Make sure Lambda functions can connect to the RDS database through security groups - restrict the traffic so only Lambda can reach the database. All security group rules should follow least-privilege principles.

## Serverless Components

Deploy Lambda functions with 512 MB memory in the private subnets. They need VPC access to reach the RDS instance securely. For IAM permissions, use least privilege - give each Lambda role only the specific actions and resources it needs for DynamoDB and S3 access, no wildcard permissions.

## Data Layer

RDS should be db.m5.large instance type with Multi-AZ enabled and KMS encryption at rest. For DynamoDB tables, enable auto-scaling for both read and write capacity plus KMS encryption. S3 buckets need to be private only with versioning enabled and KMS encryption.

## Security and Compliance

All resources must be tagged with Project:PulumiOptimization for cost tracking. Enable AWS WAF on public endpoints with rate limiting set to 1000 requests per minute. ALBs should redirect HTTP traffic to HTTPS automatically. CloudTrail needs to be active in both regions for audit logging and monitoring.

## Multi-Region Failover

S3 and DynamoDB should have cross-region replication configured. RDS needs a cross-region read replica strategy to maintain availability if one region goes down.

## Implementation Notes

Structure the code into separate reusable components for networking, security, database, and serverless pieces. Add comments where services connect to each other so it's clear how the pieces fit together. Make sure resource dependencies are set up correctly so Pulumi deploys things in the right order.

Use KMS encryption wherever AWS supports it. All IAM policies should specify exact actions and resources instead of wildcards.
