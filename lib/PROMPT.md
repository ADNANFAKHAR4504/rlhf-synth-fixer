# Multi-Environment Payment Processing Infrastructure

Hey team,

We need to build a comprehensive multi-environment infrastructure setup for our payment processing system. I've been asked to create this using **CloudFormation with YAML** to ensure we can deploy consistent infrastructure across our development, staging, and production environments. The business has been struggling with configuration drift where manual changes in one environment don't get replicated to others, leading to deployment failures and security vulnerabilities that we need to fix.

Our fintech company processes critical payment transactions, so we need absolute consistency across environments. The infrastructure spans multiple AWS accounts within our Organization setup, covering us-east-1 and eu-west-1 regions. We're running containerized microservices on ECS Fargate, using Aurora PostgreSQL for data storage, and DynamoDB for session management. Everything needs to be deployed through CloudFormation StackSets to maintain that consistency we've been missing.

The payment processing workloads require high availability and disaster recovery capabilities. We need cross-region replication for our data stores and artifacts, automated compliance monitoring, and a robust parameter management system. All of this needs to work seamlessly across our three-account structure while handling environment-specific configurations like different database instance sizes and compute allocations.

## What we need to build

Create a multi-account payment processing infrastructure using **CloudFormation with YAML** that deploys consistent configurations across development, staging, and production environments through StackSets.

### Core Requirements

1. **Multi-Account Deployment with StackSets**
   - Define master CloudFormation template that deploys via StackSets to dev, staging, and prod accounts simultaneously
   - Use parameter overrides for environment-specific values while maintaining structural consistency
   - Implement CloudFormation Conditions to handle environment-specific configurations
   - Enable drift detection with automated monitoring and alerting

2. **Database Infrastructure**
   - Create Aurora PostgreSQL clusters with identical schema across all environments
   - Environment-specific instance sizing: db.t3.medium for dev, db.r5.large for staging and prod
   - Configure Multi-Master clusters for high availability
   - Implement automated backups and point-in-time recovery

3. **Container Orchestration**
   - Deploy ECS Fargate services with consistent task definitions across environments
   - Environment-specific CPU and memory allocations for cost optimization
   - Configure service auto-scaling policies
   - Implement load balancing and service discovery

4. **Data Replication and Storage**
   - Configure DynamoDB global tables with point-in-time recovery enabled
   - Set up auto-scaling policies for DynamoDB tables
   - Implement cross-region replication for session management
   - Create S3 buckets with cross-region replication rules for artifact storage
   - Configure S3 lifecycle policies for cost optimization

5. **Event-Driven Compliance Monitoring**
   - Set up EventBridge rules to monitor infrastructure changes
   - Deploy Lambda functions for automated compliance checks triggered by infrastructure events
   - Implement synchronization rules for DynamoDB table schemas across environments
   - Configure alerting for compliance violations

6. **Parameter Management and Secrets**
   - Create Systems Manager Parameter Store hierarchies following pattern: /{environment}/{service}/{parameter}
   - Store environment-specific configuration values securely
   - Implement proper IAM permissions for parameter access
   - Enable parameter versioning and audit trails

7. **Alerting and Notifications**
   - Configure SNS topics for drift detection alerts
   - Set up email subscriptions for DevOps team notifications
   - Implement alerting for infrastructure changes and compliance violations
   - Create notification workflows for deployment status

8. **Identity and Access Management**
   - Implement IAM roles with consistent permission boundaries across all environments
   - Configure cross-account IAM roles for StackSets deployment
   - Set up service-linked roles for ECS, Lambda, and other services
   - Implement least-privilege access principles

9. **Network Architecture**
   - VPCs with consistent CIDR patterns: 10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod
   - Private subnets across 3 availability zones per environment
   - Transit Gateway integration for cross-account networking
   - Security groups and network ACLs for proper segmentation

10. **Nested Stack Architecture**
    - Organize infrastructure as nested stacks for modularity
    - Separate stacks for networking, database, compute, storage, and monitoring
    - Use cross-stack references via CloudFormation outputs
    - Enable independent stack updates where appropriate

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **AWS Organizations** for multi-account management
- Use **CloudFormation StackSets** for multi-account deployment
- Use **Aurora PostgreSQL** for relational data storage
- Use **DynamoDB** for session management with global tables
- Use **ECS Fargate** for containerized workload orchestration
- Use **S3** for artifact storage with cross-region replication
- Use **EventBridge** for event-driven compliance monitoring
- Use **Lambda** for automated compliance checks
- Use **Systems Manager Parameter Store** for configuration management
- Use **SNS** for alert notifications
- Use **IAM** for access control with permission boundaries
- Use **VPC** for network isolation
- Use **Transit Gateway** for cross-account networking
- Deploy to **us-east-1** primary region with **eu-west-1** for replication
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- All resources must be destroyable with no Retain deletion policies

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix parameter in their names to ensure uniqueness across deployments
- Resource naming pattern: {resource-type}-{environment-suffix} (example: payment-db-cluster-dev-001)
- RemovalPolicy must be set to Delete or Snapshot for destroyable infrastructure (FORBIDDEN: Retain policies)
- DynamoDB tables must use BillingMode: PAY_PER_REQUEST or provisioned with auto-scaling for cost efficiency
- Lambda functions using Node.js 18 or higher must include AWS SDK v3 explicitly in dependencies
- Aurora clusters should use serverless v2 where possible for cost optimization
- S3 buckets must have versioning enabled for compliance but configure lifecycle rules for cost management
- EventBridge rules should use specific event patterns rather than broad wildcards

### Constraints

- Must work within AWS Organizations multi-account setup
- Requires StackSets enabled with necessary cross-account IAM roles
- Must handle environment-specific configurations through parameters and conditions
- All resources must use consistent tagging schema: Environment, Application, CostCenter tags
- Network CIDR ranges must not overlap between environments
- Must implement proper error handling for stack creation failures
- Cross-region replication must account for latency and consistency requirements
- Parameter Store hierarchies must follow strict naming conventions
- All drift detection must trigger immediate notifications
- Security groups must follow least-privilege network access principles

## Success Criteria

- **Functionality**: Infrastructure deploys successfully across all three accounts (dev, staging, prod) via StackSets
- **Consistency**: Identical structural configuration across environments with only parameter-driven differences
- **Performance**: Aurora and DynamoDB auto-scaling responds appropriately to load changes
- **Reliability**: Cross-region replication operational for S3 and DynamoDB with RPO under 5 minutes
- **Security**: IAM roles implement least-privilege with permission boundaries enforced
- **Compliance**: EventBridge rules successfully trigger Lambda compliance checks on infrastructure changes
- **Monitoring**: Drift detection operational with SNS notifications delivered to DevOps team
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly deleted without manual intervention
- **Code Quality**: Well-structured YAML with clear parameter definitions and comprehensive outputs
- **Documentation**: Complete deployment instructions and architecture documentation

## What to deliver

- Complete CloudFormation YAML implementation with nested stack architecture
- Master StackSet template for multi-account deployment
- Nested stack templates for: networking, database, compute, storage, monitoring, security
- Parameter configuration files for dev, staging, and prod environments
- Aurora PostgreSQL cluster definitions with Multi-Master configuration
- ECS Fargate service and task definitions with auto-scaling
- DynamoDB global table configurations with point-in-time recovery
- S3 bucket configurations with cross-region replication and lifecycle policies
- EventBridge rules with Lambda function implementations for compliance checks
- Systems Manager Parameter Store hierarchy setup
- SNS topics with email subscription configurations
- IAM roles and policies with permission boundaries
- VPC and Transit Gateway configurations
- CloudFormation Conditions for environment-specific resource sizing
- Comprehensive parameter definitions with descriptions and constraints
- Stack outputs for cross-stack references
- Unit tests validating template syntax and resource configurations
- Integration tests for multi-account deployment scenarios
- Documentation including architecture diagrams, deployment procedures, and troubleshooting guides
- README with prerequisites, deployment steps, and validation procedures
