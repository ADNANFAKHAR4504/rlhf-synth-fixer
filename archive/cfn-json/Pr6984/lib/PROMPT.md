## Multi-Environment CloudFormation Infrastructure

Hey team,

We need to build a scalable multi-environment infrastructure setup that can quickly spin up dev, staging, and production environments without waiting for lengthy database provisioning. The business wants rapid deployment capabilities with environment-specific configurations, and we need this operational fast.

The main challenge is creating a pattern that's reusable across three environments while keeping deployment time under 10 minutes. Each environment needs its own isolated network, compute, and data storage, but we should manage this from a single template using CloudFormation Conditions.

## What we need to build

Create a **CloudFormation with JSON** template that provisions a complete multi-environment application infrastructure for deployment to **us-east-1** region.

### Core Requirements

1. **Network Infrastructure**
   - VPC with environment-specific CIDR blocks (dev: 10.0.0.0/16, staging: 10.1.0.0/16, prod: 10.2.0.0/16)
   - Public subnets in 2 AZs for load balancer
   - Private subnets in 2 AZs for application servers
   - NAT Gateway for private subnet egress
   - Internet Gateway for public access

2. **Container Orchestration**
   - ECS Fargate cluster with environment-specific names
   - Application Load Balancer in public subnets
   - CloudWatch Logs for container output
   - Auto-scaling capability (min 2, max 6 tasks)
   - Health check endpoints configured

3. **Data Persistence (Fast)**
   - DynamoDB On-Demand tables instead of RDS Aurora (instant deployment, no 30min provisioning)
   - DynamoDB Streams for event processing
   - Point-in-time recovery enabled
   - CloudWatch alarms for throttling and latency

4. **Monitoring and Logging**
   - CloudWatch Alarms for CPU, memory, and network metrics
   - CloudWatch Logs for ECS tasks
   - SNS topics for alarm notifications
   - CloudWatch Dashboard for environment-specific views

5. **Configuration Management**
   - Systems Manager Parameter Store for environment-specific settings
   - Separate parameters for each environment (database endpoint, API keys, etc.)
   - Secure String type for sensitive values

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON** syntax
- Deploy to **us-east-1** region
- Use Conditions to toggle features for different environments (IsProduction, IsDev, IsStaging)
- All resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- Use CloudFormation Parameters for environment customization
- DynamoDB On-Demand billing for automatic scaling without capacity planning

### Deployment Requirements (CRITICAL)

- ALL resources must be fully destroyable (NO Retain policies, NO DeletionProtection)
- No AWS Config or property validation issues
- Resource names must dynamically include environmentSuffix
- Parameters must be clearly documented with default values
- Template must deploy successfully without manual setup

### Constraints

- Multi-environment capable with single template
- Fast deployment (under 10 minutes, no RDS Aurora)
- Environment isolation with separate VPCs
- Production environment has higher alarm thresholds
- All resources must support cleanup and deletion
- Proper error handling and monitoring configured
- CloudFormation outputs for application endpoints

## Success Criteria

- **Functionality**: VPC, ECS Fargate, ALB, DynamoDB, monitoring all deployed and functional
- **Performance**: Infrastructure deployed in <10 minutes, DynamoDB responds in milliseconds
- **Reliability**: Multi-AZ setup, auto-scaling configured, health checks active
- **Security**: Private subnets for compute, encryption at rest for DynamoDB, IAM roles properly scoped
- **Resource Naming**: All resources include environmentSuffix parameter dynamically
- **Destroyability**: `aws cloudformation delete-stack` cleanly removes all resources

## What to deliver

- Complete CloudFormation JSON template (single file or multiple stacked templates)
- Parameters section with environment-specific configurations
- Conditions for IsProduction, IsDev, IsStaging environment detection
- Outputs section with application endpoints and resource identifiers
- Comprehensive Comments explaining complex sections
- CloudFormation best practices (no hardcoded values, parameters for customization)
- Documentation on template usage and environment-specific outputs
