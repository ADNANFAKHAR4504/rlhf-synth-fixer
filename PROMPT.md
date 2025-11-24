# Task: Security Configuration as Code

## Scenario
A SaaS startup needs to set up isolated cloud environments for their multi-tenant application. Each tenant requires dedicated compute resources with strict network isolation and centralized audit logging. The infrastructure must support automatic tenant onboarding while maintaining security boundaries.

## Problem Statement
Create a CDKTF Python program to provision isolated cloud environments for a multi-tenant SaaS platform. The configuration must:

1. Define a TenantStack class that creates isolated resources for each tenant including VPC, subnets, and security groups.
2. Create Lambda functions with 256MB memory and 60-second timeout for tenant API endpoints with reserved concurrency of 10.
3. Provision DynamoDB tables for tenant metadata with partition key 'tenant_id' and sort key 'resource_type'.
4. Create S3 buckets with intelligent tiering and server-side encryption using tenant-specific KMS keys.
5. Implement IAM roles with tenant-scoped permissions using principalTag conditions.
6. Set up CloudWatch Log groups with 30-day retention and subscription filters for central monitoring.
7. Configure EventBridge rules to trigger tenant provisioning workflows on signup events.
8. Use CDKTF outputs to export tenant endpoints, bucket names, and table ARNs.
9. Implement resource tagging with 'TenantId', 'Environment', and 'ManagedBy' tags on all resources.
10. Create a main app that synthesizes stacks for 3 example tenants: 'acme-corp', 'tech-startup', 'retail-co'.

Expected output: A CDKTF Python application with modular tenant stack definitions that can be deployed using 'cdktf deploy' to create fully isolated multi-tenant infrastructure with proper security boundaries and centralized observability.

## Context
Multi-tenant SaaS infrastructure deployed in us-east-1 using isolated VPCs per tenant, Lambda for compute, DynamoDB for tenant metadata storage, S3 for tenant data storage with KMS encryption. Requires CDKTF 0.15+ with Python 3.9+, AWS CDK libraries for Python. Each tenant gets a dedicated VPC with private subnets across 2 AZs, no NAT gateways to reduce costs. Central logging aggregates all tenant logs to a shared CloudWatch Logs group with strict IAM policies preventing cross-tenant access.

## Constraints
- Each tenant must have a dedicated VPC with non-overlapping CIDR blocks starting from 10.0.0.0/16
- Cross-tenant network traffic must be explicitly blocked using VPC peering deny rules
- All tenant resources must use KMS encryption with tenant-specific CMKs
- Lambda functions must use reserved concurrent executions to prevent noisy neighbor issues
- DynamoDB tables must use on-demand billing mode with contributor insights enabled
- S3 buckets must have versioning enabled and lifecycle policies for 90-day object expiration
- CloudWatch Logs must use a centralized log group with tenant-prefixed log streams
