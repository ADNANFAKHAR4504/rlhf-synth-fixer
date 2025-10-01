# Serverless Backend for Mobile App User Profile Management

This solution provides a fully serverless backend infrastructure for managing user profiles in a mobile application. The architecture leverages AWS CloudFormation to deploy a comprehensive REST API with Lambda functions, DynamoDB storage, and comprehensive monitoring capabilities.

## Architecture Overview

The infrastructure includes:

- **API Gateway (REST API)** as the entry point with CORS support
- **Lambda Functions** (Python 3.9) for CRUD operations
- **DynamoDB** with auto-scaling and Global Secondary Indexes
- **IAM Roles and Policies** for secure component access
- **CloudWatch** for logging, monitoring, and alerting
- **Systems Manager Parameter Store** for configuration management

## Core Components

### API Gateway REST API
- Regional endpoint configuration for optimal performance
- Complete CRUD endpoints: GET, POST, PUT, DELETE
- CORS support for cross-origin requests
- Request validation and path parameters
- Integration with Lambda functions using AWS_PROXY

### Lambda Functions
Five specialized functions handle different operations:

1. **CreateUserFunction** - Creates new user profiles with validation
2. **GetUserFunction** - Retrieves individual user profiles
3. **UpdateUserFunction** - Updates existing user profiles
4. **DeleteUserFunction** - Removes user profiles
5. **ListUsersFunction** - Lists users with pagination support

All functions include:
- Error handling and validation
- CloudWatch logging integration
- X-Ray tracing for performance monitoring
- Environment variable configuration

### DynamoDB Table
- **Primary Key**: `userId` (Hash key)
- **Global Secondary Indexes**:
  - EmailIndex: Query by email address
  - CreatedAtIndex: Query by creation date
- **Auto-scaling**: Read/Write capacity scaling (2-20 units)
- **Features**: Point-in-time recovery, server-side encryption
- **Provisioned throughput** with automatic scaling policies

### Security & Access Control
- **Lambda Execution Role** with minimal required permissions
- **DynamoDB Access Policy** restricted to table operations
- **SSM Parameter Access** limited to environment-specific paths
- **API Gateway Account Role** for CloudWatch logging

### Monitoring & Observability
- **CloudWatch Log Groups** with configurable retention
- **CloudWatch Alarms** for:
  - DynamoDB throttling detection
  - Lambda function errors
  - API Gateway 4XX/5XX error rates
- **CloudWatch Dashboard** with key metrics visualization
- **X-Ray Tracing** enabled across all Lambda functions

### Configuration Management
SSM Parameter Store holds:
- DynamoDB table name
- API Gateway endpoint URL  
- Environment configuration

## Key Features

### Cost Optimization
- Provisioned capacity with auto-scaling (starts at minimum 1 unit)
- CloudWatch log retention policies
- Regional API Gateway deployment
- Efficient DynamoDB query patterns with GSIs

### Security
- IAM roles with least-privilege access
- DynamoDB server-side encryption
- API Gateway with proper CORS configuration
- CloudWatch logs for audit trails

### Scalability
- Auto-scaling DynamoDB capacity (2-20 units)
- API Gateway throttling limits (1000 requests/sec, 2000 burst)
- Lambda concurrent execution limits
- Pagination support for list operations

### Fast Deployment
- Single CloudFormation template
- Environment-specific naming with suffix support
- Resource dependencies properly configured
- Comprehensive outputs for integration

## API Endpoints

- `POST /users` - Create new user profile
- `GET /users` - List all users (with pagination)
- `GET /users/{userId}` - Get specific user profile  
- `PUT /users/{userId}` - Update user profile
- `DELETE /users/{userId}` - Delete user profile
- `OPTIONS /*` - CORS preflight support

## Environment Configuration

The template uses the `EnvironmentSuffix` parameter to create environment-specific resources, enabling multiple deployments (dev, staging, prod) without conflicts.

## Outputs

The stack exports key values for integration:
- API Gateway endpoint URL
- DynamoDB table name and ARN
- Lambda function ARNs
- Environment configuration

This solution provides a production-ready, scalable, and secure foundation for mobile app user profile management with comprehensive monitoring and cost optimization features.