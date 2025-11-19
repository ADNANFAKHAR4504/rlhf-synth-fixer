# Payment Processing System Migration Infrastructure

This CDKTF Python project implements a complete infrastructure for migrating a payment processing system from on-premises to AWS with phased rollout capability.

## Architecture

The infrastructure includes:

- **Networking**: VPC with 3 public and 3 private subnets across 3 availability zones
- **Database**: RDS Aurora MySQL cluster with 1 writer and 2 reader instances
- **Compute**: Auto Scaling group (3-9 instances) behind Application Load Balancer
- **Migration**: AWS DMS for continuous database replication
- **Traffic Management**: Route 53 weighted routing for gradual cutover
- **Monitoring**: CloudWatch dashboards and alarms
- **Security**: Security groups, encryption at rest and in transit, VPN connectivity

## Workspace Configuration

The infrastructure supports two Terraform workspaces:

1. **legacy-sync**: Initial migration phase with 90% traffic to on-premises
2. **aws-production**: Production phase with balanced traffic distribution

## Prerequisites

- Python 3.9+
- Pipenv
- AWS CLI configured with appropriate credentials
- Terraform 1.5+
- Existing VPN connection to on-premises network

## Deployment

### Initialize the project