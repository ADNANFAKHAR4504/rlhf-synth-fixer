# Serverless Transaction Processing System

A complete serverless transaction processing system built with Pulumi and TypeScript, deployed on AWS.

## Architecture

The system consists of:
- **API Gateway REST API** with OpenAPI schema validation
- **Transaction Validator Lambda** for processing and storing transactions
- **DynamoDB Table** with streams for transaction storage
- **Fraud Detection Lambda** triggered by DynamoDB streams
- **SQS FIFO Queue** for maintaining transaction order
- **Notification Lambda** for sending alerts via SNS
- **KMS Key** for encrypting Lambda environment variables
- **Dead Letter Queues** for failed message handling
- **CloudWatch Log Groups** with 30-day retention

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI 3.x or later
- AWS CLI configured with appropriate credentials
- AWS account with permissions for Lambda, API Gateway, DynamoDB, SQS, SNS, KMS, IAM, CloudWatch

## Installation

1. Install dependencies: