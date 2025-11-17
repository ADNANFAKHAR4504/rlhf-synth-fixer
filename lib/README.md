# Zero-Trust Payment Processing Infrastructure

This CDKTF Python implementation provides a comprehensive zero-trust security framework for payment processing workloads, compliant with PCI-DSS Level 1 and SOC 2 Type II requirements.

## Architecture Overview

The infrastructure implements a complete zero-trust network architecture with:

- **Private VPC**: 3 private subnets across availability zones (no internet gateway)
- **Network Firewall**: HTTPS-only stateful rules with traffic inspection
- **Encryption**: Customer-managed KMS keys with automatic rotation
- **Audit Logging**: S3 buckets with object lock and 7-year retention
- **VPC Endpoints**: Private access to S3, DynamoDB, EC2, Systems Manager
- **Monitoring**: CloudWatch Logs with 7-year retention and integrity validation
- **IAM Security**: Roles with 1-hour session limits and external ID requirements
- **Compliance**: Mandatory resource tagging and secure parameter storage

## Module Structure
