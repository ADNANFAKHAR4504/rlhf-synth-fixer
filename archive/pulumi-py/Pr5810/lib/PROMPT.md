Hey team,

We need to build a multi-environment payment processing infrastructure for our fintech startup. The business wants identical infrastructure deployed across dev, staging, and production environments, but with different configurations for each environment based on workload requirements and cost optimization.

The challenge we're facing is maintaining consistency across environments while allowing for environment-specific configurations like database sizes, instance types, and scaling parameters. We need automated deployment pipelines that can target any environment using simple commands like 'pulumi up -s <environment>'.

Our payment processing system needs to handle transactions reliably across different environments, with production requiring high availability and performance, staging needing moderate resources for testing, and development optimized for cost efficiency. The infrastructure needs to support our payment processing workflows with proper security, compliance, and monitoring in place.

## What we need to build

Create a multi-environment payment processing infrastructure using **Pulumi with Python** that deploys identical stack architecture across three environments with environment-specific configurations.

### Core Requirements

1. **Reusable Infrastructure Component**
   - Define a reusable component that creates a complete environment stack
   - Include VPC, RDS Aurora cluster, Lambda functions, DynamoDB tables, and S3 buckets
   - Use Pulumi configuration files to specify environment-specific values

2. **Multi-Environment VPC Architecture**
   - Create three separate VPCs with identical structure but different CIDR blocks
   - Production: 10.0.0.0/16, Staging: 10.1.0.0/16, Development: 10.2.0.0/16  
   - Each VPC with 3 availability zones containing public and private subnets
   - NAT gateways for production/staging, NAT instances for development (cost optimization)

3. **Database Layer - RDS Aurora PostgreSQL**
   - Production: 2 instances with r5.xlarge, 30-day backup retention
   - Staging: 1 instance with r5.large, 7-day backup retention  
   - Development: 1 instance with t3.medium, 1-day backup retention
   - All with automated backups enabled

4. **Serverless Processing - Lambda Functions**
   - Payment processing functions with environment-specific memory allocation
   - Production: 3008MB memory, Staging: 1024MB, Development: 512MB
   - Functions must reference environment-specific API endpoints

5. **Data Storage - DynamoDB Tables**
   - Transaction logs with environment-specific billing modes
   - Development: on-demand billing
   - Staging: provisioned capacity (5 RCU/WCU)
   - Production: auto-scaling (5-100 RCU/WCU)
   - Point-in-time recovery enabled only in production

6. **File Storage - S3 Buckets**
   - Audit trail storage with versioning enabled for all environments
   - Production: lifecycle policies (transition to Glacier after 90 days)
   - Follow naming convention: company-service-environment-purpose
   - Proper access controls and encryption

7. **Monitoring and Alerting**
   - CloudWatch alarms for RDS CPU utilization
   - Production: 80% threshold, Staging: 90% threshold, Development: no alarms
   - Environment-specific alarm configurations

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation and security
- Use **RDS Aurora PostgreSQL** for transactional data storage
- Use **Lambda** functions for payment processing logic
- Use **DynamoDB** for transaction logs and high-speed data access
- Use **S3** for audit trails and file storage
- Use **CloudWatch** for monitoring and alerting
- Use **IAM** for security and access control
- Use **NAT Gateway/NAT Instances** for outbound connectivity
- Use **Security Groups** for network-level security
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region with multi-AZ setup

### Constraints

- Must use Pulumi.yaml configuration files to manage environment-specific values
- RDS instances must have automated backups with varying retention periods
- All environments must use separate VPCs with identical CIDR block structures  
- Security groups must be dynamically generated based on environment tags
- IAM roles must be scoped to prevent cross-environment access
- All resources must be tagged with Environment, Team, and CostCenter tags
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Multi-Environment Deployment**: Identical infrastructure across dev/staging/prod with environment-specific configurations
- **Cost Optimization**: Different instance sizes and billing modes per environment
- **Security**: Proper IAM roles, security groups, and network isolation
- **Monitoring**: Environment-specific CloudWatch alarms and thresholds
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Configuration Management**: Pulumi configuration files for environment-specific values
- **Code Quality**: Clean Python code, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation with main __main__.py file
- Reusable infrastructure component handling all AWS services
- Three Pulumi.<environment>.yaml configuration files with environment-specific values
- VPC, RDS Aurora PostgreSQL, Lambda, DynamoDB, S3, CloudWatch, IAM, NAT, Security Groups implementation
- Stack outputs for RDS endpoint, Lambda function ARNs, and S3 bucket names
- Documentation explaining how to deploy to each environment using 'pulumi up -s <environment>'