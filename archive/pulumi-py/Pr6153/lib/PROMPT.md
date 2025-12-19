# Multi-Environment Payment Processing Infrastructure

Hey team,

We've got a fintech startup that's building a payment processing system and they're running into serious issues with configuration drift between their dev, staging, and production environments. Every time they try to promote changes, something breaks because the environments aren't quite identical. They need us to build infrastructure that can be consistently replicated across all three environments while still allowing for environment-specific configurations like capacity settings and redundancy levels.

The business wants a rock-solid foundation where they can confidently deploy the same code to development first, verify it in staging, and then roll to production knowing the infrastructure is identical. Right now they're manually managing three separate infrastructure definitions and it's causing all sorts of headaches with misconfigured security groups, inconsistent tagging, and database settings that don't match.

I've been asked to create this using **Pulumi with Python** because the team is already comfortable with Python and they like Pulumi's ability to use real programming constructs for infrastructure. The key is building reusable components that work identically across all environments while pulling configuration from environment-specific files.

## What we need to build

Create a payment processing infrastructure system using **Pulumi with Python** that can be deployed identically to development, staging, and production environments with environment-specific configuration.

### Core Infrastructure Requirements

1. **Component-Based Architecture**
   - Define a base ComponentResource class that encapsulates the complete infrastructure stack
   - Make the component reusable across all three environments
   - Use Pulumi's ComponentResource pattern for clean abstraction

2. **Environment Configuration**
   - Create environment-specific configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
   - Store environment-appropriate capacity settings, CIDR ranges, and deployment parameters
   - Use Pulumi configuration for all environment-specific values

3. **Network Infrastructure**
   - Deploy isolated VPCs with non-overlapping CIDR ranges for each environment
   - Dev environment: 10.0.0.0/16 in us-east-1
   - Staging environment: 10.1.0.0/16 in us-east-2
   - Production environment: 10.2.0.0/16 in eu-west-1
   - Create public subnets for NAT gateways and private subnets across 2 availability zones
   - Set up Internet Gateways and NAT Gateways for outbound connectivity

4. **API and Compute Layer**
   - Set up API Gateway REST API for payment processing endpoints
   - Deploy Lambda functions with Python 3.11 runtime for payment processing logic
   - Integrate API Gateway with Lambda functions
   - Configure proper IAM roles and policies for Lambda execution

5. **Data Storage**
   - Configure DynamoDB tables for transaction storage with point-in-time recovery enabled
   - Set environment-appropriate read/write capacity settings
   - Deploy RDS PostgreSQL instances for customer data
   - Use Multi-AZ deployment for RDS only in production environment
   - Configure proper security groups and subnet groups

6. **Audit and Logging**
   - Create S3 buckets for audit logs with versioning and encryption enabled
   - Implement lifecycle policies that vary by environment (longer retention in production)
   - Set up CloudWatch log groups for Lambda and API Gateway
   - Configure CloudWatch metrics for monitoring

7. **Secrets Management**
   - Store all sensitive configuration values in AWS Systems Manager Parameter Store
   - Reference parameters securely in infrastructure code
   - Never hardcode credentials or sensitive values

8. **Tagging and Organization**
   - Implement consistent tagging strategy across all resources
   - Include environment name, cost center, and deployment timestamp in tags
   - Use tags for cost allocation and resource organization

9. **Cross-Stack Integration**
   - Use stack outputs to expose critical endpoints and resource ARNs
   - Enable cross-stack references for future integrations
   - Export VPC IDs, subnet IDs, security group IDs, and endpoint URLs

10. **Stack References**
    - Implement Pulumi stack references for cross-stack dependencies where needed
    - Design for future cross-stack integration scenarios

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation with distinct CIDR ranges per environment
- Use **EC2** resources (NAT Gateway, Internet Gateway) for networking
- Use **API Gateway** for REST API endpoints
- Use **Lambda** with Python 3.11 runtime for serverless compute
- Use **DynamoDB** with point-in-time recovery for transaction storage
- Use **RDS** PostgreSQL with Multi-AZ for production customer data
- Use **S3** with versioning and encryption for audit logs
- Use **Systems Manager Parameter Store** for secrets management
- Use **IAM** roles and policies for secure access control
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** parameter for uniqueness across environments
- Follow naming convention: `{resource-type}-{environment}-suffix` or similar pattern
- Deploy to region based on environment: us-east-1 (dev), us-east-2 (staging), eu-west-1 (prod)
- Requires Pulumi 3.x with Python 3.9 or higher
- AWS CLI configured with appropriate credentials for target environment

### Constraints

- Use Pulumi configuration files to manage environment-specific values
- Implement stack references for cross-stack dependencies
- All Lambda functions must use Python 3.11 runtime
- DynamoDB tables must have point-in-time recovery enabled
- Use AWS Systems Manager Parameter Store for secrets management
- Implement automated tagging strategy with environment and cost center tags
- VPC CIDR blocks must not overlap between environments
- RDS instances in production must use Multi-AZ deployment
- All S3 buckets must have versioning and encryption enabled
- Use Pulumi's ComponentResource pattern for reusable infrastructure modules
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation in Python code
- All infrastructure code must be properly typed with Python type hints where appropriate

## Success Criteria

- **Functionality**: Infrastructure deploys successfully to all three environments with identical code
- **Consistency**: Same infrastructure components across dev, staging, and production
- **Configuration**: Environment-specific settings properly managed through Pulumi config files
- **Network Isolation**: Non-overlapping VPC CIDR ranges with proper subnet configuration
- **Security**: Secrets in Parameter Store, encryption enabled, proper IAM policies
- **Reliability**: Multi-AZ RDS in production, point-in-time recovery for DynamoDB
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Observability**: CloudWatch logging and metrics properly configured
- **Code Quality**: Clean Python code with type hints, well-structured ComponentResource
- **Destroyability**: All resources can be cleanly destroyed with pulumi destroy

## What to deliver

- Complete Pulumi Python implementation with ComponentResource pattern
- Environment-specific configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
- VPC with Internet Gateway, NAT Gateway, public and private subnets
- API Gateway REST API integrated with Lambda functions
- Lambda functions with Python 3.11 runtime and proper IAM roles
- DynamoDB tables with point-in-time recovery enabled
- RDS PostgreSQL instances with Multi-AZ in production
- S3 buckets with versioning, encryption, and lifecycle policies
- Systems Manager Parameter Store integration for secrets
- Comprehensive tagging strategy implementation
- Stack outputs for cross-stack references
- CloudWatch log groups and metrics
- Documentation including deployment instructions and environment setup
