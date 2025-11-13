Hey team,

We need to build a multi-environment payment processing infrastructure for our fintech startup. I've been asked to create this in Python using AWS CDK. The business has been experiencing configuration drift between dev, staging, and prod environments causing production incidents, so they want a solution that enforces consistency while allowing controlled environment-specific variations.

The challenge is maintaining identical configurations across all three environments while still allowing necessary differences like instance sizes and auto-scaling limits. We've had issues where a setting was changed in staging but not prod, leading to unexpected behavior in production. This needs to stop.

The solution should use an abstract base stack class that all environments inherit from, ensuring consistency by default. Each environment needs its own VPC, but they all need to follow the same architecture patterns. We also need VPC peering between environments for secure admin access, and cross-region replication from prod to a disaster recovery region.

## What we need to build

Create a multi-environment payment processing infrastructure using **AWS CDK with Python** that deploys identical architecture across Dev, Staging, and Prod environments.

### Core Requirements

1. **Abstract Base Stack Architecture**
   - Define an abstract base stack class containing all shared infrastructure components
   - Create three environment-specific stack classes (Dev, Staging, Prod) inheriting from the base
   - Enforce consistency through inheritance while allowing controlled variations

2. **Network Infrastructure**
   - Create separate VPCs for each environment with 3 availability zones
   - Public and private subnets in each AZ
   - NAT gateways and Internet gateways
   - Configure VPC peering between environments for secure admin access
   - Implement parameter validation ensuring CIDR blocks don't overlap across environments

3. **Database Layer**
   - Deploy RDS Aurora PostgreSQL Multi-AZ clusters in each environment
   - Environment-appropriate instance sizes: db.t3.medium for dev, db.r6g.large for staging and prod
   - DynamoDB tables for session storage across all environments

4. **Application Layer**
   - Application Load Balancer (ALB) in each environment
   - ECS Fargate services for containerized payment processing
   - Configure auto-scaling policies: min 2, max 10 for prod; min 1, max 5 for dev and staging

5. **Async Processing**
   - SQS queues for async processing in each environment
   - Appropriate queue configurations per environment

6. **Storage and Replication**
   - S3 buckets for audit logs in each environment
   - Set up cross-region replication from prod bucket to disaster recovery region

7. **Monitoring and Alarms**
   - Create CloudWatch dashboards for each environment
   - Environment-specific alarm thresholds
   - Monitoring for all critical services

8. **Security and IAM**
   - Implement IAM roles with least-privilege policies for each service
   - Use AWS Systems Manager Parameter Store for sensitive configuration values
   - Encryption at rest and in transit for all data

9. **Configuration Management**
   - Use CDK context values to manage environment-specific parameters
   - Create custom CDK constructs for reusable components
   - Implement stack-level tags that include environment name and deployment timestamp
   - Use CDK aspects to enforce security policies across all environments

10. **Resource Tracking**
    - Generate a JSON manifest file documenting all deployed resources per environment
    - Include resource ARNs, endpoints, and configuration parameters
    - Enable automated verification of cross-environment consistency

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **ap-southeast-1** region (with cross-region replication to DR region)
- Python 3.9+ required
- AWS CDK 2.100+ required
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `payment-{service}-{environmentSuffix}`
- Use **VPC** with 3 AZs, public and private subnets, NAT gateways, Internet gateways
- Use **Application Load Balancer** for traffic distribution
- Use **ECS Fargate** for containerized services
- Use **RDS Aurora PostgreSQL Multi-AZ** for database
- Use **DynamoDB** for session storage
- Use **SQS** for async processing
- Use **S3** with cross-region replication for audit logs
- Use **CloudWatch** for dashboards and alarms
- Use **Systems Manager Parameter Store** for sensitive configuration

### Constraints

- All resources must be fully destroyable (no Retain policies)
- No DeletionProtection flags
- Implement CDK unit tests to verify cross-environment consistency
- Generate CloudFormation drift detection reports for each environment
- Use CDK pipelines concepts for automated multi-environment deployments
- All resources must follow identical CIDR schemes across environments
- Security policies must be enforced via CDK aspects
- Include proper error handling and logging

## Success Criteria

- **Consistency**: Identical architecture deployed across all three environments
- **Validation**: CIDR blocks validated to prevent overlaps
- **Scalability**: Auto-scaling configured appropriately per environment
- **Reliability**: Multi-AZ database deployments
- **Security**: Least-privilege IAM roles, encryption enabled
- **Monitoring**: CloudWatch dashboards with environment-specific thresholds
- **Replication**: Cross-region S3 replication working from prod
- **Documentation**: JSON manifest file generated with all resource details
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Python, comprehensive unit tests, well-documented

## What to deliver

- Complete AWS CDK Python implementation with abstract base stack
- Three environment-specific stacks (Dev, Staging, Prod) inheriting from base
- Custom CDK constructs for reusable components
- VPC infrastructure with peering connections
- ECS Fargate services with auto-scaling
- RDS Aurora PostgreSQL Multi-AZ clusters
- DynamoDB tables for session storage
- SQS queues for async processing
- S3 buckets with cross-region replication
- IAM roles and policies
- CloudWatch dashboards and alarms
- Systems Manager Parameter Store integration
- CDK aspects for security policy enforcement
- JSON manifest generation logic
- Comprehensive unit tests
- Documentation and deployment instructions
