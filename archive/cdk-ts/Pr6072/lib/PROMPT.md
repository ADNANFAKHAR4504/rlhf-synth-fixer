Hey team,

We need to build a containerized order processing system for our logistics company that handles both REST API requests and asynchronous message processing. The business wants this deployed on AWS ECS Fargate with comprehensive monitoring capabilities so our operations team can catch issues before they impact customers.

The system needs to scale automatically based on message queue depth, and we need to ensure high availability across multiple zones. Our operations team has been burned by service outages in the past, so they're insisting on proper alerting for any service degradation. We're deploying this to the Singapore region (ap-southeast-1) to serve our Asia-Pacific customers.

I've been asked to create this using CDK with TypeScript since that's what our infrastructure team is standardizing on. The business wants a complete monitoring solution that alerts the team immediately when things go wrong, not after customers complain.

## What we need to build

Create an ECS Fargate-based order processing system using **CDK with TypeScript** that includes both application infrastructure and comprehensive operational monitoring.

### Core Infrastructure Requirements

1. **ECS Cluster and Services**
   - Define an ECS cluster with Fargate capacity providers
   - Create two services: api-service for REST endpoints and worker-service for queue processing
   - Configure task definitions with 512 CPU units and 1024 MiB memory for each service
   - Implement task placement to spread across availability zones

2. **Load Balancing and Routing**
   - Set up an Application Load Balancer with path-based routing
   - Route /api/* requests to api-service
   - Configure health checks using ELB target group health checks

3. **Message Queue Infrastructure**
   - Create SQS queues named order-queue and order-dlq
   - Configure message retention of 4 days
   - Set up each service with its own dedicated queue and dead letter queue

4. **Auto-scaling Configuration**
   - Configure auto-scaling for worker-service based on SQS queue depth
   - Scale up when queue reaches 10 messages
   - Scale down when queue drops to 2 messages
   - Base scaling on ApproximateNumberOfMessagesVisible metric

5. **Service Discovery**
   - Implement ECS service discovery using Cloud Map
   - Enable inter-service communication

6. **Logging Infrastructure**
   - Configure CloudWatch Log Groups with /ecs/ prefix
   - Set 7-day retention for all logs
   - Stream container logs to CloudWatch

7. **Security and Access**
   - Set up IAM roles allowing tasks to read from Parameter Store path /app/config/*
   - Configure private ECR repository access for container images

### Monitoring and Alerting Requirements

8. **CloudWatch Alarms for Load Balancer**
   - Create alarm for unhealthy ALB targets (threshold: 1 unhealthy target)
   - Configure appropriate evaluation periods

9. **CloudWatch Alarms for ECS Services**
   - Alert on high CPU utilization for api-service (threshold: 80%)
   - Alert on high memory utilization for api-service (threshold: 80%)
   - Alert on high CPU utilization for worker-service (threshold: 80%)
   - Alert on high memory utilization for worker-service (threshold: 80%)
   - Alert when no tasks are running for api-service (threshold: < 1)
   - Alert when no tasks are running for worker-service (threshold: < 1)

10. **CloudWatch Alarms for Queue Processing**
    - Alert when messages land in dead letter queue (threshold: 1 message)

11. **SNS Topic for Centralized Alerting**
    - Create SNS topic with environmentSuffix in name: order-processing-alerts-{environmentSuffix}
    - Configure all CloudWatch alarms to publish to this SNS topic
    - Support email subscription configuration for post-deployment setup

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use ECS Fargate launch type exclusively (no EC2 instances)
- Container images pulled from private ECR repositories only
- Secrets must be fetched from AWS Systems Manager Parameter Store
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to ap-southeast-1 region
- Services distributed across at least 2 availability zones

### Constraints

- Task definitions must specify both CPU and memory limits explicitly
- All containers must use Parameter Store for secrets at path /app/config/*
- Auto-scaling must trigger on SQS metrics only
- Health checks must use ELB target group checks, not ECS service checks
- CloudWatch Logs retention must be exactly 7 days
- All alarms must use appropriate evaluation periods and data points
- SNS topic must support email subscriptions
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging

## Success Criteria

- Functionality: Two ECS services deployed on Fargate with auto-scaling, load balancing, and service discovery
- Performance: Auto-scaling responds to queue depth changes within evaluation period
- Reliability: Services spread across multiple AZs with health monitoring
- Security: IAM roles properly scoped, secrets from Parameter Store, private ECR access
- Monitoring: Six CloudWatch alarms configured for critical metrics
- Alerting: SNS topic receives alarm notifications and supports email subscriptions
- Resource Naming: All resources include environmentSuffix variable
- Code Quality: TypeScript code, well-tested, documented, passes CDK synth

## What to deliver

- Complete CDK TypeScript stack implementation
- ECS cluster with Fargate capacity providers
- Application Load Balancer with path-based routing
- Two ECS services (api-service and worker-service)
- SQS queues (order-queue and order-dlq) with 4-day retention
- Auto-scaling policies based on SQS metrics
- CloudWatch Log Groups with 7-day retention
- Six CloudWatch alarms monitoring critical service metrics
- SNS topic for centralized alerting
- IAM roles for Parameter Store access
- Service discovery namespace using Cloud Map
- Unit tests for all infrastructure components
- Documentation and deployment instructions
- Stack outputs: ALB DNS name, SQS queue URLs, SNS topic ARN, service discovery namespace
