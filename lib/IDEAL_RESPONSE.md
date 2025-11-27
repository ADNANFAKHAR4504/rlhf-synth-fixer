# VPC Network Infrastructure for Payment Processing - Terraform HCL

This implementation provides a production-ready, PCI DSS-compliant VPC network infrastructure for a fintech payment processing system using Terraform HCL.

## Overview

A three-tier network architecture deployed across three availability zones in us-east-1, providing strict network isolation between public-facing load balancers, private application servers, and database tiers. The infrastructure supports 4000+ hosts with high availability NAT Gateways and comprehensive network access controls.

## Architecture

### Network Tiers

1. **Public Tier** (3 subnets): Load balancers and internet-facing resources
2. **Private Tier** (3 subnets): Application servers with NAT Gateway internet access
3. **Database Tier** (3 subnets): Databases with zero internet connectivity

### High Availability

- 3 Availability Zones (us-east-1a, us-east-1b, us-east-1c)
- 3 NAT Gateways (one per AZ) for redundancy
- Dedicated route table per private subnet for NAT failover isolation

### Security Controls

- Network ACLs with explicit deny-by-default rules
- Database subnets completely isolated from internet
- VPC Flow Logs capturing all traffic
- PCI DSS-compliant network segmentation

## Complete Source Code

### File: provider.tf

```hcl
