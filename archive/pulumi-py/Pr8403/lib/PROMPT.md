# Serverless E-Commerce Inventory Management System

You are an expert AWS Solutions Architect and a senior developer specializing in serverless applications and Infrastructure as Code (IaC). Your task is to design a complete, multi-environment serverless REST API using Pulumi and Python.

## Problem Statement

You are tasked with designing an IaC solution for a **production-grade serverless e-commerce inventory management system**. The application provides a comprehensive CRUD (Create, Read, Update, Delete) API for managing product inventory items with advanced features including automated inventory alerts, audit logging, and error handling.

**Business Context**: This system will handle inventory operations for an e-commerce platform that processes thousands of product updates daily across multiple environments.

The **complete end-to-end workflow** must be:

1. An HTTP request hits an **API Gateway** endpoint (e.g., `POST /items`, `GET /items/{itemId}`, `PUT /items/{itemId}`, `DELETE /items/{itemId}`).
2. The API Gateway triggers a **single AWS Lambda function** that routes requests based on the HTTP method and path.
3. The Lambda function executes the business logic by interacting with a **DynamoDB table** to perform inventory operations.
4. **Automatic inventory monitoring**: When inventory falls below threshold, trigger an **SNS notification**.
5. **Audit trail**: All operations are logged to a separate **DynamoDB audit table** for compliance.
6. Comprehensive logs and performance metrics are captured in **CloudWatch**.

## Constraints

- **Tool**: Pulumi
- **Language**: Python
- **Cloud Provider**: AWS
- **Primary Region**: `us-east-1`
- **Environments**: Must support `development`, `testing`, and `production` with different resource configurations
- **Naming Convention**: All resources must follow `inventory-{resource-type}-{environment}` pattern
- **Security Requirement**: All resources must use encryption at rest and least privilege IAM policies
- **Performance Requirement**: API must support 1000+ concurrent requests with sub-200ms response times

## Instructions

Carefully analyze the requirements in the problem statement and adhere to all constraints. The main goal is to create a production-ready, secure, and highly observable serverless inventory management system.

### 1. Core Infrastructure Requirements

Your **single `__main__.py` file** must implement:

#### 2.1 API Gateway Configuration

- REST API with proper CORS configuration
- Request/response validation and transformation
- API keys and throttling for production environment
- Custom domain support (using configuration)

#### 1.2 Lambda Function (Create exactly 1 function)

- `inventory_api_lambda`: Single function that handles all CRUD operations
  - Routes requests based on HTTP method (`POST`, `GET`, `PUT`, `DELETE`)
  - Handles `/items` and `/items/{itemId}` endpoints
  - Implements all business logic for create, read, update, delete operations
  - Includes error handling and request validation

#### 1.3 DynamoDB Tables (Create exactly 2 tables)

**Primary Table**: `inventory-items-{environment}` with:

- Partition Key: `itemId` (String)
- Sort Key: `version` (Number) for item versioning
- Attributes: itemId, version, name, description, quantity, price, category, lastUpdated, status
- Global Secondary Index: `category-index` for category-based queries

**Audit Table**: `inventory-audit-{environment}` with:

- Partition Key: `auditId` (String)
- Sort Key: `timestamp` (String)
- Attributes: auditId, timestamp, operation, itemId, userId, oldValue, newValue

#### 1.4 Basic Monitoring

- **SNS Topic**: `inventory-alerts-{environment}` for low inventory notifications
- **CloudWatch Logs**: Standard logging for the Lambda function

### 2. Multi-Environment Configuration Strategy

Use `pulumi.Config()` to manage environment-specific settings:

- `environment`: dev/test/prod (affects all resource naming)
- `dynamodb_billing_mode`: provisioned for prod, on-demand for dev/test
- `lambda_memory_size`: 128MB for dev, 512MB for prod
- `notification_email`: email for SNS alerts

### 3. Security & IAM Implementation (Least Privilege)

**Single IAM role for the Lambda function** with minimal required permissions:

- `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:Query` on items table
- `dynamodb:PutItem` on audit table for logging all operations
- `sns:Publish` on the inventory alerts topic for low inventory notifications
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` for CloudWatch logging
- **API Gateway execution role** with CloudWatch logging permissions
- **All resources encrypted** using AWS managed keys

### 4. Final Output

- Present the complete, production-ready Python code in a single code block
- Code must be fully functional and deployable with `pulumi up`

## Output Requirements

### Code Structure

- Code must be production-ready and deployable with `pulumi up` command
- Implement comprehensive error handling and logging throughout

### Required AWS Resources (Create exactly these)

- **1 API Gateway REST API** with complete CRUD endpoint configuration
- **1 Lambda Function** (handles all CRUD operations) with proper runtime configuration
- **2 DynamoDB Tables** (inventory items + audit trail) with specified schemas
- **1 SNS Topic** for inventory alerts with email subscription
- **1 IAM Role** for the Lambda function with least privilege policies

### Configuration Management

- Demonstrate use of `pulumi.Config()` for all environment-specific settings
- Show environment-based conditional logic (different memory sizes, billing modes)
- Resource naming must follow the specified `inventory-{resource-type}-{environment}` pattern

### Exports & Monitoring

- Export all critical resource identifiers using `pulumi.export()`
- Include API Gateway endpoint URL, DynamoDB table names, SNS topic ARN
- Export Lambda function name for testing and operations

### Documentation

- Comprehensive inline comments explaining architectural decisions
- Document IAM permissions and their business justification
- Explain multi-environment configuration strategy
- Include deployment instructions and testing guidance

### Validation Requirements

- Code must handle all specified CRUD operations correctly
- Implement proper HTTP status codes and error responses
- Include audit logging for all inventory operations
- Demonstrate basic inventory threshold monitoring with SNS notifications
