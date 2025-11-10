Hey team,

We're working on a REST API infrastructure migration project for a fintech startup. They've built their backend in the development environment and now need to migrate it to production. The production setup requires enhanced monitoring, stricter security controls, and different capacity configurations while keeping the same API structure. We need to create infrastructure that handles both environments with appropriate settings for each.

The key challenge here is managing environment-specific configurations without duplicating code. Development needs to be cost-effective and flexible for rapid iteration, while production requires robust monitoring, higher capacity, and stronger security. We're looking at differences in DynamoDB billing modes, Lambda memory allocations, API Gateway throttling limits, and CloudWatch alarm configurations.

This project needs to be implemented using **CDKTF with TypeScript** to manage the multi-environment setup. The infrastructure will deploy to the ap-southeast-1 region and handle environment switching through CDK context parameters.

## What we need to build

Create a REST API infrastructure using **CDKTF with TypeScript** that supports both development and production environments with different configurations for each.

### Core Requirements

1. **DynamoDB Configuration**
   - Development: On-demand billing mode for cost efficiency
   - Production: Provisioned capacity with 5 read capacity units and 5 write capacity units
   - Table names must include environmentSuffix for uniqueness
   - Enable encryption at rest with default KMS key

2. **API Gateway Setup**
   - Deploy REST API with edge-optimized endpoint configuration
   - Use the same OpenAPI specification for both environments
   - Stage variables for environment-specific configurations
   - Access logging enabled in production only
   - API key authentication required for production environment only

3. **Lambda Functions**
   - Node.js 18 runtime for all functions
   - Memory allocation: 512MB in development, 1024MB in production
   - All functions share a common IAM role per environment
   - Environment variables must be encrypted with default KMS key
   - Concurrent execution limits: 10 for development, 100 for production

4. **API Gateway Throttling**
   - Development: 100 requests per second
   - Production: 1000 requests per second
   - Apply throttling at the stage level

5. **CloudWatch Monitoring**
   - Development: CloudWatch log retention of 7 days
   - Production: CloudWatch log retention of 30 days
   - Production: Create alarm for API 4XX error rate exceeding 10 percent threshold
   - Development: No CloudWatch alarms needed

6. **Resource Tagging**
   - Use CDK Aspects to enforce tagging across all resources
   - Required tags: Environment and Project
   - Tags enable cost allocation and tracking

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **DynamoDB** tables for data storage
- Use **API Gateway REST API** with edge-optimized endpoints
- Use **Lambda** functions with Node.js 18 runtime
- Use **CloudWatch** for logs, metrics, and alarms (production)
- Use **IAM** roles and policies with least privilege access
- Deploy to **ap-southeast-1** region
- Environment parameter passed through CDK context
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable with no Retain policies
- Enable encryption for Lambda environment variables
- Implement proper error handling and logging

### Constraints

- Stack names must follow pattern: project-service-environment
- Lambda functions must share a common IAM role per environment
- DynamoDB table names must include environment suffix
- API Gateway must use the same OpenAPI specification for both environments
- CloudWatch log retention: 7 days for dev, 30 days for prod
- Use CDK Aspects to enforce tagging across all resources
- Lambda environment variables encrypted with default KMS key
- No retention policies that prevent resource deletion
- All Lambda functions use Node.js 18 runtime

## Success Criteria

- Functionality: Infrastructure deploys successfully in both dev and prod contexts with appropriate environment-specific settings
- Performance: API Gateway throttling and Lambda memory configured correctly per environment
- Reliability: Proper error handling, logging, and CloudWatch alarms in production
- Security: IAM least privilege, encryption at rest and for environment variables, API keys in production
- Resource Naming: All resources include environmentSuffix for uniqueness and isolation
- Code Quality: TypeScript code, well-tested with unit tests, clear documentation
- Destroyability: All resources can be destroyed after testing with no manual cleanup required
- Cost Optimization: Development environment uses on-demand billing and lower capacities

## What to deliver

- Complete CDKTF TypeScript implementation in lib/ directory
- DynamoDB table with environment-specific billing configuration
- API Gateway REST API with edge-optimized endpoint
- Lambda functions with proper IAM roles and environment-specific settings
- CloudWatch logs with retention policies and production alarms
- API key authentication for production environment
- CDK Aspects for automated resource tagging
- Unit tests for all infrastructure components
- Documentation and deployment instructions in README
