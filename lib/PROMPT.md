# TAP Infrastructure CDK Stack

## Overview
This project implements a basic AWS CDK stack for the TAP (Test Automation Platform) infrastructure. It provides essential cloud resources including S3 storage, Lambda functions, and IAM roles with proper LocalStack compatibility.

## Architecture
- **S3 Bucket**: Secure storage for application data with encryption
- **Lambda Function**: Processing function with environment-specific configuration
- **IAM Role**: Service role for Lambda with appropriate permissions
- **LocalStack Support**: Conditional resource configuration for local development

## Key Features
- LocalStack compatibility for local development
- Environment-specific configuration
- Proper security configurations (encryption, public access blocking)
- Comprehensive unit tests with 80%+ coverage
- CI/CD pipeline integration

## Usage
The stack is designed to be deployed with environment suffixes for multi-environment support:
- Development: `TapStackdev`
- Production: `TapStackpr8530`

## LocalStack Considerations
- Simplified bucket naming for LocalStack compatibility
- Destroy removal policy for easy cleanup
- Environment variable detection for conditional configuration
