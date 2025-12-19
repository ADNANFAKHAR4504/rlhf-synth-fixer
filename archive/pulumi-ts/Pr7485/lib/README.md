# Multi-Environment Payment Processing System

This Pulumi TypeScript project implements a multi-environment payment processing system with automated deployment across dev, staging, and production environments.

## Architecture

### Components

- **PaymentProcessor ComponentResource**: Reusable infrastructure pattern containing:
  - AWS Lambda function for payment processing (ARM64 architecture)
  - DynamoDB table for transaction storage
  - SNS topic for notifications
  - SQS dead letter queue for failed processing

- **VPC Configuration**:
  - Private subnets for Lambda isolation
  - VPC endpoints for DynamoDB (Gateway type)
  - VPC endpoints for SNS (Interface type)

### Multi-Environment Setup

The infrastructure deploys to three separate environments:

| Environment | Region      | Lambda Memory | Concurrency | PITR  | DLQ Retries |
|-------------|-------------|---------------|-------------|-------|-------------|
| dev         | us-east-1   | 512 MB        | 1           | No    | 2           |
| staging     | us-west-2   | 1 GB          | 10          | Yes   | 3           |
| prod        | eu-west-1   | 2 GB          | 100         | Yes   | 5           |

## Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed (`curl -fsSL https://get.pulumi.com | sh`)
- AWS CLI configured with credentials for all three accounts
- Cross-account IAM roles configured for deployment

## Installation

```bash
npm install
