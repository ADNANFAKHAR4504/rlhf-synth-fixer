Hi there,

I need some help building out infrastructure for our payment processing database system. We're working on a FinTech application that needs to be secure and compliant with PCI-DSS requirements. I'm using CDKTF with Python and deploying to ca-central-1.

The business is asking for a production-ready database setup that can handle financial transactions securely. They're really concerned about security and performance, so we need encryption everywhere and caching to keep things fast.

## What I need to build

Create a secure financial database infrastructure using CDKTF and Python that includes RDS with encryption, read replicas for scaling reads, AWS Secrets Manager for credential management, and ElastiCache for performance.

### Core Requirements

1. **RDS Database Setup**
   - PostgreSQL database with Multi-AZ deployment for high availability
   - Enable encryption at rest using AWS KMS with customer-managed keys
   - Set up at least one read replica to handle read-heavy workloads
   - Configure automated backups with 7-day retention
   - Enable Performance Insights for monitoring database performance
   - Use db.t3.medium instance type to keep deployment time reasonable

2. **Secrets Management**
   - Store all database credentials in AWS Secrets Manager
   - Enable automatic rotation for the master password
   - Set rotation schedule to 30 days
   - Use secrets for both master and application database credentials

3. **Caching Layer**
   - Deploy ElastiCache Serverless for Redis to improve read performance
   - Configure the cache to reduce database load for frequently accessed data
   - Set up proper security groups to allow only application access

4. **Network Security**
   - Create a VPC with public and private subnets across two availability zones
   - Place RDS instances in private subnets only
   - Configure security groups with least privilege access
   - Set up a bastion host or VPC endpoint for secure database access

5. **Encryption Requirements**
   - All data must be encrypted at rest using KMS
   - Enable encryption in transit for all database connections
   - Use customer-managed KMS keys for better control

6. **Resource Naming**
   - All resource names must include an environment suffix for uniqueness
   - Follow naming pattern: fintech-purpose-suffix
   - This helps us deploy multiple environments without conflicts

### Technical Requirements

- Use CDKTF with Python (not regular Terraform or CDK)
- Deploy to ca-central-1 region
- Use cdktf-aws-provider for AWS resources
- Make sure all resources can be destroyed easily for testing
- No DeletionProtection or Retain policies on resources

### Constraints

- Database credentials must never be hardcoded
- Enable Multi-AZ for RDS to meet compliance requirements
- KMS encryption is mandatory for all data at rest
- Resources must be tagged properly for cost allocation
- Follow AWS Well-Architected Framework security best practices

## Success Criteria

- RDS instance deployed with Multi-AZ and encryption enabled
- Read replica successfully created and syncing
- Secrets Manager storing credentials with rotation configured
- ElastiCache cluster deployed and accessible
- All resources properly networked in VPC with security groups
- KMS keys created and used for encryption
- Resource names include environment suffix
- Infrastructure can be deployed and destroyed cleanly

## Deliverables

Please provide the complete CDKTF Python code with:
- VPC configuration with subnets and routing
- Security groups for RDS and ElastiCache
- KMS key for encryption
- RDS instance with Multi-AZ and read replica
- AWS Secrets Manager secret with rotation
- ElastiCache Serverless cache
- All necessary IAM roles and policies
- Proper resource naming with suffix support

Make sure everything follows PCI-DSS compliance requirements and can be deployed to ca-central-1 without issues.
