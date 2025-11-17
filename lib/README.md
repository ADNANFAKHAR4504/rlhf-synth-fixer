# Multi-Account VPC Peering Infrastructure

This CDKTF Python implementation creates a secure multi-account VPC peering setup for payment and analytics environments with PCI DSS compliant security controls.

## Architecture Overview

The infrastructure creates:

- **Two VPCs**: Payment (10.0.0.0/16) and Analytics (10.1.0.0/16)
- **Multi-AZ Design**: 3 availability zones with public and private subnets
- **VPC Peering**: Secure cross-account connectivity
- **NAT Gateways**: One per AZ for high availability
- **Security Controls**: Security groups and Network ACLs
- **Monitoring**: VPC Flow Logs with S3 storage (90-day retention)
- **DNS Resolution**: Route 53 private hosted zones for cross-VPC service discovery

## Prerequisites

### Software Requirements

- Python 3.8 or higher
- Node.js 16.x or higher (for CDKTF)
- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials

### Install Dependencies