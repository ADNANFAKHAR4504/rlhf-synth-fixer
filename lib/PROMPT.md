Hey team,

We need to build a PCI-DSS compliant database infrastructure for FinTech Corp's credit card transaction processing system. I've been asked to create this in **CloudFormation with YAML** for their EU operations in Frankfurt. The business is expanding their payment processing capabilities and requires a secure, compliant database setup that meets strict financial industry standards.

The security team has emphasized that this needs to handle sensitive credit card transaction data, so encryption everywhere is a must. They also want proper credential rotation and audit trails. The system needs to be resilient with multi-AZ setup and should handle session management efficiently for their payment gateway.

## What we need to build

Create a PCI-DSS compliant database infrastructure using **CloudFormation with YAML** for a financial services transaction processing system.

### Core Requirements

1. **Database Layer**
   - Multi-AZ RDS MySQL instance with encryption enabled
   - Storage encryption at rest
   - Backup retention of minimum 7 days
   - Automated backups enabled

2. **Secrets Management**
   - SecretsManager for database credential storage
   - Automatic credential rotation every 30 days
   - Secure credential retrieval for applications

3. **Session Management**
   - ElastiCache Redis cluster for session handling
   - Encryption-in-transit enabled
   - Private subnet deployment only

4. **Network Security**
   - Proper VPC configuration with public and private subnets
   - Security groups with least privilege access
   - No direct internet access to database resources

5. **Compliance Tracking**
   - Tags for PCI-DSS compliance tracking
   - Resource identification for audit purposes

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **RDS MySQL** for transaction database with Multi-AZ deployment
- Use **SecretsManager** for credential management with rotation
- Use **ElastiCache Redis** for session management
- Use **VPC** with proper subnet segmentation
- Use **SecurityGroups** for network access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region

### Constraints

- All database credentials must be managed through SecretsManager with automatic rotation enabled every 30 days
- RDS instance must be configured with storage encryption and backup retention of 7 days minimum
- ElastiCache cluster must be deployed in a private subnet with encryption-in-transit enabled
- All resources must be destroyable (no Retain policies)
- No hardcoded passwords or credentials
- All data must be encrypted at rest and in transit
- Must support audit logging for compliance

## Success Criteria

- **Functionality**: Complete PCI-DSS compliant infrastructure with encrypted database, managed credentials, and session handling
- **Security**: All data encrypted at rest and in transit, credentials rotated automatically, no public access to databases
- **Reliability**: Multi-AZ RDS deployment with automated backups and 7-day retention
- **Compliance**: Proper tagging, audit logging, and credential rotation for PCI-DSS requirements
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: Clean YAML, well-structured CloudFormation template, proper parameterization

## What to deliver

- Complete CloudFormation YAML implementation
- RDS MySQL instance with Multi-AZ and encryption
- SecretsManager secret with rotation configuration
- ElastiCache Redis cluster with encryption-in-transit
- VPC with public and private subnets across multiple AZs
- Security groups for RDS, ElastiCache, and application access
- Proper outputs for connection strings and resource identifiers
- Documentation with deployment instructions
