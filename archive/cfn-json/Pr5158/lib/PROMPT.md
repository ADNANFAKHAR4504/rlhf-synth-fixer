# Financial Transaction Processing System

Hey team,

We need to build a secure financial transaction processing pipeline for our banking operations. The business has asked us to create this infrastructure using **CloudFormation with JSON** to ensure we can deploy and manage it consistently across environments. This system needs to handle sensitive financial data, so security is our top priority.

The regulatory team has made it clear that we must meet PCI-DSS compliance standards. This means encryption everywhere, proper network isolation, comprehensive logging, and minimal privilege access controls. The system will be processing real-time transactions, so we need a reliable container-based application layer backed by a robust database.

We've been allocated the eu-central-2 region for this deployment. The architecture needs to be production-ready but also completely destroyable for testing purposes - no retention policies that would block teardown.

## What we need to build

Create a secure financial transaction processing system using **CloudFormation with JSON** for deploying containerized applications with database backend in AWS.

### Core Requirements

1. **Container Infrastructure**
   - Deploy ECS cluster for running transaction processing containers
   - Configure ECS task definitions with security best practices
   - Implement auto-scaling capabilities for handling transaction volume
   - Use Fargate for serverless container execution

2. **Database Layer**
   - Provision RDS instance for transaction data storage
   - Enable encryption at rest using AWS KMS
   - Configure automated backups
   - Deploy in private subnet with no public access

3. **Network Security**
   - Create VPC with proper subnet segmentation (public and private)
   - Configure security groups following least privilege principle
   - Implement network isolation for database tier
   - Enable VPC flow logs for network monitoring

4. **PCI-DSS Compliance**
   - Encrypt all data at rest (RDS, EBS volumes)
   - Enforce encryption in transit (TLS/SSL)
   - Enable comprehensive CloudWatch logging
   - Configure IAM roles with minimal required permissions
   - Implement proper secret management for database credentials

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **ECS Fargate** for container orchestration
- Use **RDS** for relational database (prefer Aurora Serverless for cost optimization)
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- Deploy to **eu-central-2** region
- Use AWS Secrets Manager for database credential management

### Constraints

- All resources must be deployed in eu-central-2 region
- PCI-DSS compliance is mandatory
- No public database access allowed
- IAM policies must follow least privilege principle
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and CloudWatch alarms
- Database must be in private subnet only
- All data transmissions must use TLS 1.2 or higher

## Success Criteria

- **Functionality**: ECS cluster can deploy and run containers, RDS accessible from ECS only
- **Performance**: Auto-scaling configured for ECS tasks based on CPU/memory
- **Reliability**: Multi-AZ deployment for high availability
- **Security**: All PCI-DSS requirements met, encryption enabled, least privilege access
- **Resource Naming**: All named resources include environmentSuffix parameter
- **Code Quality**: Valid JSON CloudFormation template, well-documented, follows AWS best practices

## What to deliver

- Complete CloudFormation JSON template
- VPC with public and private subnets across multiple AZs
- ECS cluster with Fargate launch type
- ECS task definition with container specifications
- RDS database instance with encryption enabled
- Security groups for ECS and RDS with proper rules
- IAM roles and policies for ECS task execution and task role
- CloudWatch log groups for container and database logs
- Secrets Manager secret for database credentials
- All resources parameterized with EnvironmentSuffix
- Template parameters for configuration flexibility
- Outputs for important resource identifiers
