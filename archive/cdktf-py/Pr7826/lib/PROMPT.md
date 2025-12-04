# Task: Multi-Region Disaster Recovery for Payment Processing API

## Platform and Language
**CRITICAL CONSTRAINTS (NON-NEGOTIABLE):**
- Platform: **CDKTF** (Terraform CDK)
- Language: **Python**

## Problem Statement

Create a CDKTF Python program to implement a multi-region disaster recovery architecture for a payment processing API. The configuration must:

1. Deploy API Gateway REST APIs in both us-east-1 and us-east-2 with custom domain names
2. Create DynamoDB global tables with automatic replication between regions
3. Implement Lambda functions for payment validation and processing in both regions
4. Configure Route 53 hosted zone with health checks and automatic failover routing
5. Set up SQS queues with dead letter queues for failed transaction handling
6. Create CloudWatch alarms monitoring API latency, Lambda errors, and DynamoDB throttles
7. Configure SNS topics for operational alerts in both regions
8. Implement Lambda function for automated failover orchestration
9. Set up CloudWatch dashboards showing cross-region metrics
10. Create IAM roles with least privilege access for all components

Expected output: A complete CDKTF application that deploys identical stacks in both regions, with Route 53 automatically directing traffic to the healthy region. The system should handle regional failures transparently, maintaining transaction integrity during failover events.

## Background

A financial services company requires a disaster recovery solution for their critical payment processing API. The system must maintain 99.99% availability and automatically failover between regions with minimal data loss. Recent outages in their primary region have highlighted the need for a robust multi-region architecture.

## Architecture Requirements

Multi-region active-passive disaster recovery infrastructure spanning us-east-1 (primary) and us-east-2 (secondary). Architecture includes:
- API Gateway with custom domains
- Lambda functions for payment processing
- DynamoDB global tables for transaction storage
- SQS for asynchronous processing
- Route 53 manages DNS failover with health checks monitoring API Gateway endpoints
- CloudWatch monitors system health and triggers automated failover through SNS and Lambda

Requires AWS CDK 2.x with Python 3.9+, boto3, and AWS CLI configured with appropriate credentials. VPCs in both regions with private subnets for Lambda functions.

## Specific Constraints

1. DynamoDB tables must use on-demand billing mode
2. Dead letter queues must be configured for all SQS queues
3. All resources must be tagged with Environment and Region tags
4. All Lambda functions must have reserved concurrent executions set
5. DynamoDB global tables must have point-in-time recovery enabled
6. Use Route 53 health checks with failover routing policy
7. Cross-region replication must complete within 1 second
8. API Gateway must use custom domain names with ACM certificates
9. CloudWatch alarms must trigger SNS notifications for failover events
10. Lambda functions must be deployed in both us-east-1 and us-east-2

## CRITICAL: Resource Naming Convention

ALL resource names MUST include the environment suffix to support parallel deployments:
- Pattern: `resource-name-${environment_suffix}` or `resource-name-${props.environment_suffix}`
- The environment_suffix is provided as a variable/property and MUST be used consistently
- This ensures no naming conflicts in parallel CI/CD deployments

## CRITICAL: Destroyability Requirements

ALL resources MUST be fully destroyable:
- NO `RemovalPolicy.RETAIN` or `DeletionPolicy: Retain`
- NO `deletion_protection: true` on databases
- S3 buckets must allow deletion (handled after PR review)
- RDS instances must set `skip_final_snapshot: true`

## Training Quality Requirements

This task MUST meet a minimum training quality score of 8/10:
- Implement ALL AWS services from the requirements
- Follow AWS best practices for security, monitoring, and resilience
- Include proper IAM least privilege access patterns
- Implement comprehensive error handling and retry logic
- Use appropriate encryption for data at rest and in transit
