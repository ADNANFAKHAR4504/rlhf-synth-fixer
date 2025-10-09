# AWS CloudFormation Serverless Infrastructure Design Prompt

## Objective
Design a complete serverless application infrastructure using AWS CloudFormation in YAML format. Create a comprehensive stack configuration that implements modern serverless architecture patterns while adhering to AWS security best practices and operational excellence principles.

## Core Requirements

### 1. Compute Layer
- Deploy an AWS Lambda function using the Node.js 14.x runtime
- Implement proper error handling and logging within the function code
- Configure appropriate timeout and memory settings for optimal performance
- Include sample function code that demonstrates basic serverless functionality

### 2. API Layer  
- Setup an Amazon API Gateway (HTTP API preferred) to trigger the Lambda function
- Configure AWS_PROXY integration between API Gateway and Lambda
- Implement proper routing with both specific routes and catch-all routes
- Ensure proper CORS configuration for web application compatibility

### 3. Storage Layer
- Create an Amazon S3 bucket with the following specifications:
  - Enable public read access for static content serving
  - Enable versioning for data protection and recovery
  - Apply appropriate bucket policies for security
- Define an Amazon DynamoDB table with:
  - A well-defined primary key structure
  - Pay-per-request billing mode for cost optimization
  - Appropriate attribute definitions

### 4. Security Framework
- Configure IAM roles implementing the principle of least privilege:
  - Lambda execution role with minimal necessary permissions
  - Specific permissions for DynamoDB operations (GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan)
  - Limited S3 access permissions for the specific bucket
  - KMS permissions for encryption/decryption operations
- Implement comprehensive encryption using AWS KMS:
  - Create a custom KMS key for the application
  - Encrypt all services that support encryption at rest
  - Configure proper key policies with appropriate access controls

### 5. Monitoring and Observability
- Integrate AWS CloudWatch for comprehensive monitoring:
  - Create dedicated log groups for Lambda functions
  - Configure log retention policies (14 days recommended)
  - Implement CloudWatch alarms for:
    - Lambda function errors
    - Lambda function duration/timeout warnings
    - Optionally, DynamoDB throttling and S3 request metrics
- Encrypt all logs using the custom KMS key

### 6. Infrastructure as Code Best Practices
- Use CloudFormation intrinsic functions extensively:
  - `!Ref` for parameter and resource references
  - `!GetAtt` for retrieving resource attributes
  - `!Sub` for string substitution and pseudo parameters
  - `!Join` for constructing complex strings and ARNs
- Implement comprehensive parameter-driven configuration:
  - Environment type parameter (Production, Development, Staging)
  - Resource naming parameters with default values
  - Optional configuration parameters for flexibility

### 7. Environment Configuration
- Define environment variables within the Lambda function:
  - Reference to DynamoDB table name
  - Reference to S3 bucket name
  - Environment type indicator
  - KMS key ID for encryption operations
- Use CloudFormation parameters to make the template reusable across environments

### 8. Resource Organization and Naming
- Apply consistent tagging strategy:
  - All resources must be tagged with 'Environment: Production'
  - Additional tags for cost allocation and resource management
- Implement standardized naming conventions:
  - Use 'Prod-' prefix for all resource names
  - Ensure names are descriptive and follow AWS naming best practices
  - Handle S3 bucket naming requirements (globally unique, lowercase)

### 9. Encryption and Data Protection
- Implement end-to-end encryption using AWS KMS:
  - Custom KMS key with appropriate key policies
  - Encrypt Lambda environment variables
  - Enable S3 bucket encryption with KMS
  - Configure DynamoDB encryption at rest
  - Encrypt CloudWatch logs
- Configure proper key rotation policies and access controls

### 10. Output and Integration
- Define comprehensive CloudFormation outputs for cross-stack references:
  - API Gateway endpoint URL (fully constructed and accessible)
  - S3 bucket name for application integration
  - Lambda function ARN for potential cross-stack invocations
  - DynamoDB table name for application configuration
  - KMS key ID for external encryption operations
- Make all outputs exportable using CloudFormation's export functionality

## Technical Constraints

### Regional Considerations
- Design for deployment in standard AWS regions (us-east-1, us-west-2, eu-west-1)
- Handle region-specific resource naming and ARN construction
- Consider cross-region replication requirements if applicable

### Performance and Scalability
- Configure DynamoDB for auto-scaling capabilities
- Implement appropriate Lambda concurrency controls
- Design API Gateway for high-throughput scenarios
- Consider CloudFront integration for S3 static content delivery

### Security Controls
- Implement resource-based policies where applicable
- Configure VPC endpoints if required for enhanced security
- Apply security groups and NACLs for network-level protection
- Implement proper secret management practices

### Operational Excellence
- Include comprehensive CloudWatch dashboard configuration
- Implement proper backup and disaster recovery strategies
- Configure automated deployment and rollback capabilities
- Include cost optimization features (lifecycle policies, reserved capacity)

## Validation Requirements

The resulting CloudFormation template must:
1. Pass AWS CloudFormation template validation
2. Successfully deploy in a clean AWS account
3. Create all specified resources with proper configurations
4. Demonstrate functional integration between all components
5. Include comprehensive error handling and rollback capabilities

## Expected Deliverable Format

Provide a single, well-documented YAML CloudFormation template that:
- Contains detailed comments explaining each resource and configuration
- Uses consistent formatting and indentation
- Includes parameter descriptions and constraints
- Provides comprehensive output descriptions
- Follows CloudFormation best practices and AWS Well-Architected principles

The template should be production-ready and suitable for immediate deployment in an enterprise AWS environment, serving as a foundation for serverless application development.