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
   - Set up capacity provider strategies for cost optimization
   - Resource names must include environmentSuffix parameter

2. Microservices Task Definitions
   - Create three separate ECS task definitions: api-gateway, order-processor, market-data
   - Configure each task with appropriate CPU and memory allocations
   - Define container configurations including image references from ECR
   - Set up environment variables and secrets management integration
   - Configure CloudWatch Logs for each container
   - Enable X-Ray daemon sidecar containers for distributed tracing

3. Application Load Balancer Integration
   - Create an Application Load Balancer for external traffic
   - Configure target groups for the api-gateway service
   - Implement path-based routing rules to route traffic to api-gateway
   - Set up health checks with appropriate thresholds
   - Configure security groups for ALB and ECS tasks

4. Service Discovery with AWS Cloud Map
   - Set up AWS Cloud Map private DNS namespace
   - Create service discovery services for each microservice
   - Configure DNS-based service discovery for inter-service communication
   - Enable service health checking through Cloud Map

5. Auto-Scaling Policies
   - Implement ECS service auto-scaling for each microservice
   - Configure target tracking scaling based on CPU utilization (target 70%)
   - Set up custom metric-based scaling policies
   - Define minimum and maximum task counts for each service
   - Configure scale-in and scale-out cooldown periods

6. ECR Repository Management
   - Create Amazon ECR repositories for each microservice
   - Implement lifecycle policies to retain only the last 10 images
   - Configure repository policies for secure image access
   - Set up image scanning on push for vulnerability detection

7. CloudWatch Container Insights
   - Enable CloudWatch Container Insights at cluster level
   - Configure enhanced monitoring for detailed metrics collection
   - Set up log aggregation for all container logs
   - Create metric filters for custom application metrics

8. IAM Roles and Permissions
   - Create task execution roles with permissions for ECR image pull
   - Grant CloudWatch Logs write permissions
   - Configure AWS Secrets Manager access for sensitive data
   - Set up task roles with least-privilege permissions for application needs
   - Enable X-Ray daemon permissions for trace data submission

9. Circuit Breaker Pattern
   - Implement ECS deployment circuit breaker configuration
   - Configure rollback on deployment failures
   - Set failure thresholds for automatic rollback
   - Enable deployment alarms integration

10. CloudWatch Dashboards
    - Create comprehensive CloudWatch dashboards
    - Display service health metrics (CPU, memory, task count)
    - Show request latency percentiles (p50, p90, p99)
    - Visualize error rates and HTTP status code distributions
    - Include ALB target health and request count metrics

11. X-Ray Distributed Tracing
    - Configure X-Ray daemon sidecar containers in task definitions
    - Set up X-Ray sampling rules for trace collection
    - Enable X-Ray SDK integration configuration via environment variables
    - Create service map for visualizing microservices interactions

### Technical Requirements

- All infrastructure defined using AWS CDK with TypeScript
- Use Amazon ECS for container orchestration
- Use Amazon ECR for container image registry
- Use Elastic Load Balancing (Application Load Balancer) for traffic distribution
- Use AWS Cloud Map for service discovery
- Use CloudWatch for monitoring and Container Insights
- Use Application Auto Scaling for ECS services
- Use AWS IAM for access management
- Use AWS Secrets Manager for secrets management
- Use AWS X-Ray for distributed tracing
- Deploy to us-east-1 region
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: {resource-type}-{service-name}-{environmentSuffix}
- All resources must be fully destroyable (no DeletionPolicy: Retain or RemovalPolicy.RETAIN)

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix parameter in their names
- Resource naming pattern: {resource-type}-{service-name}-{environmentSuffix}
- Example: ecs-cluster-api-gateway-dev123, ecr-repo-order-processor-dev123
- All resources MUST use RemovalPolicy.DESTROY for CDK constructs
- No DeletionPolicy: Retain policies allowed in any resource
- Stack must be completely destroyable without manual cleanup
- Lambda functions (if used) on Node.js 18+ must explicitly import AWS SDK v3

### Constraints

- Use Fargate launch type for serverless container management
- Implement proper VPC and networking configuration with public and private subnets
- Configure security groups following least-privilege principles
- Ensure all container logs are sent to CloudWatch Logs
- Set appropriate resource limits to prevent runaway costs
- Use secrets for sensitive configuration (database credentials, API keys)
- Include proper error handling and retry logic in service configurations
- Implement health checks at both load balancer and service discovery levels
- Configure proper IAM roles with minimal required permissions
- All resources must be tagged appropriately for cost tracking

## Success Criteria

- Functionality: All three microservices deployed and communicating through service discovery
- Functionality: API gateway accessible through ALB with path-based routing working
- Performance: Auto-scaling responds to load within 2 minutes
- Performance: Service-to-service communication latency under 100ms
- Reliability: Circuit breaker prevents cascading failures during deployments
- Reliability: Health checks automatically remove unhealthy tasks
- Security: All secrets managed through AWS Secrets Manager
- Security: Task execution roles follow least-privilege principle
- Monitoring: Container Insights provides cluster-level metrics
- Monitoring: CloudWatch dashboards show real-time service health
- Monitoring: X-Ray traces show complete request paths across services
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: TypeScript code with proper type definitions
- Code Quality: Comprehensive unit tests with at least 80% coverage
- Code Quality: Clear documentation for deployment and operations

## What to deliver

- Complete AWS CDK TypeScript implementation with all resources
- ECS cluster with Fargate and Fargate Spot capacity providers
- Three microservices with separate task definitions
- Application Load Balancer with path-based routing configuration
- AWS Cloud Map namespace and service discovery setup
- Auto-scaling policies based on CPU and custom metrics
- ECR repositories with lifecycle policies
- CloudWatch Container Insights configuration
- IAM roles with appropriate permissions for task execution
- Circuit breaker deployment configuration
- CloudWatch dashboards with service health metrics
- X-Ray tracing configuration with daemon sidecars
- Comprehensive unit tests for all CDK constructs
- Documentation including deployment instructions and architecture overview