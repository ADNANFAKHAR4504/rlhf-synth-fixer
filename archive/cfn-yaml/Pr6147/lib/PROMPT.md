Hey team,

We need to solve a critical infrastructure consistency problem for a fintech startup. They're running a payment processing system, and right now they're dealing with environment drift between dev, staging, and production. Different configurations are causing unexpected behavior when code moves between environments, which is unacceptable for payment processing. The business wants identical infrastructure topology across all three environments, with only environment-specific sizing and security settings varying in a controlled way.

The company currently deploys to three separate AWS accounts across different regions: production in us-east-1, staging in us-east-2, and development in us-west-2. Each environment needs its own VPC with 3 availability zones, but the resource structure must be identical. They want to eliminate configuration drift while still allowing environment-appropriate resource sizing and retention policies.

The payment processing stack includes containerized services running on ECS Fargate, a PostgreSQL database on RDS Aurora for transaction storage, SQS queues for async payment processing, and Application Load Balancers for traffic distribution. Each component needs to be sized differently per environment, but the architecture must remain identical.

## What we need to build

Create a multi-environment payment processing infrastructure using **CloudFormation with YAML** that maintains strict environment parity while allowing controlled environment-specific configurations.

### Core Requirements

1. **Reusable Template Architecture**
   - Define CloudFormation templates that encapsulate the entire payment processing stack
   - Include ECS services, RDS database, and SQS queues in a unified template structure
   - Enable the same templates to be deployed across all three environments

2. **Environment-Specific Configuration Management**
   - Load all environment-specific values from SSM Parameter Store
   - Follow the naming pattern: /{environment}/payments/{parameter}
   - Externalize instance sizes, retention periods, and thresholds to SSM

3. **Multi-Environment Stack Deployment**
   - Create separate CloudFormation stacks for each environment (dev, staging, prod)
   - Use identical template structures with environment-specific parameters
   - Ensure stack isolation with no cross-environment resource references

4. **RDS Aurora PostgreSQL Database**
   - Deploy Multi-AZ Aurora PostgreSQL clusters in each environment
   - Use db.t3.medium instances for dev environment
   - Use db.r5.large instances for staging and production
   - Load instance type from SSM parameter for each environment

5. **ECS Fargate Services**
   - Deploy containerized payment services with identical task definitions
   - Configure different CPU/memory allocations per environment
   - Dev: 512 CPU / 1024 memory, Staging: 1024 CPU / 2048 memory, Prod: 2048 CPU / 4096 memory

6. **SQS Queue Configuration**
   - Implement SQS queues with Dead Letter Queues for payment processing
   - Set message retention: 1 day (dev), 4 days (staging), 14 days (prod)
   - Configure DLQ with maxReceiveCount varying by environment

7. **Resource Tagging Strategy**
   - Apply consistent tags: Environment, Application, and CostCenter
   - Load tag values from SSM Parameter Store for each environment
   - Enable cost tracking and resource management by environment

8. **RDS Snapshot Automation**
   - Enable automated backup with environment-specific retention
   - Retention periods: 7 days (dev), 14 days (staging), 30 days (prod)
   - Configure backup windows during low-traffic periods

9. **Application Load Balancer Setup**
   - Deploy ALBs with identical routing rules across environments
   - Use environment-specific SSL certificates from ACM
   - Load certificate ARNs from SSM parameters

10. **CloudWatch Monitoring and Alarms**
    - Create alarms for CPU utilization, memory usage, and database connections
    - Adjust thresholds per environment (dev: 80%, staging: 75%, prod: 70%)
    - Load threshold values from SSM parameters

11. **S3 Logging Infrastructure**
    - Create S3 buckets for application and access logs
    - Implement lifecycle policies: 7 days (dev), 30 days (staging), 90 days (prod)
    - Enable encryption and versioning on all buckets

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **VPC** with 3 availability zones, public and private subnets
- Deploy **NAT Gateways** for outbound traffic from private subnets
- Use **ECS Fargate** for container orchestration
- Deploy **RDS Aurora PostgreSQL Multi-AZ** for data persistence
- Implement **SQS** queues with Dead Letter Queue pattern
- Configure **Application Load Balancer** for traffic distribution
- Store all environment-specific configs in **SSM Parameter Store**
- Create **CloudWatch Alarms** for monitoring and alerting
- Set up **S3 buckets** with lifecycle policies for log management
- Define **IAM roles** for ECS tasks and cross-account deployment
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Deploy to **us-east-1** region by default

### Constraints

- All environments must use exactly the same template hierarchy
- Environment-specific values must be externalized to SSM Parameter Store
- Each environment must have isolated VPC with different CIDR ranges
- Cross-environment resource references must be prevented through stack boundaries
- All resources must be destroyable for testing (no Retain deletion policies)
- Standardized SSM naming: /{environment}/payments/{parameter}
- Include proper error handling and CloudFormation outputs

## Success Criteria

- Functionality: Identical infrastructure topology across all three environments
- Configuration: All environment differences cleanly externalized to SSM parameters
- Reliability: Multi-AZ deployment for RDS and load balancers
- Security: Proper IAM roles, encryption, and network isolation
- Monitoring: CloudWatch alarms with environment-specific thresholds
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Clean CloudFormation YAML, well-documented parameters

## What to deliver

- Complete CloudFormation YAML implementation in lib/TapStack.yml
- Master template and nested stack structure for reusability
- VPC with 3 AZs, public/private subnets, NAT gateways
- ECS Fargate cluster and service definitions
- RDS Aurora PostgreSQL Multi-AZ cluster
- SQS queues with Dead Letter Queue configuration
- Application Load Balancer with target groups
- IAM roles for ECS tasks and deployment
- S3 buckets with lifecycle policies
- CloudWatch alarm definitions
- SSM parameter integration for environment-specific configs
- CloudFormation outputs for cross-stack references
- Documentation with deployment instructions for each environment
