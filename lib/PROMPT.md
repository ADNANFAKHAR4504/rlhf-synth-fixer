# Multi-Region Disaster Recovery Infrastructure

## Task Overview

Design and implement a comprehensive **Multi-Region Disaster Recovery (DR)** infrastructure using **AWS CDK with TypeScript** that ensures high availability, business continuity, and automated failover capabilities across two AWS regions.

## Platform and Language Requirements

- **Platform**: AWS CDK
- **Language**: TypeScript
- **Primary Region**: us-east-1
- **Secondary Region**: us-east-2

## Infrastructure Requirements

### 1. Aurora Global Database

Deploy an **Aurora Global Database** with the following specifications:

- **Engine**: PostgreSQL 14.x
- **Configuration**:
  - Primary cluster in us-east-1
  - Secondary cluster in us-east-2 (read replica)
  - Enable automated backtrack with 24-hour window
  - Enable encryption at rest using AWS KMS
  - Enable deletion protection for production
  - Multi-AZ deployment in both regions
- **Monitoring**:
  - CloudWatch alarms for CPU, connections, replication lag
  - Enhanced monitoring enabled

### 2. ECS Fargate Services

Deploy identical ECS services in both regions:

- **Task Definitions**: Identical across both regions
- **Configuration**:
  - Fargate launch type (serverless containers)
  - Auto-scaling based on CPU and memory
  - Service discovery using AWS Cloud Map
  - ALB for load balancing
  - Container health checks
- **Deployment**:
  - Blue/green deployment strategy
  - Circuit breaker enabled
  - Deployment alarms for rollback

### 3. DynamoDB Global Tables

Implement **DynamoDB Global Tables** for session state:

- **Configuration**:
  - Global table spanning us-east-1 and us-east-2
  - On-demand billing mode for cost optimization
  - Point-in-time recovery enabled
  - Encryption at rest with AWS managed keys
  - TTL enabled for automatic cleanup
- **Use Case**: Session state replication across regions

### 4. Route 53 Health Checks and DNS Failover

Configure **Route 53** for automatic failover:

- **Configuration**:
  - Health checks for both regional endpoints
  - Primary-secondary failover routing policy
  - Health check monitoring for ECS ALB endpoints
  - Evaluate target health enabled
  - Failure threshold: 3 consecutive failures
  - Request interval: 30 seconds
- **DNS Records**:
  - Primary record pointing to us-east-1 ALB
  - Secondary record pointing to us-east-2 ALB

### 5. S3 Cross-Region Replication (CRR)

Implement **S3 Cross-Region Replication** with RTC:

- **Configuration**:
  - Source bucket in us-east-1
  - Destination bucket in us-east-2
  - Replication Time Control (RTC) enabled for 99.99% objects < 15 minutes
  - Versioning enabled on both buckets
  - Delete marker replication enabled
  - Encryption in transit and at rest
  - Replication metrics and notifications
- **IAM Role**: Proper permissions for S3 replication

### 6. EventBridge Global Endpoints

Deploy **EventBridge** for cross-region event routing:

- **Configuration**:
  - Global endpoint configuration
  - Event bus in both regions
  - Cross-region event routing rules
  - Dead letter queue for failed events
  - Event replay capability
- **Use Case**: Distribute events across regions for resilience

### 7. AWS Backup Plans

Implement **AWS Backup** for point-in-time recovery:

- **Configuration**:
  - Backup plans for Aurora, DynamoDB, EBS volumes
  - Cross-region backup copies to secondary region
  - Retention: 7 days (short-term), 30 days (long-term)
  - Backup vault with encryption
  - Backup completion notifications via SNS
- **Resources**: Tag-based backup selection

### 8. CloudWatch Synthetics Canaries

Deploy **CloudWatch Synthetics canaries** in both regions:

- **Configuration**:
  - Canaries monitoring application endpoints in both regions
  - **Runtime**: Use `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0` (latest stable)
  - Schedule: Run every 5 minutes
  - Failure alarms with SNS notifications
  - Artifact storage in S3
  - Canary monitors: HTTP availability, response time, functional workflows
- **Use Case**: Proactive monitoring and alerting

### 9. Step Functions for Failover Orchestration

Implement **AWS Step Functions** for automated failover:

- **Workflow**:
  - Health check validation
  - Aurora failover promotion
  - Route 53 DNS record update
  - ECS service scaling in secondary region
  - Notification to operations team
- **Configuration**:
  - Error handling and retry logic
  - Integration with CloudWatch alarms
  - Manual approval step for critical operations
- **Triggers**: CloudWatch alarm or manual execution

### 10. Systems Manager Parameter Store

Use **Systems Manager Parameter Store** for configuration:

- **Configuration**:
  - Store application configuration parameters
  - Cross-region parameter replication using custom resource or Lambda
  - SecureString type for sensitive data
  - KMS encryption
  - Version tracking enabled
- **Use Case**: Synchronized configuration across regions

## Implementation Requirements

### Resource Naming

- All resources MUST include `environmentSuffix` in their names
- Example: `TapStack${environmentSuffix}Database`, `TapStack${environmentSuffix}ECSService`

### Security

- Enable encryption at rest for all supported services
- Use IAM roles with least privilege principle
- Enable VPC flow logs
- Use security groups with minimal required access
- Enable CloudTrail for audit logging

### Monitoring and Observability

- CloudWatch dashboards for both regions
- Composite alarms for critical services
- SNS topics for alarm notifications
- X-Ray tracing for distributed systems
- Centralized logging to CloudWatch Logs

### Cost Optimization

- Use on-demand pricing for DynamoDB
- Enable S3 lifecycle policies
- Use Fargate Spot where appropriate
- Set CloudWatch Logs retention to 7 days
- Tag all resources for cost allocation

### Testing Requirements

- Create comprehensive unit tests covering all resources
- **Achieve 100% test coverage** (statements, functions, lines)
- Create integration tests using actual deployment outputs
- Test failover procedures
- Validate cross-region replication

## Expected Deliverables

1. **CDK Infrastructure Code**: Complete TypeScript implementation
2. **Unit Tests**: 100% coverage for all infrastructure code
3. **Integration Tests**: Real-world validation using cfn-outputs
4. **Documentation**: Clear explanation of architecture and deployment

## Key Constraints

- DO NOT use deprecated runtimes (e.g., Synthetics Puppeteer 5.1)
- DO NOT hardcode environment names or regions
- DO NOT use `Retain` deletion policies (allow cleanup)
- DO NOT skip the `environmentSuffix` parameter
- Resources must be self-sufficient (no dependencies on pre-existing resources)

## Success Criteria

- All infrastructure deploys successfully in both regions
- Automated failover workflow functions correctly
- 100% test coverage achieved
- Cross-region replication working as expected
- Health checks and monitoring operational
- Resources can be destroyed cleanly without errors
