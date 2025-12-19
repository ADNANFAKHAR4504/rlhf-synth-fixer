# Multi-Tier VPC Infrastructure

This CDKTF TypeScript project deploys a production-ready VPC architecture with complete network segmentation across 3 availability zones.

## Architecture Overview

The infrastructure creates:

- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Public Subnets** (3): For load balancers - 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private App Subnets** (3): For application servers - 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **Private DB Subnets** (3): For databases - 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
- **Internet Gateway**: Named igw-prod-us-east-1
- **NAT Gateways** (3): One per AZ for high availability
- **Elastic IPs** (3): For NAT Gateways
- **Route Tables**: Public (1) and Private (6) with explicit associations
- **Network ACLs**: HTTP/HTTPS allowed, SSH explicitly denied
- **VPC Flow Logs**: All traffic logged to CloudWatch

## Prerequisites

- Node.js 18+
- AWS credentials configured
- CDKTF CLI installed: `npm install -g cdktf-cli`
- Terraform 1.5+

## Installation

```bash
npm install
```

## Deployment

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy

# Destroy infrastructure
cdktf destroy
```

## Configuration

The infrastructure uses an `environmentSuffix` parameter to enable multiple parallel deployments. This is automatically provided by the CI/CD pipeline.

## Security Features

1. **Network Isolation**: Three-tier architecture separates public, application, and database layers
2. **High Availability**: NAT Gateways deployed across 3 AZs
3. **Network ACLs**: Explicit SSH denial from internet
4. **Flow Logs**: Comprehensive network traffic monitoring
5. **Encryption**: All data in transit and at rest

## Resource Naming

All resources follow the pattern: `{resource-type}-${environmentSuffix}`

Examples:
- VPC: `vpc-${environmentSuffix}`
- Public Subnet 1: `public-subnet-1-${environmentSuffix}`
- NAT Gateway 1: `nat-gateway-1-${environmentSuffix}`

## Compliance

- VPC Flow Logs retained for 7 days
- All resources tagged with Environment='prod' and Project='apac-expansion'
- Network traffic logging for audit trail
