Hey there,

We need to set up a secure database infrastructure for our e-commerce platform that handles customer payment information. This needs to be PCI DSS compliant, so security is critical here. I've been asked to implement this using **CDKTF with Python** for the eu-central-1 region.

The main concern from compliance is making sure all customer data is encrypted properly and that database credentials rotate automatically. We also need to use our own encryption keys rather than the AWS defaults.

## What we need

Build a secure RDS database setup using **CDKTF and Python** that meets PCI DSS requirements for our e-commerce platform.

### Core Requirements

1. **RDS Database**
   - PostgreSQL database for storing customer payment and personal information
   - Must be encrypted at rest using a custom KMS key
   - Enable automated backups with encryption
   - Configure for high availability but keep deployment time reasonable
   - Use managed master user password feature for automatic credential management

2. **Secrets Manager Integration**
   - Store database credentials in AWS Secrets Manager
   - Automatic rotation every 30 days
   - Use the managed rotation feature to avoid custom Lambda functions
   - Integration with the RDS instance for seamless credential updates

3. **KMS Encryption**
   - Create a custom KMS key for database encryption
   - Enable automatic key rotation
   - Proper key policies for RDS and Secrets Manager access
   - All data must be encrypted using this custom key

4. **Security Configuration**
   - Enable encryption in transit using SSL/TLS
   - Minimal IAM permissions following least privilege
   - Database should not be publicly accessible
   - Security group with restrictive access rules

5. **Compliance Requirements**
   - Must meet PCI DSS encryption requirements
   - Audit logging enabled for compliance tracking
   - Proper tagging for compliance reporting
   - Documentation of encryption methods

### Technical Details

- Use **CDKTF with Python** for all infrastructure code
- Deploy to **eu-central-1** region
- Resource names must include environment suffix for uniqueness
- Use AWS Secrets Manager managed rotation feature
- KMS key with automatic rotation enabled
- PostgreSQL engine for the RDS instance

### Constraints

- Database credentials must rotate every 30 days automatically
- All storage must use custom KMS keys, not default AWS keys
- Database must be encrypted at rest and in transit
- Secrets Manager should use managed rotation instead of custom Lambda
- Resources should be destroyable for testing environments
- No public accessibility for the database

## What to deliver

- Complete CDKTF Python implementation
- Custom KMS key with rotation enabled
- RDS PostgreSQL instance with encryption
- Secrets Manager secret with 30-day rotation
- VPC security group for database access
- All resources properly named with environment suffix
- Infrastructure that deploys within reasonable time