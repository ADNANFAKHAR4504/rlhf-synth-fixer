# E-Commerce API Infrastructure Request

Hey team,

We need to build a production-ready infrastructure for our e-commerce product catalog API. The company is seeing rapid growth and we're getting hit with sudden traffic spikes during flash sales. Right now our infrastructure isn't set up to handle this automatically and we need something that can scale without manual intervention.

The technical team has decided to use **Pulumi with TypeScript** for this deployment, targeting the us-west-2 region. The API is built in Node.js and needs PostgreSQL for product data storage and Redis for session management. We're looking at supporting blue-green deployments eventually, so the setup needs to be flexible enough to handle zero-downtime updates.

The business has some pretty specific requirements around high availability. They want multi-AZ deployment with automatic failover, and everything needs to scale automatically based on actual load. Security is also a big concern since we're handling customer sessions and product data.

## What we need to build

Create a production-ready e-commerce API infrastructure using **Pulumi with TypeScript** for our Node.js product catalog service. The infrastructure must handle variable traffic loads, maintain high availability, and meet security compliance requirements.

### Core Infrastructure Requirements

1. **Network Foundation**
   - Deploy VPC with 3 public subnets and 3 private subnets across 3 Availability Zones
   - Configure NAT Gateways for private subnet outbound traffic
   - Set up proper route tables and internet gateway connectivity
   - All resource names must include **environmentSuffix** for uniqueness
   - Use naming convention: resource-type-environment-suffix

2. **Container Orchestration**
   - ECS Fargate cluster for running Node.js API containers
   - Auto-scaling configuration for 2-10 tasks based on 70% CPU threshold
   - Task definitions with proper resource allocations
   - Integration with Application Load Balancer
   - Service discovery configuration

3. **Database Layer**
   - RDS Aurora PostgreSQL Serverles v2 for product data
   - Enable encryption at rest and in transit
   - Configure automated backups with 7-day retention period
   - Multi-AZ deployment for high availability
   - Proper subnet groups in private subnets

4. **Caching Layer**
   - ElastiCache Redis in cluster mode
   - Configure 2 shards with 1 replica per shard for session management
   - Deploy in private subnets across multiple AZs
   - Enable automatic failover
   - Proper security group configurations

5. **Load Balancing and SSL**
   - Application Load Balancer in public subnets
   - SSL certificate from AWS Certificate Manager (ACM)
   - Target group with health checks for ECS tasks
   - Configure listener rules for HTTP to HTTPS redirect
   - Cross-zone load balancing enabled

6. **Secrets Management**
   - Store all sensitive configuration in AWS Secrets Manager
   - Include database credentials, Redis connection strings, API keys
   - Enable 30-day automatic rotation for database credentials
   - Grant ECS tasks appropriate access permissions
   - Never hardcode secrets in code or environment variables

7. **Monitoring and Logging**
   - CloudWatch Log Groups for ECS container logs
   - Set 14-day log retention to control costs
   - Custom metrics for API response times
   - CloudWatch alarms for high CPU utilization
   - Alarms for database connection count thresholds
   - Alarms for Redis memory usage monitoring

8. **Security and Access Control**
   - IAM roles with least-privilege policies for ECS tasks
   - Grant access to RDS, ElastiCache, and Secrets Manager only
   - Security groups restricting traffic between layers
   - VPC security group rules for database and cache access
   - No public access to database or cache resources

9. **Resource Protection**
   - Enable deletion protection on production resources
   - Support force deletion via stack configuration parameter
   - All resources must be destroyable (no Retain policies)
   - Skip final snapshots for RDS to allow cleanup
   - Configure removal policies appropriately

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-west-2** region
- Use **Amazon VPC** for network isolation
- Use **ECS Fargate** for serverless container orchestration
- Use **Aurora PostgreSQL Serverless v2** for database
- Use **ElastiCache Redis** in cluster mode for sessions
- Use **Application Load Balancer** for traffic distribution
- Use **AWS Secrets Manager** for credentials
- Use **CloudWatch** for logs, metrics, and alarms
- Resource names must include **environmentSuffix** for parallel deployments
- Follow naming convention: resource-type-environmentSuffix

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names to support parallel test deployments
- No RemovalPolicy.RETAIN or deletion_protection settings that prevent cleanup
- RDS clusters must set skipFinalSnapshot: true for destroyability
- NAT Gateways cost approximately $32/month each - deploy only as needed
- Consider cost optimization: use serverless services where possible
- Auto-scaling should respond to actual CPU metrics, not fixed schedules
- Secrets rotation must be automated with 30-day cycle

### Constraints

- Must deploy to us-west-2 region only
- All database credentials must rotate automatically every 30 days
- ECS tasks must scale between 2 and 10 based on 70% CPU threshold
- CloudWatch logs must retain for exactly 14 days
- Redis must use cluster mode with 2 shards and 1 replica per shard
- Aurora backup retention must be 7 days
- All resources must be removable without manual intervention
- Support configurable deletion protection via stack parameters
- Include proper error handling and logging in all components

## Success Criteria

- **Functionality**: API accessible via HTTPS through ALB, can connect to database and Redis
- **Scalability**: Auto-scaling responds to CPU load, scales from 2 to 10 tasks automatically
- **High Availability**: Multi-AZ deployment survives single AZ failure
- **Security**: No hardcoded secrets, least-privilege IAM, encryption enabled
- **Monitoring**: CloudWatch logs and metrics capturing API behavior, alarms triggering appropriately
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be removed cleanly via infrastructure destroy command
- **Cost Efficiency**: Uses serverless Aurora and Fargate to minimize costs

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- VPC with subnets, route tables, NAT gateways, internet gateway
- ECS Fargate cluster, task definitions, services with auto-scaling
- Aurora PostgreSQL Serverless v2 cluster with backups and encryption
- ElastiCache Redis cluster mode with 2 shards and replication
- Application Load Balancer with target groups and health checks
- AWS Secrets Manager secrets with rotation enabled
- IAM roles and policies for ECS task execution and tasks
- Security groups for ALB, ECS, RDS, and ElastiCache
- CloudWatch log groups, custom metrics, and alarms
- Pulumi stack outputs for deployed resource identifiers
- Unit tests with 100% coverage
- Documentation in README.md explaining architecture and deployment
