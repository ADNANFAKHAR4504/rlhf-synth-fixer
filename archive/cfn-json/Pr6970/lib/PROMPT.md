# AWS Loan Processing Migration Infrastructure

Hey team,

We've been tasked with building the AWS infrastructure for a financial services company that's migrating their legacy on-premises loan processing system to the cloud. Their current system processes about 50,000 transactions every day and has strict requirements around data retention and audit trails. Before they can start moving workloads, we need to replicate their production environment in AWS with all the necessary components.

The business has asked us to create this infrastructure using **CloudFormation with JSON**. This is a migration project, so reliability and compliance are critical. We need to make sure everything is audit-ready from day one, with proper encryption, logging, and access controls. The system needs to handle their transaction volume while meeting financial services regulatory requirements.

They're starting in us-east-1 and want the flexibility to deploy both development and production configurations from the same template. Development can be single-AZ to save costs, but production needs multi-AZ for high availability.

## What we need to build

Create a migration infrastructure using **CloudFormation with JSON** that establishes the target AWS environment for loan processing workloads.

### Core Requirements

1. **Database Infrastructure**
   - Deploy RDS Aurora MySQL cluster with one writer instance
   - Use encrypted storage with customer-managed KMS keys
   - Enable multi-AZ deployment conditionally based on environment type
   - Store database credentials in AWS Secrets Manager with automatic 30-day rotation

2. **Compute Layer**
   - Create Lambda function for loan validation logic
   - Configure with 1GB memory allocation
   - Set reserved concurrent executions to prevent throttling
   - Include CloudWatch Log Group with 90-day retention for compliance

3. **Storage**
   - Configure S3 bucket for loan document storage
   - Enable versioning on the bucket
   - Apply encryption and access controls appropriate for financial data

4. **Network Infrastructure**
   - Set up VPC spanning minimum 2 availability zones
   - Create public and private subnets in each AZ
   - Configure NAT Gateways for outbound connectivity from private subnets
   - Implement proper security groups and network ACLs

5. **Secrets and Credentials**
   - Implement AWS Secrets Manager for database credentials
   - Enable automatic rotation every 30 days
   - Ensure all application components can access secrets securely

6. **Logging and Monitoring**
   - Create CloudWatch Log Groups for all services
   - Set retention period to exactly 90 days for compliance requirements
   - Enable audit trails for all access and modifications

7. **Template Flexibility**
   - Use Parameters for environment type (dev/prod) and instance sizes
   - Apply Conditions to control multi-AZ deployment based on environment
   - Allow configuration of resource sizing through parameters

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **RDS Aurora MySQL** for transaction database
- Use **Lambda** for processing functions
- Use **S3** for document storage
- Use **Secrets Manager** for credential management
- Use **CloudWatch Logs** for audit trails
- Use **KMS** for encryption keys
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{purpose}-{environmentSuffix}
- All resources must be destroyable (no Retain deletion policies or deletion protection)

### Constraints

- All database passwords must be stored in AWS Secrets Manager with automatic rotation enabled
- The RDS instance must use encrypted storage with customer-managed KMS keys
- Lambda functions must have reserved concurrent executions set to prevent throttling
- All resources must be tagged with Environment, CostCenter, and MigrationPhase tags
- CloudWatch Logs must retain execution logs for exactly 90 days for compliance
- The stack must use Conditions to support both development and production configurations
- No retention policies or deletion protection (infrastructure must be fully destroyable)
- Include proper error handling and logging for all components

## Deployment Requirements (CRITICAL)

- All resource names MUST include the environmentSuffix parameter for uniqueness across deployments
- Use naming pattern: {resource-type}-{purpose}-{environmentSuffix}
- NO DeletionPolicy: Retain on any resources
- NO DeletionProtection: true on RDS clusters or instances
- All resources must be fully destroyable for testing and cleanup
- Database credentials rotation must be configured in Secrets Manager, not in RDS directly

## Success Criteria

- **Functionality**: Complete infrastructure ready to receive migrated applications and data
- **Compliance**: All audit logging configured with 90-day retention
- **Security**: Encrypted storage, secure credential management, proper network isolation
- **Flexibility**: Single template supports both dev (single-AZ) and prod (multi-AZ) deployments
- **Reliability**: Multi-AZ configuration for production workloads
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Well-structured JSON, properly parameterized, documented

## What to deliver

- Complete CloudFormation JSON template implementation
- Parameters section for environment configuration
- Conditions section for conditional resource deployment
- VPC with public and private subnets across multiple AZs
- RDS Aurora MySQL cluster with encryption and Secrets Manager integration
- Lambda function for loan validation with proper configuration
- S3 bucket with versioning enabled
- CloudWatch Log Groups with 90-day retention
- KMS keys for encryption
- Proper IAM roles and policies
- Resource tagging for all components
- Documentation explaining template parameters and deployment
