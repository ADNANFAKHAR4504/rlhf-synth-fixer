Hey team,

We need to build a high-availability payment processing infrastructure for a financial services company. Their transaction processing system handles time-sensitive payment authorizations and they need 99.99% uptime. Any downtime directly impacts revenue and customer trust. I've been asked to create this infrastructure using **CloudFormation with JSON** to ensure it can survive AWS availability zone failures.

The critical part here is that the system needs to automatically recover from AZ failures without any manual intervention. When an AZ goes down, the system should keep running without customers noticing anything. We're talking about a multi-AZ deployment across us-east-1a, us-east-1b, and us-east-1c with Aurora PostgreSQL, ECS Fargate tasks, and load balancers all working together to maintain continuous operation.

The business has been very clear that this is revenue-critical infrastructure. Every second of downtime means lost transactions and damaged customer relationships. They need automated failover, comprehensive monitoring, and the ability to detect and respond to failures within 60 seconds.

## What we need to build

Create a highly available payment processing infrastructure using **CloudFormation with JSON** that can survive AWS availability zone failures. The system must maintain 99.99% uptime by automatically recovering from single AZ failures without manual intervention.

### Core Requirements

1. **Database Layer**
   - Set up Aurora PostgreSQL cluster with one writer and two reader instances
   - Distribute database instances across different availability zones
   - Configure automated failover capability between AZs
   - Implement automated RDS snapshot backup with 7-day retention

2. **Application Layer**
   - Deploy ECS Fargate service running exactly 6 tasks
   - Distribute tasks evenly across 3 availability zones (2 per AZ)
   - Configure rolling updates with minimum healthy percent of 100
   - Ensure tasks can communicate with RDS across AZs

3. **Load Balancing and Traffic Management**
   - Configure Application Load Balancer with cross-zone load balancing
   - Set up target group health checks every 5 seconds
   - Enable connection draining for graceful shutdowns
   - Implement Route 53 failover routing between primary and secondary ALB endpoints
   - Use 30-second TTL for Route 53 health checks

4. **Auto Scaling and Resilience**
   - Create Auto Scaling policies that maintain exactly 6 ECS tasks at all times
   - Ensure 6 tasks remain running even during single AZ failures
   - Configure automatic task replacement when tasks become unhealthy

5. **Monitoring and Alerting**
   - Set up CloudWatch alarms for RDS failover events
   - Monitor ECS task failures with CloudWatch alarms
   - Track ALB unhealthy target counts with alarms
   - Configure SNS topic for critical alerts with email subscription
   - Create CloudWatch dashboard showing real-time failover metrics
   - All alarms must trigger within 60 seconds of service degradation

6. **Multi-Region Disaster Recovery**
   - Use CloudFormation stack sets to deploy identical standby stack in us-west-2
   - Ensure the secondary region can serve as failover if entire us-east-1 region fails

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Amazon Aurora PostgreSQL** for database with automated failover
- Use **Amazon ECS Fargate** for containerized application tasks
- Use **Application Load Balancer** for traffic distribution with health checks
- Use **Route 53** for DNS failover routing policy
- Use **CloudWatch** for comprehensive monitoring and alarms
- Use **SNS** for alert notifications
- Use **KMS** for encryption at rest with customer managed keys
- Use **VPC** spanning 3 AZs with public subnets for ALB and private subnets for ECS/RDS
- Use **NAT Gateway** in each AZ for high availability
- Use **Systems Manager Parameter Store** for configuration management
- Use **CloudFormation Stack Sets** for multi-region deployment
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: !Sub 'resource-name-${EnvironmentSuffix}'
- Deploy to **us-east-1** region across 3 availability zones
- All data encrypted at rest using AWS KMS customer managed keys

### Constraints

- RDS instances must use Aurora PostgreSQL engine with automated failover
- RDS read replicas must be in different availability zones than primary instance
- Use BackupRetentionPeriod: 1 (minimum) for faster Aurora provisioning in testing
- ECS tasks must be distributed across at least 3 availability zones
- ECS service must maintain exactly 6 running tasks at all times
- ECS rolling update must have minimum healthy percent of 100
- Application Load Balancer health checks must run every 5 seconds
- CloudWatch alarms must trigger within 60 seconds of any service degradation
- Route 53 health checks must use failover routing policy with 30-second TTL
- All resources must be destroyable (use DeletionPolicy: Delete or omit policy)
- RDS clusters must use DeletionPolicy: Delete and DeletionProtection: false
- Include proper error handling and logging throughout
- No hardcoded environment names (prod, dev, staging)
- Do NOT create GuardDuty detector (account-level service limitation)

### Known Service Considerations

- Aurora Multi-AZ clusters take 20-30 minutes to provision
- NAT Gateway costs approximately $0.045/hour per gateway
- For cost optimization in test environment, consider using single NAT Gateway instead of one per AZ
- Prefer VPC Endpoints for S3 and DynamoDB to reduce NAT Gateway usage
- If using Lambda with Node.js 18.x+, use AWS SDK v3 (SDK v2 not available by default)

## Success Criteria

- **Functionality**: Infrastructure survives single AZ failure without downtime
- **Performance**: Health checks detect failures within 5 seconds, alarms trigger within 60 seconds
- **Reliability**: System automatically maintains exactly 6 ECS tasks during failures
- **Security**: All data encrypted at rest with KMS customer managed keys
- **Monitoring**: CloudWatch dashboard shows real-time failover metrics and health status
- **Resource Naming**: All named resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly deleted (no Retain policies)
- **Multi-Region**: Standby stack deployable to us-west-2 via CloudFormation Stack Sets
- **Code Quality**: Valid CloudFormation JSON, well-structured, properly documented

## What to deliver

- Complete CloudFormation JSON template (TapStack.json)
- Aurora PostgreSQL cluster with 1 writer and 2 readers across different AZs
- ECS Fargate service with 6 tasks distributed across 3 AZs
- Application Load Balancer with target group health checks
- Route 53 failover routing configuration
- Auto Scaling policies maintaining exactly 6 tasks
- CloudWatch alarms for RDS failover, ECS failures, ALB unhealthy targets
- SNS topic with email subscription for alerts
- CloudWatch dashboard with real-time failover metrics
- KMS customer managed key for encryption
- VPC with 3 AZs, public subnets for ALB, private subnets for ECS and RDS
- NAT Gateways for high availability
- Systems Manager Parameter Store integration
- CloudFormation Stack Sets configuration for us-west-2 deployment
- Comprehensive integration tests covering failover scenarios
- Documentation with deployment instructions

## Deployment Requirements (CRITICAL)

1. **environmentSuffix Parameter**: MANDATORY for all named resources
   - Pattern: !Sub 'resource-name-${EnvironmentSuffix}'
   - Example: BucketName: !Sub 'data-bucket-${EnvironmentSuffix}'
   - This prevents resource name collisions in parallel deployments

2. **Destroyability**: MANDATORY for automated testing
   - Use DeletionPolicy: Delete or omit (defaults to Delete)
   - For RDS: DeletionPolicy: Delete AND DeletionProtection: false
   - NO DeletionPolicy: Retain allowed (blocks cleanup)
   - All resources must be cleanly destroyable

3. **Service Limitations**:
   - GuardDuty: Do NOT create detector (one per account/region only)
   - AWS Config: Use 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole' for IAM policy
   - Lambda Node.js 18+: Use AWS SDK v3 (@aws-sdk/client-*), v2 not available
