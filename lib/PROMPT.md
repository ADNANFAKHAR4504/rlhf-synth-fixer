Hey team,

We need to build a comprehensive multi-service containerized application orchestration system on Amazon ECS. The business wants a production-ready microservices platform that can handle multiple containerized services with intelligent load balancing, automatic service discovery, and robust monitoring. This is for a trading platform that needs to orchestrate api-gateway, order-processor, and market-data services with high reliability.

We've been seeing challenges with manual container orchestration and service communication. The business needs an automated solution that can scale services independently based on demand, route traffic intelligently, and provide deep visibility into service health and distributed request flows. They specifically want to leverage ECS with Fargate for serverless container management while maintaining the flexibility to optimize costs with Fargate Spot.

The infrastructure needs to support both steady-state operations and burst workloads, with auto-scaling that responds to actual application metrics. Service-to-service communication must be seamless using DNS-based service discovery, and we need comprehensive observability including Container Insights, CloudWatch dashboards, and X-Ray distributed tracing.

## What we need to build

Create a multi-service ECS orchestration platform using AWS CDK with TypeScript for containerized microservices deployment.

### Core Requirements

1. ECS Cluster Configuration
   - Define an ECS cluster with capacity providers
   - Configure both AWS Fargate and Fargate Spot capacity providers
   - Set up capacity provider strategies for cost optimization (1:4 ratio with base of 1 on FARGATE)
   - Enable CloudWatch Container Insights at cluster level
   - Resource names must include environmentSuffix parameter

2. Microservices Task Definitions
   - Create three separate ECS task definitions: api-gateway, order-processor, market-data
   - Configure each task with appropriate CPU (256) and memory (512 MB) allocations
   - Use nginx 1.25-alpine from AWS Public ECR registry (`public.ecr.aws/nginx/nginx:1.25-alpine`)
   - Configure nginx to listen on port 8080 via container command
   - Set up environment variables (SERVICE_NAME) for each container
   - Configure CloudWatch Logs for each container with 7-day retention
   - Enable X-Ray daemon sidecar containers (32 CPU, 128 MB) for distributed tracing
   - Configure container health checks using wget to verify nginx availability

3. Application Load Balancer Integration
   - Create an internet-facing Application Load Balancer for external traffic
   - Configure target groups for the api-gateway service on port 8080
   - Implement path-based routing rules to route traffic to api-gateway (paths: '/api/*' and '/')
   - Set up health checks on path '/' with appropriate thresholds (2 healthy, 3 unhealthy)
   - Configure security groups for ALB (HTTP port 80) and ECS tasks (port 8080)
   - Set deregistration delay to 30 seconds

4. Service Discovery with AWS Cloud Map
   - Set up AWS Cloud Map private DNS namespace (`services-{environmentSuffix}.local`)
   - Register each microservice with Cloud Map for DNS-based service discovery
   - Configure DNS-based service discovery for inter-service communication
   - Set DNS TTL to 30 seconds for responsive service discovery

5. Auto-Scaling Policies
   - Implement ECS service auto-scaling for each microservice
   - Configure target tracking scaling based on CPU utilization (target 70%)
   - Configure target tracking scaling based on memory utilization (target 80%)
   - Define minimum capacity (1 task) and maximum capacity (10 tasks) for each service
   - Configure scale-in and scale-out cooldown periods (60 seconds each)

6. Container Image Management
   - Use nginx 1.25-alpine from AWS Public ECR registry for all application containers
   - No ECR repositories required - using public container images
   - Configure containers to listen on port 8080 via startup command
   - Implement container health checks using wget command

7. CloudWatch Container Insights
   - Enable CloudWatch Container Insights at cluster level
   - Configure enhanced monitoring for detailed metrics collection
   - Set up log aggregation for all container logs with appropriate retention
   - Application logs: 7-day retention
   - X-Ray daemon logs: 3-day retention

8. IAM Roles and Permissions
   - Create task execution roles with permissions for CloudWatch Logs write
   - Grant AWS Secrets Manager access for sensitive data (GetSecretValue, DescribeSecret)
   - Set up task roles with least-privilege permissions:
     - X-Ray permissions for trace data submission (PutTraceSegments, PutTelemetryRecords)
     - CloudWatch metrics permissions (PutMetricData)
   - No ECR permissions required (using public images)

9. Circuit Breaker Pattern
   - Implement ECS deployment circuit breaker configuration
   - Configure rollback on deployment failures
   - Set deployment configuration: 50% minimum healthy, 200% maximum percent
   - Configure health check grace period of 120 seconds for container startup

10. CloudWatch Dashboards
    - Create comprehensive CloudWatch dashboards
    - Display ALB metrics (request count, target response time)
    - Show target group health metrics (healthy/unhealthy host counts)
    - Visualize per-service CPU and memory utilization
    - Include real-time service health metrics

11. X-Ray Distributed Tracing
    - Configure X-Ray daemon sidecar containers in all task definitions
    - Use `amazon/aws-xray-daemon:latest` image
    - Configure daemon to listen on UDP port 2000
    - Set up X-Ray SDK integration configuration via environment variables
    - Configure appropriate log retention for X-Ray daemon logs (3 days)

### Technical Requirements

- All infrastructure defined using AWS CDK with TypeScript
- Use Amazon ECS for container orchestration
- Use Amazon ECS Fargate for serverless container management
- Use Elastic Load Balancing (Application Load Balancer) for traffic distribution
- Use AWS Cloud Map for service discovery
- Use CloudWatch for monitoring and Container Insights
- Use Application Auto Scaling for ECS services
- Use AWS IAM for access management
- Use AWS Secrets Manager for secrets management
- Use AWS X-Ray for distributed tracing
- Use public container images from AWS Public ECR (no ECR repositories needed)
- Deploy to us-east-1 region (configurable via environment variable)
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: {resource-type}-{service-name}-{environmentSuffix}
- All resources must be fully destroyable (no DeletionPolicy: Retain or RemovalPolicy.RETAIN)

### Network Configuration

- VPC with 2 public subnets (one per availability zone)
- No NAT Gateways (cost optimization - using public subnets for Fargate)
- ALB in public subnets with internet-facing configuration
- Security groups configured for:
  - ALB: Allow HTTP (port 80) from anywhere
  - ECS tasks: Allow port 8080 from ALB, allow all TCP for inter-service communication

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix parameter in their names
- Resource naming pattern: {resource-type}-{service-name}-{environmentSuffix}
- Example: ecs-cluster-dev123, svc-api-gateway-dev123, alb-dev123
- All resources MUST use RemovalPolicy.DESTROY for CDK constructs
- No DeletionPolicy: Retain policies allowed in any resource
- Stack must be completely destroyable without manual cleanup
- Stack outputs must include: LoadBalancerDNS, ClusterName, NamespaceName

### Constraints

- Use Fargate launch type for serverless container management
- Use public subnets only (no NAT gateways for cost optimization)
- Configure security groups following least-privilege principles
- Ensure all container logs are sent to CloudWatch Logs with appropriate retention
- Set appropriate resource limits to prevent runaway costs
- Use secrets for sensitive configuration (database credentials, API keys)
- Include proper error handling and retry logic in service configurations
- Implement health checks at multiple levels:
  - Container health checks using wget (30s interval, 5s timeout, 3 retries, 60s start period)
  - ALB target group health checks on path '/' (30s interval, 2 healthy/3 unhealthy thresholds)
  - Health check grace period of 120 seconds
- Configure proper IAM roles with minimal required permissions
- All resources must be tagged appropriately for cost tracking

## Success Criteria

- Functionality: All three microservices deployed and communicating through service discovery
- Functionality: API gateway accessible through ALB with path-based routing working
- Functionality: Nginx containers running and responding on port 8080
- Performance: Auto-scaling responds to load within 2 minutes
- Performance: Service-to-service communication latency under 100ms
- Reliability: Circuit breaker prevents cascading failures during deployments
- Reliability: Health checks automatically remove unhealthy tasks
- Reliability: Health check grace period allows containers to start properly
- Security: All secrets managed through AWS Secrets Manager
- Security: Task execution roles follow least-privilege principle
- Monitoring: Container Insights provides cluster-level metrics
- Monitoring: CloudWatch dashboards show real-time service health
- Monitoring: X-Ray traces show complete request paths across services
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: TypeScript code with proper type definitions
- Code Quality: Comprehensive unit tests with at least 80% coverage
- Code Quality: Integration tests validating deployed infrastructure
- Code Quality: Clear documentation for deployment and operations

## What to deliver

- Complete AWS CDK TypeScript implementation with all resources
- ECS cluster with Fargate and Fargate Spot capacity providers
- Three microservices with separate task definitions using nginx containers
- Application Load Balancer with path-based routing configuration
- AWS Cloud Map namespace and service discovery setup
- Auto-scaling policies based on CPU and memory utilization
- CloudWatch Container Insights configuration
- IAM roles with appropriate permissions for task execution and application needs
- Circuit breaker deployment configuration with health check grace period
- CloudWatch dashboards with service health metrics
- X-Ray tracing configuration with daemon sidecars
- Comprehensive unit tests for all CDK constructs
- Integration tests for deployed infrastructure validation
- Documentation including deployment instructions and architecture overview
- Stack outputs: LoadBalancerDNS, ClusterName, NamespaceName