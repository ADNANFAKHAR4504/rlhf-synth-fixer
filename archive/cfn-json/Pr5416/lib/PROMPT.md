
We're working on migrating our legacy PostgreSQL database from on-premises to AWS RDS. The development team needs a CloudFormation template that can handle deployments across dev, staging, and production environments without having to maintain three separate templates.

The current on-premises setup runs PostgreSQL 12.x, and we're moving to RDS PostgreSQL 14.7. Each environment has different capacity and backup requirements, but we want a single parameterized template that can handle all three. Development needs a lightweight configuration for rapid iteration, while production needs high availability and long-term backup retention.

## What we need to build

Create an RDS PostgreSQL database infrastructure using **CloudFormation with JSON** for multi-environment deployment. The template needs to be parameterized so the same code can deploy dev, staging, and production configurations with appropriate resource sizing and availability settings.

## Core Requirements

1. **Environment-Based Configuration**
   - Accept an environment type parameter (dev, staging, prod)
   - Use Mappings section to define environment-specific values
   - Control instance sizing based on environment: db.t3.micro for dev, db.t3.small for staging, db.m5.large for prod
   - Enable Multi-AZ only for staging and production (disabled for dev)
   - Set backup retention to 7 days for dev/staging, 30 days for production

2. **RDS Database Configuration**
   - Deploy RDS PostgreSQL version 14.7 specifically
   - Database name must be 'migrated_app_db' for all environments
   - RDS instance identifier must include environment type as suffix
   - Enable encryption at rest using AWS managed keys
   - Create DB subnet group using existing VPC subnets passed as parameters
   - Subnet group name must follow pattern 'rds-subnet-group-{environment}'

3. **Credential Management**
   - Store master password in AWS Secrets Manager
   - Secret name must follow pattern '/rds/{environment}/master-password'
   - Disable automatic rotation for this migration phase
   - Generate secure random password in Secrets Manager

4. **Network Integration**
   - Accept at least 2 subnet IDs as parameters (for Multi-AZ support)
   - Subnets must be in different Availability Zones
   - Use existing VPC infrastructure (not creating new VPC)

5. **Resource Tagging**
   - All resources must include 'Environment' tag with the environment type
   - All resources must include 'MigrationDate' tag
   - All resources must have 'Project' tag with value 'DatabaseMigration'

## Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Parameter names must follow CamelCase convention
- Template must include detailed comments for readability
- Use AWS::RDS::DBInstance for the database
- Use AWS::RDS::DBSubnetGroup for subnet configuration
- Use AWS::SecretsManager::Secret for password storage
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation

## Constraints

- Must use JSON format (not YAML)
- PostgreSQL engine version must be exactly 14.7
- Database name locked to 'migrated_app_db'
- No admin access in IAM roles
- Template must be deployable via AWS CLI or Console
- Must work with existing VPC subnets (passed as parameters)

## Success Criteria

- **Functionality**: Single template deploys correctly for all three environments
- **Configuration**: Instance sizing and Multi-AZ settings match environment type
- **Backup**: Retention periods align with environment requirements (7 or 30 days)
- **Security**: Passwords stored in Secrets Manager, encryption enabled
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: Environment, MigrationDate, and Project tags on all resources
- **Outputs**: Template exports RDS endpoint address and port for application configuration
- **Code Quality**: Well-structured JSON, well-commented, documented

## What to deliver

- Complete CloudFormation JSON template
- Parameters for environment type, subnet IDs, and environmentSuffix
- Mappings section for environment-specific values
- RDS PostgreSQL 14.7 instance with appropriate configuration
- DB subnet group for Multi-AZ support
- Secrets Manager secret for master password
- Outputs for RDS endpoint and port
- Well-commented JSON for maintainability
