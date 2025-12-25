## Multi-Environment CloudFormation Infrastructure

Hey team,

We need to build a scalable multi-environment infrastructure setup that can quickly spin up dev, staging, and production environments without waiting for lengthy database provisioning. The business wants rapid deployment capabilities with environment-specific configurations, and we need this operational fast.

The main challenge is creating a pattern that's reusable across three environments while keeping deployment time under 10 minutes. Each environment needs its own isolated network, compute, and data storage, but we should manage this from a single template using CloudFormation Conditions.

## What we need to build

Create a **CloudFormation with JSON** template that provisions a complete multi-environment application infrastructure for deployment to **us-east-1** region.

### Core Requirements

1. **Network Infrastructure**
   - VPC with environment-specific CIDR blocks: dev uses 10.0.0.0/16, staging uses 10.1.0.0/16, prod uses 10.2.0.0/16
   - Public subnets in 2 AZs host Application Load Balancer receiving internet traffic via Internet Gateway
   - Private subnets in 2 AZs run ECS Fargate tasks that connect to DynamoDB via VPC endpoints
   - NAT Gateway in public subnets provides internet access for private subnet resources to pull container images
   - Internet Gateway attached to VPC routes public traffic to ALB in public subnets
   - Route tables direct traffic from private subnets through NAT Gateway and from public subnets through Internet Gateway

2. **Container Orchestration**
   - ECS Fargate cluster with environment-specific names
   - Application Load Balancer in public subnets routes traffic to ECS Fargate tasks running in private subnets
   - ECS tasks send container logs to CloudWatch Logs log groups
   - ECS services integrate with ALB target groups for health checks
   - Auto-scaling policies monitor CloudWatch metrics to scale tasks between 2 and 6 based on CPU utilization
   - ECS task execution role grants permissions to pull container images and write to CloudWatch

3. **Data Persistence - Fast Deployment**
   - DynamoDB On-Demand tables instead of RDS Aurora for instant deployment without 30 minute provisioning wait
   - ECS Fargate tasks query and write to DynamoDB tables using IAM role permissions
   - DynamoDB Streams capture table changes that trigger downstream event processing
   - Point-in-time recovery enabled
   - CloudWatch alarms monitor DynamoDB for throttling and latency, publishing alerts to SNS topics

4. **Monitoring and Logging**
   - CloudWatch Alarms track ECS CPU, memory, and network metrics from Fargate tasks
   - CloudWatch Logs receive container output from ECS tasks via awslogs driver
   - SNS topics receive alarm notifications from CloudWatch and distribute to subscribers
   - CloudWatch Dashboard aggregates metrics from ECS, ALB, and DynamoDB for environment-specific views

5. **Configuration Management**
   - Systems Manager Parameter Store stores environment-specific settings accessed by ECS tasks at runtime
   - ECS task role grants GetParameter permissions to retrieve configuration from Parameter Store
   - Separate parameters for each environment including database endpoint, API keys, and other config values
   - Secure String type encrypts sensitive values retrieved by ECS tasks during startup

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON** syntax
- Deploy to **us-east-1** region
- Use Conditions to toggle features for different environments like IsProduction, IsDev, IsStaging
- All resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention with EnvironmentSuffix dynamically included in resource names
- Use CloudFormation Parameters for environment customization
- DynamoDB On-Demand billing for automatic scaling without capacity planning

### Deployment Requirements - CRITICAL

- ALL resources must be fully destroyable with NO Retain policies and NO DeletionProtection
- No AWS Config or property validation issues
- Resource names must dynamically include environmentSuffix
- Parameters must be clearly documented with default values
- Template must deploy successfully without manual setup

### Constraints

- Multi-environment capable with single template
- Fast deployment under 10 minutes by using DynamoDB instead of RDS Aurora
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

- Complete CloudFormation JSON template as single file or multiple stacked templates
- Parameters section with environment-specific configurations
- Conditions for IsProduction, IsDev, IsStaging environment detection
- Outputs section with application endpoints and resource identifiers
- Comprehensive Comments explaining complex sections
- CloudFormation best practices with no hardcoded values and parameters for customization
- Documentation on template usage and environment-specific outputs
