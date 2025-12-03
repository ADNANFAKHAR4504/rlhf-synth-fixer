Hey team,

We've got an exciting project for a fintech startup that needs to deploy their fraud detection API. This is a real-time transaction processing system that needs to be fast and reliable while meeting PCI DSS compliance standards. The business is concerned about handling variable traffic patterns throughout the day, and they absolutely need low-latency response times since every millisecond counts when detecting fraudulent transactions.

The infrastructure needs to be built using **CDKTF with Python** as that's what the team has standardized on. We're looking at a fairly comprehensive setup here - it's not just a simple API deployment, but a full production-grade system with proper networking, security, monitoring, and auto-scaling capabilities.

One thing that's really important is that all our resources need to include an environment_suffix parameter in their names. This is critical for our multi-environment deployment strategy, so we can run dev, staging, and production in the same AWS account without conflicts. Also, everything needs to be destroyable - no deletion protection or retain policies. We need to be able to tear down and rebuild environments quickly for testing.

## What we need to build

Create a fraud detection API infrastructure using **CDKTF with Python** that processes transaction data in real-time with low-latency response times while maintaining PCI DSS compliance standards.

### Core Requirements

1. **VPC and Network Configuration**
   - VPC with 3 availability zones for high availability
   - Public subnets for Application Load Balancer
   - Private subnets for ECS tasks and Aurora database
   - NAT Gateway for outbound internet access from private subnets
   - VPC flow logs stored in S3 with lifecycle policies

2. **ECS Fargate Cluster**
   - Task definition for fraud-api container using image: fraud-api:latest
   - Resource allocation: 1 vCPU, 2GB memory
   - Auto-scaling configured to scale based on CPU utilization above 70%

3. **Application Load Balancer**
   - Deployed in public subnets across availability zones
   - Path-based routing to /api/* endpoints
   - SSL/TLS certificates managed via AWS Certificate Manager
   - Support for blue-green deployment capability

4. **API Gateway**
   - REST API with usage plans for rate limiting
   - API key authentication for secure access
   - Request throttling configured at 1000 requests/second per API key
   - WAF web ACL attached for additional security

5. **Aurora Serverless v2 PostgreSQL**
   - Serverless configuration with Min 0.5 ACUs, Max 4 ACUs
   - Automated backups enabled
   - Encryption at rest for PCI DSS compliance
   - Deployed in private subnets only

6. **Secrets Manager**
   - Secure storage for database credentials
   - API configuration storage
   - 30-day automatic rotation configured

7. **CloudWatch Monitoring**
   - Dashboards showing API response times, error rates, and database connections
   - Alarms configured for API latency exceeding 200ms, ECS task health, and Aurora connections
   - CloudWatch Logs integration for application logging
   - X-Ray tracing enabled for distributed tracing

8. **WAF Configuration**
   - Rate-based rules to prevent DDoS attacks
   - Geo-blocking for high-risk countries
   - SQL injection and XSS protection rules

9. **IAM Security**
   - Least privilege access roles for all services
   - ECS task role with permissions for Secrets Manager and Aurora access
   - Proper service-linked roles configuration

10. **Auto-Scaling Policies**
    - Handle variable traffic patterns throughout the day
    - Scale up quickly during peak hours
    - Scale down during low-traffic periods to optimize costs

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS VPC for network isolation
- Use ECS Fargate for container orchestration
- Use Application Load Balancer for traffic distribution
- Use API Gateway for API management and throttling
- Use Aurora Serverless v2 PostgreSQL for database
- Use Secrets Manager for credential management
- Use CloudWatch and X-Ray for monitoring and tracing
- Use WAF for web application firewall
- Use IAM for access control
- Use AWS Certificate Manager for SSL/TLS certificates
- Use S3 for VPC flow logs storage
- Resource names must include environment_suffix for uniqueness
- Follow naming convention: f"{resource_type}_{environment_suffix}"
- Deploy to us-east-1 region
- Use CDKTF constructs to organize related resources logically

### Deployment Requirements (CRITICAL)

- All resources must include environment_suffix parameter in their names
- This ensures multi-environment deployment capability (dev, staging, prod)
- All resources must be destroyable - no deletion protection
- No RETAIN policies on any resources
- Infrastructure must support rapid teardown and rebuild for testing
- Use appropriate removal policies to allow complete stack deletion

### Constraints

- Must meet PCI DSS compliance standards for payment card data
- API latency must be under 200ms for 99th percentile
- System must handle variable traffic patterns with auto-scaling
- All data must be encrypted at rest and in transit
- Database must be deployed in private subnets only
- No public internet access to database or ECS tasks
- All resources must be destroyable without manual intervention
- Include proper error handling and logging throughout

## Success Criteria

- Functionality: Complete fraud detection API infrastructure deployed and operational
- Performance: API response times under 200ms, auto-scaling handles traffic spikes
- Reliability: Multi-AZ deployment, automated backups, health checks configured
- Security: PCI DSS compliant, encrypted data, WAF protection, least privilege IAM
- Resource Naming: All resources include environment_suffix parameter
- Code Quality: Clean Python code using CDKTF, well-tested, fully documented

## What to deliver

- Complete CDKTF Python implementation with proper project structure
- VPC with public/private subnets across 3 availability zones
- ECS Fargate cluster with auto-scaling fraud-api service
- Application Load Balancer with SSL/TLS and path-based routing
- API Gateway with throttling and WAF integration
- Aurora Serverless v2 PostgreSQL in private subnets
- Secrets Manager for credential management
- CloudWatch dashboards, alarms, logs, and X-Ray tracing
- WAF rules for rate limiting, geo-blocking, SQL injection, and XSS protection
- IAM roles following least privilege principle
- Unit tests for all infrastructure components
- Documentation including deployment instructions and architecture overview
- Outputs for API Gateway endpoint URL, ALB DNS name, and CloudWatch dashboard URL
