Hey team,

We need to build out a comprehensive CI/CD infrastructure for our educational platform that processes student data. This is a critical project because we're dealing with sensitive student records, so we need to ensure full compliance with data protection regulations while maintaining a robust deployment pipeline.

The business requirement is straightforward: we have an educational technology company running a student management system that handles sensitive student information. They need a complete CI/CD pipeline that can safely deploy updates through proper staging environments while maintaining strict security controls over the database and session management systems.

## What we need to build

Create a secure CI/CD infrastructure using **Pulumi with Python** for an educational platform that handles student data with proper staging and production environments.

### Core Requirements

1. **CI/CD Pipeline**
   - CodePipeline for deployment orchestration
   - Separate staging and production environments
   - Manual approval gates before production deployments
   - SNS notifications for approval workflow
   - CodeBuild stages for build and deployment

2. **Database Infrastructure**
   - RDS MySQL instance for student data storage
   - Must be deployed in private subnet
   - Access only through NAT Gateway
   - Proper security groups and network isolation

3. **Caching and Session Management**
   - ElastiCache cluster for session management
   - Proper subnet configuration
   - Security group isolation

4. **Security and Secrets**
   - SecretsManager for all database credentials
   - Automatic credential rotation every 30 days
   - No hardcoded credentials anywhere

5. **Network Infrastructure**
   - VPC with public and private subnets
   - NAT Gateway for private subnet internet access
   - Internet Gateway for public subnet
   - Proper routing tables

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **CodePipeline** for deployment orchestration
- Use **RDS MySQL** for student data storage
- Use **ElastiCache** for session management
- Use **SecretsManager** for credential management
- Use **CodeBuild** for build stages
- Use **SNS** for approval notifications
- Deploy to **us-east-1** region
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- All resources must be destroyable with no retention policies

### Constraints

- All database credentials stored in AWS Secrets Manager
- Credentials must rotate every 30 days
- RDS instance in private subnet only
- Database access only through NAT Gateway
- Pipeline requires manual approval for production
- Separate staging and production environments
- Must comply with educational data protection standards
- No hardcoded secrets or credentials
- Proper IAM roles and policies
- All resources must support clean destroy operations

### Deployment Requirements (CRITICAL)

- Every named resource MUST include the environment_suffix parameter
- All resources MUST be fully destroyable - no Retain deletion policies
- Use RemovalPolicy.DESTROY or equivalent for all stateful resources
- Database snapshots should be explicitly disabled for test environments
- Ensure proper dependency management between resources

## Success Criteria

- **Functionality**: Complete CI/CD pipeline from source to production with approval gates
- **Security**: All credentials in Secrets Manager with 30-day rotation
- **Network Isolation**: RDS in private subnet with NAT Gateway access only
- **Environment Separation**: Clear staging and production separation with approval workflow
- **Compliance**: Meets educational data protection requirements
- **Resource Naming**: All resources include environment_suffix
- **Destroyability**: All resources can be cleanly destroyed
- **Code Quality**: Python code following Pulumi best practices, well-documented

## What to deliver

- Complete Pulumi Python implementation in tap_stack.py
- VPC with public and private subnets
- NAT Gateway and Internet Gateway
- RDS MySQL instance with proper security
- ElastiCache cluster for sessions
- SecretsManager with rotation configuration
- CodePipeline with staging and production stages
- CodeBuild projects for build stages
- SNS topic for approval notifications
- IAM roles and policies for all services
- Comprehensive unit tests
- Documentation and deployment instructions
