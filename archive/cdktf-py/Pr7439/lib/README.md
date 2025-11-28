# Multi-Region Disaster Recovery Infrastructure

This CDKTF Python application deploys a comprehensive multi-region disaster recovery solution for a healthcare platform with HIPAA compliance requirements.

## Architecture Overview

The infrastructure spans two AWS regions:
- **Primary Region**: us-east-1 (70% traffic weight)
- **Secondary Region**: us-west-2 (30% traffic weight)

## Key Components

### Data Layer
- **DynamoDB Global Tables**: patient_records and audit_logs with point-in-time recovery
- **S3 Cross-Region Replication**: Encrypted buckets with automatic replication
- **KMS Encryption**: Customer-managed keys in both regions with annual rotation

### Compute Layer
- **Lambda Functions**: Health check functions in both regions (3GB memory, 30s timeout)
- **IAM Roles**: Least privilege roles with cross-region assume permissions

### Networking
- **VPC Peering**: Secure cross-region communication
- **Security Groups**: Controlled traffic between regions

### Traffic Management
- **Route 53**: Weighted routing (70/30 split) with health checks
- **Health Checks**: Trigger failover on 3 consecutive failures

### Monitoring & Alerting
- **CloudWatch Dashboards**: Replication lag and failover metrics
- **CloudWatch Alarms**: Health check failures and replication lag alerts
- **SNS Topics**: Notifications in both regions

## Deployment Requirements

### Prerequisites
1. Python 3.9 or higher
2. Node.js 16 or higher (for CDKTF)
3. Terraform >= 1.0
4. AWS CLI configured with appropriate credentials

### Installation

