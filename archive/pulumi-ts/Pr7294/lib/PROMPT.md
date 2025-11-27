Hey team,

We need to build production-ready infrastructure for our new SaaS product launch. The business is launching a real-time web application with live updates via WebSockets, and we need to handle both static content delivery and dynamic API requests efficiently. I've been asked to create this infrastructure using Pulumi with TypeScript in the us-west-2 region.

The product team expects this to support real-time features like live dashboards and collaborative editing, which means we need WebSocket support throughout the stack with proper session affinity. Marketing wants global reach with fast static asset delivery, while engineering needs high availability across multiple zones and a scalable database that won't break the bank.

We're working with a constraint of keeping base infrastructure costs under $500 monthly, so we need to be smart about resource selection. The team also wants ARM-based instances for better price-performance, IAM database authentication for security, and the ability to do blue-green deployments without downtime.

## What we need to build

Create a production-grade web application infrastructure using **Pulumi with TypeScript** that deploys a highly available, cost-optimized system capable of handling real-time WebSocket connections and serving both static and dynamic content globally.

### Core Requirements

1. **Network Infrastructure**
   - VPC spanning 3 availability zones in us-west-2
   - Public subnets for load balancers
   - Private subnets for compute and database resources
   - NAT Gateways for outbound internet access from private subnets

2. **Load Balancing**
   - Application Load Balancer with sticky sessions enabled
   - WebSocket support with session affinity
   - Health checks for target instances
   - SSL/TLS termination

3. **Database Layer**
   - Aurora PostgreSQL Serverless v2 cluster
   - IAM database authentication enabled (no password-based auth)
   - Multi-AZ deployment for high availability
   - Automated backups and point-in-time recovery

4. **Content Delivery**
   - CloudFront distribution with two origins
   - S3 origin for static assets
   - ALB origin for dynamic content
   - Sub-50ms global latency for static content

5. **Compute Resources**
   - EC2 instances in Auto Scaling Groups
   - ARM-based instance types for cost optimization
   - Auto Scaling based on CPU and memory metrics
   - Support for blue-green deployments

6. **Logging and Monitoring**
   - CloudWatch Log Groups with 30-day retention
   - JSON-structured logging format
   - Centralized log aggregation
   - Health check monitoring

7. **DNS and Health Checks**
   - Route 53 health checks configured
   - Automated failover between regions
   - DNS routing policies for high availability

8. **Configuration Management**
   - AWS Systems Manager Parameter Store integration
   - Secure storage for application configuration
   - Environment-specific parameters

9. **Access Control**
   - IAM roles following least-privilege principles
   - Service-specific roles for EC2, RDS, and other services
   - No hard-coded credentials

10. **Resource Protection**
    - Deletion protection on production resources
    - Configurable protection toggle
    - DeletionPolicy set to Delete (resources must be destroyable for testing)

11. **Resource Tagging**
    - Environment tag for all resources
    - Project tag for billing tracking
    - CostCenter tag for departmental allocation
    - Consistent tagging across all infrastructure

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **EC2** for compute workloads
- Use **Application Load Balancer** for request distribution
- Use **Aurora PostgreSQL Serverless v2** for database
- Use **CloudFront** for content delivery
- Use **VPC** spanning three availability zones
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-west-2** region
- All resources must be destroyable (DeletionPolicy: Delete, no Retain policies)

### Constraints

1. All compute resources must use ARM-based instances (Graviton processors) for cost optimization
2. WebSocket connections must maintain session affinity across all load balancer layers
3. Static assets must be served with sub-50ms latency globally via CloudFront
4. Database connections must use IAM authentication instead of password-based auth
5. All logs must be centralized with structured JSON formatting in CloudWatch
6. Infrastructure must support blue-green deployments with zero downtime
7. Total monthly infrastructure cost must not exceed $500 for the base configuration
8. All resources must include proper error handling and logging
9. Security groups must follow least-privilege network access patterns
10. All data at rest and in transit must be encrypted

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resource names must include a configurable environmentSuffix parameter to ensure uniqueness across multiple deployments
- **Destroyability**: All resources MUST use DeletionPolicy: Delete or RemovalPolicy: DESTROY - no Retain policies allowed
- **Region**: All resources must be deployed to us-west-2 region
- **Tagging**: Every resource must include Environment, Project, and CostCenter tags
- **Cost Control**: Base configuration must stay under $500/month - use serverless and ARM instances

## Success Criteria

- **Functionality**: All 11 requirements fully implemented and working
- **Performance**: Static content served globally under 50ms, WebSocket connections maintain affinity
- **Reliability**: Multi-AZ deployment with automated failover and 99.9% uptime SLA
- **Security**: IAM authentication for database, least-privilege roles, encryption everywhere
- **Cost**: Base infrastructure under $500/month monthly cost target
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be torn down completely via pulumi destroy
- **Code Quality**: TypeScript with proper type safety, well-tested, fully documented

## What to deliver

- Complete Pulumi TypeScript implementation with index.ts entry point
- VPC with public and private subnets across 3 AZs
- Application Load Balancer with WebSocket sticky session support
- Aurora PostgreSQL Serverless v2 cluster with IAM auth
- CloudFront distribution with S3 and ALB origins
- Auto Scaling Groups with EC2 ARM instances
- CloudWatch Log Groups with JSON-structured logging
- Route 53 health checks with multi-region failover
- IAM roles for all services following least privilege
- Systems Manager Parameter Store integration
- Proper resource tagging (Environment, Project, CostCenter)
- Unit tests for infrastructure components
- README.md with deployment instructions and architecture documentation
- Clear configuration for environmentSuffix parameter
