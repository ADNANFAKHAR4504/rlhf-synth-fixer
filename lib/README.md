# Multi-Region Disaster Recovery Infrastructure

This CDKTF Python application deploys a complete multi-region disaster recovery solution for a payment processing system across AWS us-east-1 (primary) and us-west-2 (secondary) regions.

## Architecture

### Components

1. **Networking**
   - VPCs in both regions (10.0.0.0/16 and 10.1.0.0/16)
   - 3 private subnets per region across multiple AZs
   - VPC peering connection for cross-region communication
   - Security groups for database and Lambda functions

2. **Database**
   - Aurora Global Database with PostgreSQL 15.3
   - Primary cluster in us-east-1, secondary in us-west-2
   - 2 instances per cluster for high availability
   - Encrypted storage enabled
   - Secrets Manager for credential storage with 30-day rotation

3. **Compute**
   - DynamoDB global table for session state (pay-per-request)
   - Lambda functions (ARM Graviton2) in both regions
   - Payment processor Lambda with VPC integration
   - Automated backup verification Lambda (scheduled daily)

4. **DNS & Failover**
   - Route 53 hosted zone with failover routing
   - Health checks for both regions (30s interval, 3 failure threshold)
   - Primary-secondary failover configuration
   - < 60 second failover time

5. **Monitoring**
   - CloudWatch alarms for CPU, errors, throttling, replication lag
   - SNS topic for alert notifications
   - Custom metrics for backup verification

## Prerequisites

- Python 3.9+
- CDKTF 0.19+
- AWS CLI configured with appropriate credentials
- Node.js 16+ (for CDKTF)
- Terraform 1.5+

## Installation

1. Install dependencies:
