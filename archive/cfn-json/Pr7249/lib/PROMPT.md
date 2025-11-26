Hey team,

We've got a pretty interesting challenge from a fintech startup that needs to deploy their microservices on AWS with blue-green deployment capabilities. They're processing sensitive financial transactions, so we need to be really careful about network isolation, automated scaling, and seamless rollback mechanisms. I've been asked to create this using **CloudFormation with JSON**.

The business is looking for a production-grade setup that can handle their container workloads across multiple availability zones in us-east-1. They want the peace of mind that comes with blue-green deployments so they can push updates without risking downtime on their transaction processing systems.

What makes this interesting is that they need auto-scaling based on both CPU and memory metrics, plus they want automated rollback capabilities if things go sideways during a deployment. They're also very focused on monitoring and alerting, which makes sense given the financial nature of their business.

## What we need to build

Create a complete container orchestration infrastructure using **CloudFormation with JSON** that supports blue-green deployments with automated rollback capabilities for a fintech microservices platform.

### Core Requirements

1. **Blue-Green Deployment Configuration**
   - Each environment should run 3 desired tasks
   - Configure seamless traffic switching between environments

2. **Load Balancing and Traffic Management**
   - Set up an Application Load Balancer with two target groups (blue and green)
   - Implement weighted routing to control traffic distribution between blue and green services
   - Configure path-based routing with health check intervals of 15 seconds
   - Set up dedicated target groups for each service with 30-second deregistration delay

3. **Auto-Scaling Configuration**
   - Implement auto-scaling policies that scale between 3-10 tasks
   - Scale based on both CPU utilization (70% threshold) and memory utilization (80% threshold)
   - Ensure scaling policies work independently for both metrics

4. **Monitoring and Alerting**
   - Set up CloudWatch alarms for unhealthy targets
   - Configure SNS notifications when 2 or more tasks fail health checks
   - Enable CloudWatch Container Insights for comprehensive monitoring
   - Stream all container logs to CloudWatch Logs with 30-day retention

5. **Rollback Capabilities**
   - Implement Circuit Breaker settings with 50% rollback threshold
   - Configure 10-minute evaluation period for rollback decisions
   - Ensure automated rollback triggers when health thresholds are breached

6. **Service Discovery**
   - Configure service discovery using Cloud Map with private DNS namespace
   - Enable inter-service communication through service discovery

7. **Security and Access Management**
   - Create task execution roles with permissions to pull from ECR
   - Grant permissions to write logs to CloudWatch
   - Provide permissions to read secrets from Secrets Manager
   - Configure Network ACLs to explicitly deny all traffic except ports 80, 443, and 8080
   - Secrets must be stored in Secrets Manager and injected as environment variables

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Application Load Balancer** for traffic distribution
- Use **Auto Scaling** for dynamic capacity management
- Use **CloudWatch** for monitoring and logging
- Use **SNS** for notifications
- Use **Cloud Map** for service discovery
- Use **IAM** for roles and permissions
- Use **Secrets Manager** for secret storage
- Deploy to **us-east-1** region across 3 availability zones
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- All resources must be destroyable (no Retain deletion policies, no deletion protection)

### Platform-Specific Constraints

- Task definitions must specify both CPU and memory limits with at least 1 vCPU (1024 CPU units) and 2GB RAM (2048 memory units)
- VPC must be configured with public subnets for ALB and private subnets for EC2 tasks
- NAT Gateways required for outbound internet access from containers
- Network ACLs must explicitly deny all traffic except ports 80, 443, and 8080
- All container logs streamed to CloudWatch Logs with 30-day retention
- Secrets stored in Secrets Manager and injected as environment variables

### Deployment Requirements (CRITICAL)

- All named resources MUST include the environmentSuffix parameter for uniqueness
- No DeletionPolicy: Retain or UpdateReplacePolicy: Retain allowed
- No deletion protection on any resources
- All resources must be fully destroyable via stack deletion
- Include proper error handling and validation

## Success Criteria

- Functionality: Complete blue-green deployment capability with automated traffic switching
- Performance: Auto-scaling responds to both CPU (70%) and memory (80%) thresholds within expected timeframes
- Reliability: Circuit breaker triggers rollback at 50% unhealthy threshold within 10-minute evaluation window
- Security: Network isolation enforced, secrets properly managed, IAM roles follow least privilege
- Resource Naming: All resources include environmentSuffix parameter in their names
- Monitoring: CloudWatch alarms trigger SNS notifications when 2+ tasks fail health checks
- Service Discovery: Services can communicate through private DNS namespace
- Code Quality: Valid CloudFormation JSON, well-structured, documented with inline comments

## What to deliver

- Complete CloudFormation template in JSON format
- VPC with public and private subnets across 3 availability zones
- NAT Gateways for outbound connectivity
- Application Load Balancer with listener rules
- Two target groups for blue-green deployments
- EC2 task definitions with proper resource limits
- EC2 services with auto-scaling configurations
- Auto-scaling policies for CPU and memory metrics
- CloudWatch alarms with SNS topic integration
- Service discovery namespace and service configurations
- IAM roles for task execution with appropriate permissions
- Network ACLs with port restrictions
- Parameters for environmentSuffix
- Outputs for key resource identifiers
