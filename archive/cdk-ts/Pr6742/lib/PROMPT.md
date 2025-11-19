Hey team,

We need to build a comprehensive payment processing infrastructure that can be deployed consistently across our three environments: dev, staging, and production. I've been asked to create this in TypeScript using AWS CDK. The business wants to ensure we have the same logical architecture everywhere, but with environment-specific sizing and retention policies that make sense for each stage.

The challenge here is preventing configuration drift while maintaining flexibility. We need a single source of truth for infrastructure definitions, but each environment should have appropriate resource sizing based on its workload. Development needs to be cost-effective, staging needs to mirror production characteristics, and production needs full capacity and longer retention periods.

We're looking at a full payment processing stack with networking, databases, API layer, message queues, storage, and security components. Everything needs to work together seamlessly and be deployed to different AWS accounts while maintaining consistency.

## What we need to build

Create a multi-environment payment processing infrastructure using **AWS CDK with TypeScript** that deploys consistently across dev, staging, and production environments.

### Core Requirements

1. **Infrastructure Inheritance Pattern**
   - Define an abstract base stack class that encapsulates common infrastructure patterns
   - Create environment-specific stack classes that inherit from the base with appropriate overrides
   - Ensure single source of truth for infrastructure definitions

2. **Network Architecture**
   - Implement VPC configuration with consistent subnet layouts across environments
   - Use different CIDR blocks per environment: 10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod
   - Maintain same logical network structure across all environments

3. **Database Layer**
   - Deploy RDS Aurora PostgreSQL clusters with environment-specific instance sizes
   - Use db.t3.medium for dev, db.r5.large for staging, db.r5.xlarge for prod
   - Ensure consistent database configuration with appropriate scaling

4. **Application Layer**
   - Configure Lambda functions that read configuration from SSM Parameter Store
   - Use parameter paths like /{env}/payment-service/config/* for environment-specific settings
   - Ensure Lambda functions can access environment-specific configuration

5. **API Gateway Configuration**
   - Set up API Gateway with environment-specific custom domains
   - Implement WAF rules appropriate for each environment
   - Ensure consistent API structure across environments

6. **Message Processing**
   - Implement SQS queues with consistent naming patterns
   - Configure environment-appropriate message retention periods
   - Ensure reliable message processing across environments

7. **Storage Configuration**
   - Create S3 buckets with lifecycle policies that vary by environment
   - Set 7 days retention for dev, 30 days for staging, 90 days for prod
   - Maintain consistent bucket structure across environments

8. **Cross-Stack Integration**
   - Generate CloudFormation outputs that include environment tags
   - Enable easy cross-stack referencing
   - Support integration between stack components

9. **Configuration Validation**
   - Implement a configuration validation function
   - Ensure all required parameters exist before deployment
   - Prevent deployment with missing or invalid configuration

10. **Multi-Environment Deployment**
    - Support deployment to different AWS accounts and regions
    - Maintain same logical architecture across all deployments
    - Enable independent environment updates

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **VPC** for network isolation with public and private subnets
- Use **RDS Aurora PostgreSQL** for database clusters with environment-specific sizing
- Use **Lambda** for serverless compute with SSM Parameter Store integration
- Use **API Gateway** for RESTful API endpoints with custom domains
- Use **WAF** for web application firewall rules
- Use **SQS** for message queues with dead letter queues
- Use **S3** for object storage with lifecycle policies
- Use **SSM Parameter Store** for configuration management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `payment-{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies or DeletionProtection)

### Constraints

- No hardcoded environment values in base stack
- All environment-specific configuration must come from parameters or environment variables
- Database instance sizing must scale appropriately per environment
- Lifecycle policies must reflect environment usage patterns
- All resources must be properly tagged with environment information
- IAM roles must follow least privilege principle
- All resources must support clean teardown
- Include proper error handling and logging
- Configuration validation must run before any resource creation

## Success Criteria

- **Functionality**: Three separate CloudFormation stacks deployable to different AWS accounts/regions
- **Consistency**: Same logical architecture maintained across all environments
- **Configuration**: Environment-appropriate sizing and retention policies
- **Validation**: Configuration validation prevents deployment with missing parameters
- **Inheritance**: Base stack class properly encapsulated with environment-specific overrides
- **Integration**: CloudFormation outputs enable cross-stack referencing
- **Drift Prevention**: Single source of truth prevents configuration drift
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be fully deleted without manual intervention
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- Abstract base stack class with common patterns
- Environment-specific stack classes (dev, staging, prod)
- VPC with appropriate CIDR blocks per environment
- RDS Aurora PostgreSQL clusters with environment-specific sizing
- Lambda functions with SSM Parameter Store integration
- API Gateway with custom domains and WAF rules
- SQS queues with appropriate retention periods
- S3 buckets with environment-specific lifecycle policies
- Configuration validation function
- CloudFormation outputs with environment tags
- Unit tests for stack validation and configuration
- Documentation and deployment instructions
