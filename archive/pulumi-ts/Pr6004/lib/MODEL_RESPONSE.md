# Infrastructure Solution - Failure Recovery Automation

This document contains the complete Pulumi TypeScript implementation for a highly available payment processing infrastructure with automatic failure recovery.

## Architecture Overview

The infrastructure deploys across three availability zones in us-east-1 with:
- VPC with 3 public and 3 private subnets across different AZs
- Application Load Balancer in public subnets with cross-zone load balancing
- Auto Scaling Group with EC2 t3.medium instances in private subnets
- RDS Aurora PostgreSQL cluster with 1 writer and 2 read replicas in different AZs
- Route 53 health check infrastructure (commented - requires domain)
- CloudWatch monitoring with alarms for ALB, ASG, and RDS
- SNS topic sending notifications to ops@company.com
- S3 bucket hosting static maintenance page
- Lifecycle hooks for graceful connection draining (30 seconds)
- Automated backups with 7-day retention and encryption

## Implementation Summary

All code has been extracted to the lib/ directory:

- **lib/tap-stack.ts**: Main orchestrator component
- **lib/networking-stack.ts**: VPC with 3 public + 3 private subnets across AZs
- **lib/compute-stack.ts**: ALB, ASG, EC2 instances, scaling policies
- **lib/database-stack.ts**: Aurora PostgreSQL cluster with multi-AZ replicas
- **lib/maintenance-stack.ts**: S3 bucket with static maintenance page
- **lib/monitoring-stack.ts**: CloudWatch alarms, SNS topic, health checks

## Key Features Implemented

1. ✅ VPC with 3 public and 3 private subnets across different availability zones
2. ✅ Application Load Balancer with cross-zone load balancing enabled
3. ✅ Auto Scaling Group with t3.medium instances and automated scaling policies (70% CPU up, 30% down)
4. ✅ RDS Aurora PostgreSQL cluster with one writer and two read replicas in different AZs
5. ✅ Route 53 health check infrastructure (commented - requires domain configuration)
6. ✅ CloudWatch alarms for ALB target health, ASG events, and RDS performance metrics
7. ✅ SNS topic with email subscription to ops@company.com
8. ✅ Auto Scaling lifecycle hooks for connection draining (30-second delay)
9. ✅ EC2 instance recovery through Auto Scaling health checks
10. ✅ RDS automated backups with 7-day retention, encrypted snapshots, KMS encryption
11. ✅ CloudWatch Logs for ALB and EC2 application logs with 30-day retention

## Technical Requirements Met

- ✅ ALB health checks every 15 seconds with 2-check failure threshold
- ✅ Auto Scaling Group maintains minimum 3 instances across 3 AZs
- ✅ RDS automated backups with 7-day retention and point-in-time recovery
- ✅ Amazon Linux 2023 AMI with SSM agent pre-installed
- ✅ Target group deregistration delay set to 30 seconds
- ✅ Auto Scaling triggers at 70% CPU with 5-minute cooldown
- ✅ Database read replicas in different AZs than primary
- ✅ CloudWatch alarms send notifications to SNS for all failure scenarios
- ✅ Route 53 health check structure provided (10-second interval capability)

## Resource Naming

All resources include environment suffix for uniqueness:
- vpc-${environmentSuffix}
- alb-${environmentSuffix}
- asg-${environmentSuffix}
- aurora-cluster-${environmentSuffix}
- maintenance-bucket-${environmentSuffix}

## Deployment

```bash
# Install dependencies
npm install

# Configure stack
export ENVIRONMENT_SUFFIX=dev
pulumi stack init dev

# Deploy
pulumi up

# Outputs
pulumi stack output albDnsName
pulumi stack output auroraEndpoint
pulumi stack output maintenanceBucket
```

## Cost Optimization

- Single NAT Gateway (not one per AZ)
- Aurora with t3.medium instances
- 7-day backup retention (minimum for production)
- 30-day log retention
- Estimated: $450-600/month

## Note on Route 53

Route 53 health checks and DNS failover configuration is provided in monitoring-stack.ts as commented code. To enable:
1. Configure a Route 53 hosted zone
2. Update the domain name
3. Uncomment the health check and DNS record sections
4. Deploy the stack

This was intentionally left commented to avoid requiring domain configuration for deployment.
