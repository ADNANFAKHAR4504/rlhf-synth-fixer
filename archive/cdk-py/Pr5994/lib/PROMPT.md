Hey team,

We need to build a production-grade three-tier web application infrastructure for a media streaming company that serves video content to millions of users globally. I've been asked to create this using **AWS CDK with Python**, and it needs to be highly available, auto-scaling, and optimized for content delivery.

The business context here is pretty critical. We're dealing with a media streaming platform that needs to handle massive traffic spikes when popular content drops, maintain sub-second response times for API requests, and deliver static assets efficiently through a global CDN. The application has a React frontend, Python Flask backend API, and PostgreSQL database, all of which need to scale independently based on load.

The architecture needs to be resilient across multiple availability zones, with automated health monitoring and scaling policies that can respond to traffic patterns. We also need to ensure that database credentials are securely managed with rotation capabilities, and that all logs are centralized for debugging and compliance purposes.

## What we need to build

Create a complete three-tier web application infrastructure using **AWS CDK with Python** that deploys a containerized React frontend, Python Flask backend, and Aurora PostgreSQL database with automated scaling, content delivery optimization, and comprehensive monitoring.

### Core Requirements

1. **Network Foundation**
   - VPC with 6 subnets across 3 availability zones (3 public, 3 private)
   - NAT Gateways for outbound internet access from private subnets
   - Proper security groups for each tier with least privilege access
   - Network ACLs for additional security layer

2. **Container Platform**
   - ECS Fargate cluster for serverless container orchestration
   - Two containerized services: React frontend and Python Flask backend
   - Task definitions with appropriate CPU and memory allocations
   - Blue-green deployment capability using ECS service updates
   - Health checks on /health endpoint every 30 seconds

3. **Load Balancing and Routing**
   - Application Load Balancer in public subnets
   - Path-based routing: /api/* routes to backend, /* routes to frontend
   - Target groups for frontend and backend services
   - Health check integration with ECS services
   - SSL/TLS termination at ALB (if certificates available)

4. **Database Tier**
   - RDS Aurora PostgreSQL cluster with one writer and one reader instance
   - Deployed in private subnets for security
   - Database credentials stored in AWS Secrets Manager
   - Automatic credential rotation enabled
   - Encryption at rest enabled
   - Automated backups configured

5. **API Gateway Integration**
   - API Gateway as the entry point for all requests
   - Integration with Application Load Balancer
   - Request throttling: 1000 requests per minute per IP
   - CORS configuration for cross-origin requests
   - API keys or usage plans for rate limiting

6. **Content Delivery**
   - CloudFront distribution with ALB as origin
   - Caching policies optimized for static assets
   - Custom error pages for 4xx and 5xx errors
   - Origin shield for additional caching layer
   - Compression enabled for improved performance

7. **Auto-Scaling Configuration**
   - ECS service auto-scaling for both frontend and backend
   - Target tracking scaling policy based on CPU utilization
   - Scale between 2-10 tasks per service
   - Scale-out when CPU > 70%, scale-in when CPU < 30%
   - Cooldown periods to prevent thrashing

8. **Container Registry**
   - ECR repositories for storing Docker images
   - Separate repositories for frontend and backend
   - Image scanning enabled for vulnerability detection
   - Lifecycle policies to retain only last 10 images
   - Immutable tags enabled for production images

9. **IAM Security**
   - Task execution roles for ECS tasks to pull images and logs
   - Task roles for application permissions (database access, secrets)
   - Service roles for auto-scaling and load balancing
   - Least privilege principle applied throughout
   - No hardcoded credentials anywhere

10. **Monitoring and Observability**
    - CloudWatch dashboards with key metrics:
      - Response time (p50, p95, p99)
      - Error rate by service
      - Database connection count and query performance
      - ECS task count and CPU/memory utilization
      - ALB request count and target health
    - CloudWatch Logs with 30-day retention
    - Log groups for each ECS service
    - Centralized logging from all components

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **ap-southeast-1** region
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: `resource-type-{environment_suffix}`
- Use AWS Fargate instead of EC2 instances for ECS
- Store configuration values in AWS Systems Manager Parameter Store
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Implement proper error handling and retry logic
- Enable encryption in transit and at rest where applicable

### Specific Constraints

- Container orchestration MUST use AWS Fargate (not EC2)
- Database credentials MUST be in AWS Secrets Manager with rotation
- ALB health checks MUST run every 30 seconds on /health endpoint
- CloudFront MUST have custom error pages for 4xx/5xx
- ECR MUST scan images for vulnerabilities
- API Gateway throttling MUST limit to 1000 requests/minute/IP
- All logs MUST be in CloudWatch Logs with 30-day retention
- Blue-green deployment capability MUST be enabled
- Parameter Store MUST be used for non-sensitive config
- Infrastructure MUST span exactly 3 availability zones

## Success Criteria

- **Functionality**: All components deploy successfully and communicate properly
- **Scalability**: ECS services scale between 2-10 tasks based on CPU load
- **Performance**: CloudFront caching reduces backend load by >50%
- **Reliability**: Multi-AZ deployment with automatic failover
- **Security**: Secrets in Secrets Manager, encryption enabled, least privilege IAM
- **Resource Naming**: All resources include environment_suffix in names or tags
- **Monitoring**: CloudWatch dashboard shows all critical metrics
- **Destroyability**: Complete stack teardown possible for CI/CD
- **Code Quality**: Clean Python code, well-structured, documented

## What to deliver

- Complete AWS CDK Python implementation in tap_stack.py
- Network stack: VPC, subnets, NAT gateways, security groups
- Compute stack: ECS Fargate cluster, task definitions, services
- Database stack: Aurora PostgreSQL cluster with read replicas
- API Gateway with throttling and CORS
- Application Load Balancer with path-based routing
- CloudFront distribution with caching policies
- ECR repositories with lifecycle policies
- Auto-scaling policies for ECS services
- CloudWatch dashboards and log groups
- IAM roles following least privilege
- Stack outputs: CloudFront URL, API Gateway endpoint, RDS endpoint
- Comprehensive unit tests with high coverage
- Integration tests using cfn-outputs/flat-outputs.json
- Documentation in README.md

All code must be production-ready, follow AWS best practices, and be fully compatible with the CI/CD pipeline for automated testing and deployment.
