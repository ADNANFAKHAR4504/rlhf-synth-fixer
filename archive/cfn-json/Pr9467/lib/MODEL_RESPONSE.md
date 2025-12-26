# CloudFormation High Availability Payment Processing Infrastructure

This solution implements a highly available, multi-AZ payment processing infrastructure using CloudFormation JSON.

## Architecture Overview

- **VPC**: 3 Availability Zones with public and private subnets
- **Database**: Aurora PostgreSQL cluster (1 writer + 2 readers across different AZs)
- **Application**: ECS Fargate with 6 tasks distributed across 3 AZs
- **Load Balancing**: Application Load Balancer with health checks
- **DNS Failover**: Route 53 failover routing between primary and secondary endpoints
- **Monitoring**: CloudWatch alarms, dashboard, and SNS notifications
- **Security**: KMS encryption for all data at rest

## Files Created

1. `lib/TapStack.json` - Main CloudFormation template
2. `lib/README.md` - Deployment and usage documentation
3. `test/integration.test.js` - Comprehensive integration tests
4. `test/package.json` - Test dependencies

All resources include the EnvironmentSuffix parameter for unique naming and parallel deployments.
All resources use DeletionPolicy: Delete or omit the policy for clean destruction.
Aurora cluster has DeletionProtection: false for automated testing.
