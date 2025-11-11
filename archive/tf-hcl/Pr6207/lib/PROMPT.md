# Serverless Fraud Detection Pipeline

## Overview
This project implements a real-time fraud detection system for credit card transactions using AWS serverless technologies. The system is designed to handle varying transaction volumes efficiently, from low traffic periods (100 transactions/minute) to peak shopping periods (50,000 transactions/minute).

## Business Requirements
A fintech startup requires a robust system to process credit card transaction events in real-time for fraud detection purposes. The solution must be scalable, cost-effective, and capable of handling variable loads efficiently.

## System Architecture

### Core Components

#### API Gateway
- **REST API Endpoint**: `/transactions` (POST)
- **Input**: Accepts JSON transaction payloads
- **Validation**: Implements JSON schema validation for incoming requests
- **Purpose**: Serves as the entry point for transaction data

#### Transaction Processing Lambda
- **Runtime**: Python 3.11
- **Processor**: Graviton2 ARM for cost optimization
- **Function**: Validates incoming transactions and stores them in DynamoDB
- **Error Handling**: Dead letter queue with 3 retry attempts

#### Data Storage
- **DynamoDB Table**: Stores transaction records
  - Partition Key: `transaction_id`
  - Sort Key: `timestamp`
- **DynamoDB Streams**: Triggers fraud detection processing

#### Fraud Detection Pipeline
- **Stream Processing Lambda**: Monitors DynamoDB streams
- **Analysis**: Identifies suspicious transaction patterns
- **Output**: Routes flagged transactions to SQS for manual review

#### Queue Management
- **SQS Queue**: Handles suspicious transactions requiring manual review
- **Dead Letter Queues**: Configured for both Lambda functions with maximum 3 retry attempts

### Monitoring and Observability

#### CloudWatch Alarms
- **Error Rate Monitoring**: Triggers when Lambda error rate exceeds 1% over 5 minutes
- **Performance Tracking**: Monitors system health and performance metrics

#### Logging
- **CloudWatch Logs**: Centralized logging system
- **Retention Policy**: 7-day log retention for cost optimization

### Security and Access Control

#### IAM Configuration
- **Principle**: Least privilege access
- **Lambda Execution Roles**: Specific permissions for each function
- **Service Integration**: Secure communication between AWS services

## Deployment Configuration

### Region and Infrastructure
- **AWS Region**: us-east-1
- **Architecture**: Serverless (no VPC required)
- **Services**: Fully managed AWS services for high availability

### Expected Outputs
- API Gateway invoke URL for transaction submissions
- SQS queue URL for suspicious transaction processing

## Key Features
- **Scalability**: Automatic scaling based on demand
- **Cost Efficiency**: Pay-per-use serverless model
- **Reliability**: Built-in error handling and monitoring
- **Security**: Comprehensive IAM policies and request validation
- **Performance**: Optimized for both low and high traffic scenarios