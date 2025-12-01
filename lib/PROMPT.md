# ECS Fargate Batch Processing Infrastructure

Hey team,

We need to modernize our financial services batch processing system by moving it to containers. Right now we're running risk calculations overnight on legacy infrastructure, and we need to get this containerized using ECS Fargate before the next quarter. The business is pushing hard on this because our current system is getting expensive to maintain and doesn't scale well during peak processing periods.

The core problem is that we process massive datasets every night - market data, portfolio positions, risk calculations - and everything must be done before market open at 9:30 AM Eastern. If we miss that window, traders can't see their risk exposures and that's a compliance issue. We also need rock-solid audit logging because regulators review our calculation processes regularly.

I've been tasked with building this using **CloudFormation with JSON** templates. The platform team is standardized on CloudFormation for all infrastructure, so that's non-negotiable. We need everything defined in JSON format for consistency with our existing stacks.

## What we need to build

Create a containerized batch processing system using **CloudFormation with JSON** for running overnight risk calculations on ECS Fargate.

### Core Requirements

1. **ECS Cluster Configuration**
   - ECS cluster with Fargate capacity providers
   - Managed scaling enabled for capacity providers
   - Cluster must support running tasks across multiple availability zones

2. **Three Batch Job Types**
   - Data ingestion task (reads market data from S3, loads into processing queues)
   - Risk calculation task (performs Monte Carlo simulations and VAR calculations)
   - Report generation task (aggregates results and creates PDF reports)
   - Each job type needs its own ECS task definition with specific CPU and memory
   - Task definitions must specify both task-level and container-level resource limits

3. **Container Image Management**
   - ECR repositories for each job type
   - Lifecycle policies to keep only the last 10 images (we deploy frequently)
   - Scan on push enabled for vulnerability detection
   - Container images must be scanned before deployment

4. **Logging and Monitoring**
   - CloudWatch log groups for each task type
   - Logs encrypted with KMS customer-managed keys (compliance requirement)
   - 30-day retention period for audit purposes
   - CloudWatch alarms when task failures exceed 5% over 10 minutes

5. **Service Deployment**
   - ECS services configured with circuit breaker deployment
   - Health check grace period of 120 seconds
   - Services must handle rolling deployments without disrupting running batch jobs

6. **Security and Access Control**
   - Task execution roles with least privilege permissions
   - Roles limited to specific ECR repositories and S3 buckets
   - No broad wildcard permissions

7. **High Availability**
   - Task placement constraints to spread tasks across different availability zones
   - This ensures if one AZ has issues, other jobs can continue

8. **Event-Driven Automation**
   - EventBridge rules to trigger tasks when new data files arrive in S3
   - Automatic job scheduling based on data availability

9. **Auto-Scaling**
   - Service auto-scaling policies targeting 70% CPU utilization
   - 5-minute cooldown period between scaling actions
   - This handles variable workload sizes during month-end processing

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Amazon ECS** with Fargate launch type (platform version 1.4.0 or higher)
- Use **Amazon ECR** for container image storage with lifecycle policies
- Use **Amazon VPC** with 3 private subnets across availability zones
- Use **AWS CloudWatch** for logs, alarms, and metrics with KMS encryption
- Use **AWS KMS** for encryption keys
- Use **AWS IAM** for task execution roles
- Use **Amazon EventBridge** for event-driven triggering
- Use **Amazon S3** for data input/output integration
- Use **Amazon SNS** for job notifications
- Use **Application Auto Scaling** for CPU-based scaling
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Each container must have dedicated CPU and memory with no oversubscription
- ECS tasks must use Fargate launch type exclusively

### Deployment Requirements (CRITICAL)

- All named resources MUST include environmentSuffix parameter for multi-environment support
- All resources must be destroyable (no DeletionPolicy: Retain or TerminationProtection)
- This is a synthetic test environment - everything must be cleanly deletable
- No retention policies that prevent stack deletion
- CloudWatch log groups should allow deletion when stack is removed

### Constraints

- ECS tasks must use Fargate launch type with platform version 1.4.0 or higher
- Each container must have dedicated CPU and memory allocations with no oversubscription
- Task definitions must specify both task-level and container-level resource limits
- All container logs must be encrypted at rest using KMS customer-managed keys
- ECS cluster must use capacity providers with managed scaling enabled
- Container images must be scanned for vulnerabilities using ECR scanning on push
- Must integrate with existing VPC infrastructure (VPC ID will be provided as parameter)
- Must integrate with existing S3 buckets for data storage (bucket names as parameters)
- Circuit breaker deployment must fail fast if tasks can't start successfully
- Task execution roles must follow least privilege - no Administrator or PowerUser policies

## Success Criteria

- Functionality: All three batch job types can run successfully on ECS Fargate
- Functionality: Tasks automatically trigger when data files arrive in S3
- Performance: Jobs complete within allocated time windows before market open
- Reliability: Tasks distributed across multiple AZs for high availability
- Reliability: Circuit breaker prevents bad deployments from disrupting production
- Security: All logs encrypted with KMS, task roles limited to specific resources
- Security: Container images scanned for vulnerabilities before deployment
- Monitoring: CloudWatch alarms trigger when failure rates exceed thresholds
- Scalability: Auto-scaling responds to CPU utilization within 5-minute windows
- Resource Naming: All resources include environmentSuffix for multi-environment deployment
- Code Quality: CloudFormation JSON, well-structured, properly parameterized

## What to deliver

- Complete CloudFormation JSON template implementation
- ECS cluster with Fargate capacity providers
- Three task definitions (data-ingestion, risk-calculation, report-generation)
- ECR repositories with lifecycle policies and scanning enabled
- CloudWatch log groups with KMS encryption
- ECS services with circuit breaker configuration
- Task execution IAM roles with least privilege
- CloudWatch alarms for task failure monitoring
- Task placement constraints for multi-AZ distribution
- EventBridge rules for S3-triggered task execution
- Auto-scaling policies for CPU-based scaling
- Parameters for VPC configuration, S3 buckets, and environmentSuffix
- Stack that can be completely deleted without leaving orphaned resources