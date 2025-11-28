Hey team,

We need to build a payment processing infrastructure for our business. The payment processing team needs reliable infrastructure to handle transaction processing. I've been asked to create this using Python with CDKTF (CDK for Terraform).

The current payment system processes thousands of transactions per hour and we need a solid foundation for our payment processing operations. This needs to work in a single AWS region with proper monitoring and alerting.

We're looking at a setup where all traffic is handled in a single region with proper monitoring, storage, and compute capabilities.

## What we need to build

Create a single-region payment processing infrastructure using **CDKTF with Python**.

### Core Requirements

1. **Single-Region Architecture**
   - Deploy infrastructure in AWS us-east-1 region
   - All resources deployed in a single region
   - Proper monitoring and alerting

2. **Data Persistence**
   - Set up DynamoDB table for payment transaction records
   - Configure S3 bucket for audit logs and receipts
   - Enable point-in-time recovery for data protection

3. **Compute Layer**
   - Deploy Lambda function for payment processing
   - Configure proper IAM roles and permissions
   - Set up CloudWatch logging

4. **Monitoring and Alerting**
   - Create CloudWatch alarms for Lambda errors
   - Set up SNS topic for notifications
   - Monitor DynamoDB throttling

5. **Security and Access Control**
   - Configure IAM roles with least privilege access
   - Enable encryption at rest for all data stores
   - Secure all resources with appropriate permissions

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **DynamoDB** for transaction records
- Use **S3** for audit logs
- Use **Lambda** for payment processing logic
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-environment-suffix
- Region: us-east-1

### Stack Configuration Requirements

The TapStack class must accept the following constructor parameters:
- `scope`: Construct - The CDKTF scope
- `ns`: str - Namespace/stack name
- `environment_suffix`: str - Environment suffix for resource naming
- `state_bucket`: str - S3 bucket name for Terraform state
- `state_bucket_region`: str - Region of the state bucket
- `aws_region`: str - AWS region for deployment (parameterized, not hardcoded)
- `default_tags`: dict - Default tags to apply to all resources

**CRITICAL**: No hardcoded region values. All regions must use the `aws_region` parameter.

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix parameter in their names
- All resources MUST be destroyable - use deletion_protection=False for databases
- NO resources with DeletionPolicy: Retain or similar retention policies
- All stacks must be fully removable without manual intervention
- Lambda functions should use Python 3.11 or 3.12 runtime
- Ensure all IAM roles have proper trust policies

### Constraints

- Payment data must be protected with point-in-time recovery
- System must have proper monitoring and alerting
- All resources must support complete teardown
- No manual cleanup steps should be required
- Follow AWS Well-Architected Framework for reliability

## Success Criteria

- **Functionality**: Infrastructure deploys successfully in us-east-1
- **Data Storage**: DynamoDB table stores transaction records
- **Monitoring**: CloudWatch alarms alert on errors
- **Resource Naming**: All resources include environmentSuffix in names
- **Destroyability**: Complete stack can be destroyed without errors
- **Code Quality**: Clean Python code, well-tested, fully documented
- **Security**: Proper IAM roles, encryption enabled

## What to deliver

- Complete CDKTF Python implementation
- DynamoDB table configuration
- S3 bucket for audit logs
- Lambda function for payment processing
- CloudWatch monitoring and alarms
- SNS notification setup
- Unit tests for all components
- Integration tests for deployed resources
- Documentation with deployment instructions
