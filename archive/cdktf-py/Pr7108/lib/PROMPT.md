# Payment Processing Infrastructure

Hey there,

We need to build a payment processing infrastructure that works consistently across development, staging, and production environments. The business is pushing for a solution that handles payment transactions reliably while maintaining strict environment isolation and supporting our deployment pipeline. I've been asked to create this using CDKTF with Python.

Right now, we're processing payments manually and the business wants to automate this with proper infrastructure that can scale across different environments. The key challenge is ensuring consistency while maintaining flexibility for different deployment stages.

## What we need to build

Create a payment processing infrastructure using **CDKTF with Python** that maintains consistency across development, staging, and production environments.

### Core Requirements

1. **Payment Processing Pipeline**
   - Process payment transactions through multiple stages
   - Store transaction data with high availability
   - Track processing status and audit trails
   - Support batch and real-time payment processing

2. **Environment Consistency**
   - Infrastructure must deploy identically across dev, staging, and production
   - Environment-specific configuration through parameters
   - All resources must support multiple concurrent deployments

3. **Data Storage**
   - Persistent storage for payment transactions
   - Fast lookup by transaction ID and timestamp
   - Audit logging for compliance
   - Point-in-time recovery capabilities

4. **API Layer**
   - RESTful API for payment submission and status queries
   - Request validation and rate limiting
   - Proper error handling and responses
   - Integration with backend processing

5. **Event Processing**
   - Asynchronous processing of payment events
   - Dead letter queue for failed transactions
   - Notification system for payment status updates
   - Workflow orchestration for complex payment flows

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **DynamoDB** for transaction storage with GSI for timestamp queries
- Use **Lambda** functions for payment processing logic
- Use **API Gateway** for RESTful API endpoints
- Use **Step Functions** for payment workflow orchestration
- Use **SNS** for payment status notifications
- Use **SQS** with DLQ for reliable event processing
- Use **S3** for payment batch file storage
- Use **CloudWatch** for logging and monitoring
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-name-${environment_suffix}`
- All resources must be destroyable (use `force_destroy=True` for S3, no RETAIN policies)
- No deletion protection on any resources
- Lambda functions must use ZIP file deployment from separate directories
- Lambda runtime should be Python 3.12 or Node.js 20.x (avoid SDK v2 issues)
- DynamoDB GSI must use proper typed objects (`DynamodbTableGlobalSecondaryIndex`)
- All IAM roles must follow least privilege principle

### Constraints

- PCI DSS compliance considerations for payment data handling
- All data at rest must be encrypted
- All data in transit must use TLS/HTTPS
- Implement proper IAM roles with least privilege
- Include CloudWatch alarms for critical failures
- All resources must be destroyable for automated cleanup
- Must support parallel deployments with unique resource names
- Infrastructure must synthesize and deploy without manual intervention

## Success Criteria

- **Functionality**: Complete payment processing pipeline from submission to completion
- **Performance**: Sub-second API response times, asynchronous processing for heavy operations
- **Reliability**: DLQ for failed transactions, retries with exponential backoff
- **Security**: Encryption at rest and in transit, IAM least privilege, no hardcoded credentials
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Clean Python code, proper typing, well-structured modules
- **Deployability**: Single command deployment with no prerequisites

## What to deliver

- Complete CDKTF Python implementation in tap_stack.py
- Main entry point in tap.py with proper environment variable handling
- Lambda function code in separate lambda/ directories with ZIP deployment
- cdktf.json configuration for Python language
- Unit tests covering all infrastructure components
- Documentation with deployment and testing instructions
