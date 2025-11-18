# Fraud Detection System

## Project Overview

This project builds a real-time fraud detection system for a financial services startup that processes credit card transactions. The system analyzes transaction patterns in real-time, flags suspicious activities, and notifies customers instantly when potential fraud is detected.

## Business Case

A financial services startup needs to build a real-time fraud detection system that processes credit card transactions. The system must analyze transaction patterns, flag suspicious activities, and notify customers instantly.

## Architecture Overview

The system uses a serverless architecture deployed in the `us-east-1` region with the following components:

### API Layer
- **API Gateway REST API** with `/transaction` POST endpoint
- Request validation and throttling (1000 requests per second per client)
- API key authentication for secure access
- AWS WAF protection against common web attacks

### Processing Components

#### Lambda Functions (Python 3.11 on ARM Architecture)
- **transaction-validator**: Validates incoming transaction data
- **fraud-analyzer**: Runs machine learning inference to detect fraud patterns
- **notification-sender**: Sends alerts to customers

#### Data Storage
- **DynamoDB Table** named 'transactions'
- Partition key: `transaction_id` (String)
- Sort key: `timestamp` (Number)
- On-demand billing with point-in-time recovery enabled

#### Workflow Orchestration
- **Step Functions** state machine coordinates the workflow: validate → analyze → store → notify
- Includes error handling and retry logic for each step
- Ensures reliable transaction processing

#### Event Processing
- **EventBridge** captures high-value transactions (over $5,000)
- Triggers additional review processes for large transactions

#### Notifications
- **SNS Topic** named 'fraud-alerts'
- Supports both email and SMS customer notifications
- Server-side encryption using customer-managed KMS keys

#### Security & Configuration
- **Parameter Store** stores sensitive configuration as SecureString parameters
- ML model endpoints and notification templates securely stored
- **IAM Roles** with least-privilege policies for each function

#### Monitoring & Logging
- **CloudWatch Log Groups** for all Lambda functions (7-day retention)
- **X-Ray Tracing** enabled on all Lambda functions and API Gateway
- Performance monitoring and alerting capabilities

## Technical Requirements

### Infrastructure Stack
- **Region**: us-east-1
- **Architecture**: Serverless (no VPC required)

### Performance Requirements
- **Response Time**: Sub-second processing for all transactions
- **Concurrency**: Reserved concurrency of 10 for predictable performance
- **Throughput**: 1000 requests per second per API client
- **Processor**: ARM-based Graviton2 for cost optimization

### Security Requirements
- **Encryption**: Customer-managed KMS keys for all data at rest
- **Access Control**: API key requirement and rate-based WAF rules
- **Configuration**: SecureString parameters for sensitive data
- **Monitoring**: Full distributed tracing capabilities

## Implementation Requirements

The system should be implemented as a complete CDKTF Python application that provisions all resources with:

### Resource Configuration Details
- Lambda functions with exactly 10 reserved concurrency units
- DynamoDB tables using on-demand billing mode with point-in-time recovery
- API Gateway throttling set to 1000 requests per second per client
- Step Functions with explicit error handling and retry logic for each state
- EventBridge rules filtering events based on transaction amounts over $5,000
- Lambda environment variables referencing Parameter Store SecureString values
- API Gateway with AWS WAF web ACL containing rate-based rules
