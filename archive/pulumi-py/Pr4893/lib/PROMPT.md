# HIPAA-Compliant Healthcare Data Processing Infrastructure

## Task Description

I need to build infrastructure for a healthcare data processing system that handles patient records from multiple providers. The system must be HIPAA compliant and process sensitive health information securely. The application will run in containers and needs to scale based on demand.

## Requirements

### Infrastructure Components

I need the following AWS services set up:

1. **ECS Fargate cluster** - to run containerized healthcare applications
2. **RDS database** - for storing patient records with encryption enabled
3. **AWS Secrets Manager** - to manage database passwords and other credentials
4. **ElastiCache Redis** - for session management and caching
5. **VPC with proper network isolation** - private subnets for data processing
6. **KMS encryption keys** - for encrypting data at rest

### HIPAA Compliance Requirements

The infrastructure must meet these compliance requirements:

- All data at rest must be encrypted using AWS KMS
- All data in transit must use TLS/SSL encryption
- Database backups must be kept for at least 30 days
- Enable point-in-time recovery for the database
- All resources should be in private subnets where possible
- Database credentials must be stored in Secrets Manager, not hardcoded
- Enable automated backups for RDS

### Additional Requirements

- The RDS instance should use Aurora Serverless v2 for cost efficiency
- Use ECS Service Connect for service-to-service communication
- Security groups should follow least privilege principles
- Tag all resources with Environment and Application tags

## Deliverables

Please provide Pulumi Python code that creates this infrastructure. The code should be production-ready and follow AWS best practices for HIPAA compliance.