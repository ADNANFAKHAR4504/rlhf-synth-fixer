# VPC Infrastructure for Financial Trading Platform

This CloudFormation template deploys a production-ready VPC infrastructure with multi-tier networking for a financial trading platform. The infrastructure is designed to meet PCI-DSS compliance requirements with proper network segmentation.

## Architecture

The infrastructure creates:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **3 Public Subnets**: Across 3 AZs for load balancers and bastion hosts
- **3 Private Subnets**: Across 3 AZs for application servers
- **3 Database Subnets**: Across 3 AZs for RDS instances
- **Internet Gateway**: For public internet access
- **3 NAT Gateways**: One per AZ for private subnet outbound connectivity
- **Route Tables**: Separate route tables for each subnet type and AZ
- **Network ACLs**: Security controls with deny-by-default policy
- **VPC Flow Logs**: Network traffic logging to CloudWatch (7-day retention)

## Network Layout

| Subnet Type | CIDR Blocks | Availability Zones | Connectivity |
|------------|-------------|-------------------|--------------|
| Public | 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 | us-east-1a/b/c | Internet Gateway |
| Private | 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24 | us-east-1a/b/c | NAT Gateways |
| Database | 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24 | us-east-1a/b/c | NAT Gateways |

## Prerequisites

- AWS CLI configured with appropriate credentials
- IAM permissions for:
  - VPC and EC2 resources
  - CloudFormation stack operations
  - CloudWatch Logs
  - IAM role creation

## Deployment

### Deploy the Stack
