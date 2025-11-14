# Single-Region High Availability Infrastructure

## Task Overview

Design and implement a comprehensive **Single-Region High Availability** infrastructure using **AWS CDK with TypeScript** that ensures high availability, business continuity, and automated monitoring capabilities.

## Platform and Language Requirements

- **Platform**: AWS CDK
- **Language**: TypeScript
- **Region**: us-east-1 (configured in `lib/AWS_REGION` file)

## Infrastructure Requirements

### 1. Aurora Database Cluster

Deploy an **Aurora Database Cluster** with the following specifications:

- **Engine**: PostgreSQL 14.x
- **Configuration**:
  - Single cluster in us-east-1 with Multi-AZ deployment
  - Enable automated backtrack with 24-hour window
  - Enable encryption at rest using AWS KMS
  - Enable deletion protection for production
  - One writer and one reader instance for high availability
- **Monitoring**:
  - CloudWatch alarms for CPU, connections, and performance metrics
  - Enhanced monitoring enabled

### 2. ECS Fargate Services

Deploy ECS services in us-east-1:

- **Task Definitions**: Containerized application workloads
- **Configuration**:
  - Fargate launch type (serverless containers)
  - Auto-scaling based on CPU and memory
  - Service discovery using AWS Cloud Map
  - ALB for load balancing across multiple availability zones
  - Container health checks
- **Deployment**:
  - Blue/green deployment strategy
  - Circuit breaker enabled
  - Deployment alarms for rollback

### 3. DynamoDB Table

Implement **DynamoDB Table** for session state:

- **Configuration**:
  - Single region table in us-east-1
  - On-demand billing mode for cost optimization
  - Point-in-time recovery enabled
  - Encryption at rest with AWS managed keys
  - TTL enabled for automatic cleanup
- **Use Case**: Session state storage with automatic scalability

### 4. Route 53 Health Checks and DNS

Configure **Route 53** for DNS resolution:

- **Configuration**:
  - Health checks for ALB endpoint
  - Simple routing policy to ALB
  - Health check monitoring for ECS ALB endpoint
  - Evaluate target health enabled
  - Failure threshold: 3 consecutive failures
  - Request interval: 30 seconds
- **DNS Records**:
  - A record pointing to us-east-1 ALB

### 5. S3 Storage

Implement **S3 Storage** with lifecycle policies:

- **Configuration**:
  - Single bucket in us-east-1
  - Versioning enabled for data protection
  - Encryption at rest with S3-managed keys
  - Lifecycle policies for cost optimization
  - Block public access enabled
  - Auto-delete objects on stack deletion
- **IAM Role**: Proper permissions for application access

### 6. EventBridge Event Bus

Deploy **EventBridge** for event-driven architecture:

- **Configuration**:
  - Event bus in us-east-1
  - Event routing rules for application events
  - Dead letter queue for failed events
  - Event replay capability
- **Use Case**: Event-driven application architecture

### 7. AWS Backup Plans

Implement **AWS Backup** for point-in-time recovery:

- **Configuration**:
  - Backup plans for Aurora, DynamoDB, EBS volumes
  - Single region backups in us-east-1
  - Retention: 7 days (short-term), 30 days (long-term)
  - Backup vault with encryption
  - Backup completion notifications via SNS
- **Resources**: Tag-based backup selection

### 8. CloudWatch Synthetics Canaries

Deploy **CloudWatch Synthetics canaries**:

- **Configuration**:
  - Canaries monitoring application endpoints in us-east-1
  - **Runtime**: Use `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0` (latest stable)
  - Schedule: Run every 5 minutes
  - Failure alarms with SNS notifications
  - Artifact storage in S3
  - Canary monitors: HTTP availability, response time, functional workflows
- **Use Case**: Proactive monitoring and alerting

### 9. Step Functions for Orchestration

Implement **AWS Step Functions** for workflow automation:

- **Workflow**:
  - Health check validation
  - Aurora automated failover (within region)
  - ECS service health monitoring
  - Notification to operations team
- **Configuration**:
  - Error handling and retry logic
  - Integration with CloudWatch alarms
  - Manual approval step for critical operations
- **Triggers**: CloudWatch alarm or manual execution

### 10. Systems Manager Parameter Store

Use **Systems Manager Parameter Store** for configuration:

- **Configuration**:
  - Store application configuration parameters in us-east-1
  - SecureString type for sensitive data
  - KMS encryption
  - Version tracking enabled
- **Use Case**: Centralized configuration management

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

- All infrastructure deploys successfully in us-east-1
- Multi-AZ high availability working correctly
- 100% test coverage achieved
- Health checks and monitoring operational
- Backup and recovery mechanisms functional
- Resources can be destroyed cleanly without errors
