# Serverless RESTful API for Managing Data Entities

Create a comprehensive serverless RESTful API using AWS CloudFormation that supports full CRUD operations for managing simple data entities. The solution should be production-ready with best practices for security, networking, and observability.

## Core Requirements

### API Functionality
- Implement a RESTful API with the following endpoints:
  - `POST /items` - Create new data entities
  - `GET /items/{id}` - Retrieve specific data entity by ID
  - `PUT /items/{id}` - Update existing data entity
  - `DELETE /items/{id}` - Delete data entity
- Support JSON data format for request/response bodies
- Include proper HTTP status codes and error handling
- Implement CORS support for cross-origin requests

### Data Storage
- Use DynamoDB as the primary data store
- Design table schema with:
  - Primary key: `id` (String)
  - Support for flexible attributes for data entities
- Configure appropriate billing mode for cost optimization
- Enable point-in-time recovery for data protection

### Compute Layer
- Implement serverless functions using AWS Lambda
- Use Python 3.9+ runtime for function implementation
- Create separate functions for each CRUD operation
- Include proper error handling and logging
- Set appropriate timeouts and memory allocation

### Network Architecture
- Deploy Lambda functions within a VPC for security
- Create public and private subnets across availability zones
- Configure NAT Gateway for private subnet internet access
- Implement security groups with least privilege access
- Use private subnets for Lambda functions

### API Gateway Integration
- Create REST API using AWS API Gateway
- Configure proper resource paths and HTTP methods
- Implement AWS_PROXY integration with Lambda functions
- Add method-level security and request validation
- Enable CORS at the API Gateway level

### Security & IAM
- Create dedicated IAM roles for each Lambda function
- Implement least privilege permissions for DynamoDB access
- Use managed policies for VPC access when needed
- Ensure proper resource-level permissions

### Infrastructure Best Practices
- Use parameterization for environment-specific values
- Include comprehensive resource tagging
- Provide meaningful outputs for integration
- Ensure all resources are destroyable (no retention policies)
- Use CloudFormation intrinsic functions appropriately

## Technical Specifications

### Lambda Functions
- Runtime: Python 3.9+
- Handler: `index.lambda_handler`
- Memory: 256MB minimum
- Timeout: 30 seconds
- VPC Configuration: Deploy in private subnets

### DynamoDB Configuration
- Table name should include environment suffix
- Primary key: `id` (String type)
- Billing mode: ON_DEMAND preferred for flexibility
- Enable point-in-time recovery
- Include appropriate tags

### Network Configuration
- VPC CIDR: 10.0.0.0/16
- Public subnet CIDR: 10.0.1.0/24
- Private subnet CIDR: 10.0.2.0/24
- Enable DNS hostnames and DNS support
- Configure proper routing tables

### API Gateway Setup
- REST API type with regional endpoint
- Resource structure: `/items` and `/items/{id}`
- HTTP methods: POST, GET, PUT, DELETE, OPTIONS
- Enable CORS with appropriate headers
- Deploy to a named stage

## Expected Outputs
The CloudFormation template should provide the following outputs:
- API Gateway invoke URL for testing
- DynamoDB table name for reference
- VPC ID and subnet IDs for networking
- Security group IDs for troubleshooting

## Success Criteria
1. All CRUD operations work correctly through the API
2. Proper error handling for invalid requests
3. CORS headers are correctly configured
4. Lambda functions can access DynamoDB successfully
5. Resources are properly secured within VPC
6. Infrastructure can be deployed and destroyed cleanly
7. All resources follow AWS best practices for production use

The solution should be implementable as a single CloudFormation template that creates a complete, functional serverless API with proper networking, security, and data persistence.