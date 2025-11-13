We need to deploy a containerized Node.js API service with proper load balancing, SSL termination, and auto-scaling capabilities. The startup I'm working with needs this infrastructure to handle variable traffic patterns throughout the day, and they want blue-green deployment capabilities for safer releases.

The application is already containerized and stored in a private ECR repository. What we need now is the infrastructure to run it reliably at scale with HTTPS access through a custom domain. The business is particularly concerned about deployment safety and wants circuit breakers in place to catch bad deployments before they cause issues.

## What we need to build

Create a complete container orchestration infrastructure using **CDKTF with TypeScript** that deploys the Node.js API service on ECS Fargate with proper load balancing and auto-scaling.

### Core Requirements

1. **Container Service**
   - Deploy ECS Fargate service running Node.js application from private ECR repository
   - Configure container with 512 CPU units and 1024 MiB memory
   - Tasks must run in private subnets only for security
   - Stream container logs to CloudWatch Logs for monitoring

2. **Load Balancing and SSL**
   - Set up internet-facing Application Load Balancer with IPv4 addressing
   - Configure HTTPS listener on port 443 with SSL termination
   - Enable ALB deletion protection for production safety
   - Configure ALB access logs to S3 bucket for audit trail

3. **Health Monitoring**
   - Configure health checks with path '/health'
   - Health check interval of 30 seconds
   - Health check must return HTTP 200 within 5 seconds

4. **Auto-Scaling Configuration**
   - Implement target tracking scaling based on CPU utilization
   - Scale up when CPU reaches 70%
   - Scale down when CPU drops to 30%
   - Minimum 2 tasks, maximum 10 tasks
   - Auto-scaling cooldown period must be exactly 300 seconds

5. **Domain and DNS**
   - Create Route53 A record for 'api.example.com' aliased to the ALB
   - Configure SSL certificate using ACM
   - Use DNS validation method through Route53 for certificate validation

6. **Deployment Safety**
   - Enable ECS service circuit breaker for deployment protection
   - Use CDK v2 constructs only

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use Fargate launch type exclusively (no EC2)
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Constraints

- Fargate launch type only for ECS tasks
- ALB must be internet-facing with IPv4 addressing only
- Container image pulled from private ECR repository
- Health check must return HTTP 200 within 5 seconds
- SSL certificate must use DNS validation method
- Auto-scaling cooldown period must be exactly 300 seconds
- ALB deletion protection must be enabled
- ECS tasks must run in private subnets only
- Container logs must stream to CloudWatch Logs
- Stack must use CDK v2 constructs only

## Success Criteria

- **Functionality**: Web application accessible via HTTPS at custom domain
- **Performance**: Auto-scaling responds correctly to CPU thresholds (70% up, 30% down)
- **Reliability**: Minimum 2 tasks always running, circuit breaker catches bad deployments
- **Security**: Tasks in private subnets, SSL enabled, ALB deletion protection active
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript code, well-tested, documented

## What to deliver

- Complete CDKTF TypeScript implementation
- ECS Fargate service with container definition
- Application Load Balancer with HTTPS listener
- Route53 DNS record and ACM certificate with DNS validation
- Auto-scaling policies with target tracking
- S3 bucket for ALB access logs
- CloudWatch Logs configuration
- Unit tests for all components
- Documentation and deployment instructions
