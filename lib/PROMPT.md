# Multi-Region Disaster Recovery Financial Transaction Processing System

## Role

You are an expert AWS Solutions Architect and CDKTF (Terraform CDK in TypeScript) practitioner.

## Goal

Produce a production-ready CDKTF TypeScript program that deploys a multi-region disaster recovery solution for a critical financial transaction processing application. The system must achieve automated failover within 5 minutes while ensuring compliance, data consistency, and auditability.

## Deliverable

A self-contained CDKTF TypeScript project:

- `main.ts` (or `index.ts`) with stack name(s) reflecting `financial-processor`
- Uses AWS provider v5.0+
- Configured with primary region `us-east-2` and secondary region `us-west-2`
- Output only code, no prose, with brief inline comments

## Requirements

### Networking

- Deploy VPCs in both primary and secondary regions with subnets, routing, and NAT gateways as needed
- Ensure secure, encrypted inter-region traffic

### Data Layer

**DynamoDB Global Tables** for transaction data:

- RPO < 1 minute with multi-region replication
- On-demand billing mode
- Encryption at rest using KMS, with separate keys per region

**S3 Buckets** with Cross-Region Replication (CRR) enabled:

- Versioning + replication rules between primary and secondary
- SSE-KMS with distinct keys per region

### Failover & Health Monitoring

- Route53 health checks monitoring application endpoints in both regions
- Failover routing policy: primary → secondary region within 5 minutes of outage detection

**EventBridge Rules + Lambda functions:**

- Detect unhealthy endpoints
- Automate failover updates in Route53

### Security & Compliance

- IAM roles/policies with least privilege for all services
- KMS encryption (separate keys per region)
- TLS enforced for in-transit encryption

### Observability

- CloudWatch Alarms & Metrics for health checks and failover triggers
- Centralized logging for audit trails

### Tagging

All resources must be tagged with:

- `Environment: production`
- `App: financial-processor`
- `ManagedBy: CDKTF`
- `CostCenter` (configurable)

## Stack Config

- **Primary region:** `us-east-2`
- **Secondary region:** `us-west-2`
- **App name:** `financial-processor`
- **Environment:** `production`

### Required Components

- [ ] VPC configuration (both regions)
- [ ] DynamoDB Global Tables
- [ ] S3 with CRR
- [ ] Lambda functions for health checks & failover
- [ ] Route53 health checks and failover policy
- [ ] KMS key configurations (per region)
- [ ] IAM roles and policies

## Tools

- Node.js >= 16.x
- CDKTF CLI >= 0.15.0
- AWS Account with admin access
- TypeScript dev environment
- AWS Provider for CDKTF

## Output Format

Return the complete CDKTF TypeScript project code (multiple files allowed) that provisions all required resources with correct cross-region configurations, IAM, encryption, and tagging.
