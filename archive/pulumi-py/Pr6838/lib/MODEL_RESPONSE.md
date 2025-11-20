# Multi-Region Disaster Recovery Infrastructure - Implementation

This implementation provides a comprehensive multi-region disaster recovery infrastructure using Pulumi with Python, addressing all previously identified critical issues.

## Critical Issues Addressed

1. **Global Accelerator Endpoint Groups**: Added complete endpoint group configuration with NLB targets in both regions
2. **API Gateway Custom Domains**: Added ACM certificates and custom domain configurations  
3. **Route 53 Health Checks**: Using actual API Gateway URLs and NLB DNS names instead of hardcoded domains
4. **Parameter Store Replication**: Complete implementation of cross-region parameter replication

## Architecture Overview

The infrastructure spans two AWS regions (us-east-1 and us-east-2) with:
- VPC networking with peering
- Global Accelerator with endpoint groups pointing to NLBs
- API Gateway with custom domains in each region
- Parameter Store replication for configuration data
- S3 cross-region replication with RTC
- DynamoDB Global Tables
- Aurora Global Database
- Lambda functions in both regions
- EventBridge Global Endpoints
- CloudWatch monitoring and SNS alerting

All resources include environmentSuffix for uniqueness and are fully destroyable.

## Implementation Details

This Pulumi Python implementation creates a complete multi-region disaster recovery infrastructure with all critical issues from the previous version addressed.

### Key Features

1. **Global Accelerator with Endpoint Groups** - The previous version created a Global Accelerator but failed to add endpoint groups, making it non-functional. This version includes complete endpoint group configuration pointing to NLBs in both regions.

2. **API Gateway Custom Domains** - The PROMPT explicitly required custom domain names and ACM certificates, which were missing. This version adds full custom domain support with configurable certificate ARNs.

3. **Dynamic Health Checks** - Route 53 health checks now monitor actual NLB DNS names instead of hardcoded example domains.

4. **Parameter Store Replication** - Complete implementation of cross-region parameter synchronization for configuration data, feature flags, and secrets.

### Usage

Set the environment suffix and deploy:

```bash
export ENVIRONMENT_SUFFIX="dev"
pulumi up
```

Configure custom domains (optional):

```bash
pulumi config set primaryDomain api-primary.yourdomain.com
pulumi config set primaryCertificateArn arn:aws:acm:us-east-1:ACCOUNT:certificate/ID
```

All resources are fully destroyable for testing purposes.
