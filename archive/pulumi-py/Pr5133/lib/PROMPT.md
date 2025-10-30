Hey team,

HealthTech Solutions is launching a new healthcare records management platform and we need to build the API infrastructure to support it. The system will be handling sensitive patient data, so we need to make sure we get the security and compliance aspects right from the start. I've been asked to create the infrastructure using **Pulumi with Python** and deploy it to the eu-west-1 region.

The business requirements are pretty clear. We need an API that can handle patient health information with proper encryption, session management for healthcare providers, and reliable data persistence with proper backup policies. The platform needs to be highly available and comply with healthcare data protection regulations. The key challenge here is making sure all the sensitive data is properly encrypted and access is controlled through private networking where appropriate.

We're dealing with patient health information, so everything needs to be encrypted at rest using AWS KMS. The caching layer needs to be completely isolated from public access, and we need to ensure that database backups are retained long enough to meet regulatory requirements. The infrastructure also needs to be fully destroyable for testing purposes, so we can't use any retention policies or deletion protection.

## What we need to build

Create a secure API infrastructure using **Pulumi with Python** for a healthcare records management platform that handles sensitive patient data with proper caching and persistence layers.

### Core Requirements

1. **API Layer**
   - Deploy API Gateway to provide RESTful endpoint management
   - Configure proper authentication and authorization
   - Enable logging for audit trails

2. **Caching Layer**
   - Implement ElastiCache Redis cluster for session management
   - Deploy in private subnet with no public access
   - Enable encryption at rest using AWS KMS
   - Configure appropriate node types for healthcare workload

3. **Data Persistence**
   - Deploy RDS PostgreSQL instance for data storage
   - Enable encryption at rest using AWS KMS
   - Configure automated backups with 30-day retention minimum
   - Deploy in private subnet for security

4. **Secrets Management**
   - Use AWS Secrets Manager for credential management
   - Store database credentials securely
   - Enable automatic rotation policies where possible

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **API Gateway** for RESTful API endpoints
- Use **ElastiCache Redis** for session caching
- Use **RDS PostgreSQL** for persistent data storage
- Use **Secrets Manager** for credential management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **eu-west-1** region
- All sensitive data encrypted at rest with AWS KMS

### Constraints

- All resources deployed in eu-west-1 region
- All data encrypted at rest using AWS KMS
- Redis cache must be in private subnet with no public access
- Database backups retained for at least 30 days
- Handle sensitive patient data (PHI) in compliance with healthcare regulations
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Proper network isolation for data services
- Enable audit logging for compliance

## Success Criteria

- **Functionality**: All four AWS services properly deployed and configured
- **Performance**: Caching layer reduces database load for frequent queries
- **Reliability**: Database backups automated with proper retention
- **Security**: All PHI encrypted at rest, private networking for data services
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean Python code, well-tested, properly documented
- **Compliance**: Configuration meets healthcare data protection requirements

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- API Gateway REST API with proper configuration
- ElastiCache Redis cluster in private subnet with encryption
- RDS PostgreSQL instance with encryption and backup policies
- Secrets Manager secrets for credential management
- KMS keys for encryption at rest
- Proper networking configuration (VPC, subnets, security groups)
- Unit tests using pytest
- Integration tests validating deployed resources
- Documentation including deployment instructions
