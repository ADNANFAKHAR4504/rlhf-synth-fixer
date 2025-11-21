# Payment Processing Pipeline Infrastructure

## Project Overview

This project involves building a robust, multi-stage payment processing system for a financial technology company that handles millions of credit card transactions daily. The system needs to be fault-tolerant, scalable, and maintain strict ordering guarantees for related transactions.

## Business Context

Our fintech client operates a payment gateway that processes high-volume credit card transactions. They require an asynchronous processing system that can:

- Handle transaction validation efficiently
- Perform real-time fraud detection
- Send payment notifications to customers
- Maintain transaction ordering per merchant
- Provide disaster recovery capabilities

## Architecture Requirements

### Infrastructure Design

**Multi-Region Setup:**
- Primary region: `us-east-1`
- Disaster recovery region: `us-west-2`
- Each region contains dedicated VPCs with 3 availability zones
- Private subnets for secure compute resources
- VPC endpoints for private AWS service access

**Core Services:**
- SQS FIFO queues for transaction processing
- Lambda functions for message processing
- DynamoDB for transaction state management
- SNS for notification delivery
- CloudWatch for monitoring and alerting

### Detailed Requirements

#### 1. SQS Queue Configuration
- **Three FIFO queues** for different processing stages:
  - Transaction validation queue
  - Fraud detection queue
  - Payment notification queue
- **Message grouping** by merchant account numbers for ordered processing
- **Dead letter queues** for each primary queue with 3 retry attempts
- **Queue policies** restricting access to specific Lambda execution roles
- **Message attributes**: 256KB max size, 300-second visibility timeout

#### 2. Monitoring and Alerting
- CloudWatch alarms for:
  - Queue depth exceeding 1,000 messages
  - Any messages in dead letter queues
- SSM parameters storing queue URLs for Lambda configuration

#### 3. Message Flow Management
- EventBridge Pipes for queue-to-queue message forwarding
- Cross-region replication using S3 bucket events and Lambda
- Content-based deduplication for FIFO queues

#### 4. Security and Compliance
- Server-side encryption using AWS managed keys (SSE-SQS)
- IAM roles with least-privilege policies for each processing stage
- 7-day message retention period for audit compliance
- Comprehensive tagging strategy (Environment, Team, CostCenter)

#### 5. Environment Management
- Terraform workspaces for multiple environments:
  - Development
  - Staging
  - Production
- Environment-specific variable files
- Modular configuration structure

## Expected Deliverables

The Terraform configuration should be organized as follows:

- **Modular structure** with separate modules for:
  - SQS queues and policies
  - Monitoring and alerting
  - IAM roles and permissions
- **Main configuration** that orchestrates all modules
- **Data sources** to reference existing VPC infrastructure
- **Variable files** for each environment workspace