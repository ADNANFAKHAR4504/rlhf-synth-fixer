# Serverless Document Processing System - AWS CDK TypeScript

You are an expert AWS Solutions Architect specializing in serverless architectures and Infrastructure as Code (IaC). Your task is to design and implement a serverless document processing system using AWS CDK with TypeScript.

## Real-World Scenario: Document Processing Platform

**Business Context**: A company needs a serverless document processing system to handle customer documents. The system must:

- Accept document uploads through a secure API
- Process documents automatically (extract metadata, validate format)
- Store processed documents with audit trails
- Provide API access for authorized applications with API keys

## Problem Statement

Deploy a serverless document processing infrastructure in AWS using CDK TypeScript that demonstrates event-driven architecture and serverless best practices. The solution must integrate AWS S3, DynamoDB, and Lambda services with proper security controls and VPC endpoints for secure service communication.

## Environment Context

- **Framework**: AWS CDK with TypeScript
- **Deployment Region**: us-east-1 (single region)
- **Architecture Pattern**: Event-driven serverless architecture
- **Security Approach**: Least privilege IAM with basic encryption
- **Naming Convention**: Use prefix 'prod' for resource naming

## Core Serverless Infrastructure

### 1. **Storage Services**

- **Amazon S3 Bucket**: Document storage with server-side encryption
- **Amazon DynamoDB Table**: Document metadata with DynamoDB Streams enabled

### 2. **Compute Services**

- **AWS Lambda Functions** (minimum 2):
  - **Document Processor**: Triggered by S3 events, processes documents
  - **API Handler**: Handles API Gateway requests for document operations
  - Runtime: Node.js (latest supported version)
  - Environment variables for configuration

### 3. **API Layer**

- **Amazon API Gateway**: RESTful endpoints with Lambda integration
- **API Keys**: For client authentication
- **Lambda Authorizer**: Custom authorization logic validating API keys
- **Request validation**: Input validation and rate limiting

### 4. **Serverless Networking**

- **VPC Configuration**: Private subnets for Lambda functions
- **VPC Endpoints**: For secure AWS service communication:
  - S3 VPC Endpoint (Gateway type)
  - DynamoDB VPC Endpoint (Gateway type) 
  - API Gateway VPC Endpoint (Interface type)
- **Security Groups**: Minimal required access for Lambda functions

## Security & Best Practices

### 1. **IAM Least Privilege**

- **Lambda Execution Roles**: Separate roles per function with minimal permissions
- **S3 Policies**: Bucket-specific read/write access only
- **DynamoDB Policies**: Table-specific operations only
- **API Gateway**: Execution role for Lambda authorizer

### 2. **Basic Encryption**

- **S3**: Server-side encryption (AES-256 or KMS)
- **DynamoDB**: Encryption at rest enabled
- **API Gateway**: HTTPS endpoints only
- **Lambda**: Environment variables encryption

## Event-Driven Workflow

### 1. **Document Upload Flow**

- **API Gateway** → **Lambda Authorizer** (validates API key)
- **API Handler Lambda** → **S3** (stores document)
- **S3 Event** → **Document Processor Lambda** (triggers processing)

### 2. **Processing Flow**

- **Document Processor** extracts metadata and validates format
- **DynamoDB** stores document metadata and status
- **DynamoDB Streams** → **Notification Lambda** (status updates)

## Serverless Best Practices

### 1. **Performance & Monitoring**

- **CloudWatch Logs**: Centralized logging for all Lambda functions
- **CloudWatch Alarms**: Monitor Lambda errors and DynamoDB throttling
- **Dead Letter Queues**: Handle failed Lambda executions

### 2. **Cost Optimization**

- **DynamoDB On-Demand**: Pay-per-request billing
- **S3 Lifecycle Policies**: Automated cost optimization
- **Lambda Memory Optimization**: Right-sized memory allocation

## Latest AWS Features (Select up to 2)

- **Lambda Powertools**: Enhanced observability and best practices
- **DynamoDB Global Secondary Indexes**: Optimized query patterns
- **S3 Event Bridge Integration**: Advanced event routing
- **API Gateway HTTP APIs**: Lower latency and cost

## Expected Deliverables

### 1. **CDK Stack Structure**

- **Main Stack**: `tap-stack.ts` with all serverless resources
- **Modular Organization**: Separate constructs for storage, compute, and API layers
- **Environment Support**: dev/staging/prod configurations

### 2. **Lambda Functions**

- **Document Processor**: Handles S3 events and processes documents
- **API Handler**: Manages document upload/retrieval operations
- **Lambda Authorizer**: Validates API keys and permissions
- **Error Handling**: Try-catch blocks and CloudWatch logging

### 3. **Infrastructure Components**

- **VPC with Private Subnets**: For Lambda function deployment
- **VPC Endpoints**: S3, DynamoDB, and API Gateway endpoints
- **IAM Roles**: Least privilege permissions for each Lambda
- **Security Groups**: Minimal required access rules

## Success Criteria

The solution must demonstrate:

1. ** **Complete CDK TypeScript implementation** with proper imports and stack structure
2. ** **Secure API Gateway with Lambda authorizers** validating API keys and permissions
3. ** **Event-driven document processing** connecting S3, Lambda, and DynamoDB
4. ** **Enterprise-grade security** with strictest least privilege IAM and complete encryption
5. ** **KMS encryption at rest** for S3, DynamoDB, Lambda, and CloudWatch Logs
6. ** **HTTPS/TLS encryption in transit** for all service communications
7. ** **Comprehensive audit logging** with CloudTrail, CloudWatch, and access monitoring
8. ** **Error handling and resilience** with DLQ and retry mechanisms
9. ** **Security monitoring** with CloudWatch alarms for unauthorized access attempts
10. ** **Financial services compliance** with complete traceability and data protection

## Critical Implementation Requirements

### **API Gateway + Lambda Authorizer Configuration**

- Create API Gateway with usage plans and API keys
- Implement Lambda authorizer that:
  - Validates API key against DynamoDB permissions table
  - Returns IAM policy allowing/denying specific API operations
  - Logs all authorization attempts to CloudWatch
- Configure different permission levels (read-only, read-write, admin)

## Implementation Focus Areas

### **Serverless Architecture Patterns**

- Event-driven design with S3 events triggering Lambda processing
- API Gateway integration with Lambda authorizers for secure access
- DynamoDB Streams for real-time data processing workflows
- VPC endpoints for secure AWS service communication

### **API Security Configuration**

- API Gateway with usage plans and API keys
- Lambda authorizer validating API keys against DynamoDB
- Rate limiting and request validation
- CloudWatch logging for API access monitoring

### **VPC Endpoint Integration**

- **S3 VPC Endpoint**: Gateway endpoint for S3 access
- **DynamoDB VPC Endpoint**: Gateway endpoint for DynamoDB access  
- **API Gateway VPC Endpoint**: Interface endpoint for private API access
- **Lambda in Private Subnets**: All functions deployed in private subnets

## Constraints and Guidelines

- **Serverless-first approach**: Focus on managed services and event-driven patterns
- **Single region**: us-east-1 deployment only
- **Core services**: S3, DynamoDB, Lambda, API Gateway with VPC endpoints
- **Least privilege IAM**: Specific permissions without wildcards
- **Cost optimization**: On-demand billing and right-sized resources
- **Well documented**: Clear comments explaining serverless patterns
- **Testing ready**: CDK synthesis and basic deployment validation

This infrastructure must be deployable using standard CDK commands (`cdk synth`, `cdk deploy`) and demonstrate serverless best practices with secure service communication.
