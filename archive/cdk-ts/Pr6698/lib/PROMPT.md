# Customer Portal Infrastructure Request

Hey team,

We have been tasked with deploying infrastructure for our new customer portal, which is a critical application for our financial services business. The portal will serve as the primary interface for our customers to access their accounts, review transactions, and manage their financial products. The business has been pushing for this for months, and we finally have approval to build it properly.

The application itself is ready. The frontend team built a React app, and the backend team has a Node.js API that handles all the business logic. Both are containerized and ready to deploy. What we need now is the infrastructure to run them at scale, with proper availability, security, and monitoring.

Our infrastructure needs to support production traffic in the us-east-1 region. The business is concerned about availability since any downtime directly impacts revenue. They also have strict security requirements being in the financial services space. We need to build this using **AWS CDK with TypeScript** so we can maintain it properly and have type safety.

## What we need to build

Create a multi-tier web application infrastructure using **AWS CDK with TypeScript** for a customer portal in the financial services domain.

### Core Requirements

1. **Network Foundation**
   - VPC spanning 3 availability zones for high availability
   - Each AZ needs both public and private subnets
   - Use NAT instances (not NAT Gateways) for outbound traffic from private subnets to reduce costs
   - Proper route tables and network ACLs

2. **Container Platform**
   - ECS cluster running Fargate services
   - Deploy frontend service running React application
   - Deploy backend service running Node.js API
   - Use Fargate Spot capacity for non-critical services to optimize costs
   - Services must scale based on demand

3. **Load Balancing and Routing**
   - Application Load Balancer for traffic distribution
   - Path-based routing configuration:
     - Route /api/* paths to backend service
     - Route /* (all other paths) to frontend service
   - Health checks for both services
   - SSL/TLS termination at the load balancer

4. **Database Layer**
   - RDS Aurora PostgreSQL cluster for relational data
   - One writer instance for writes
   - Two reader instances across availability zones for read scaling
   - Automatic failover capability
   - Encryption at rest enabled

5. **Session Management**
   - DynamoDB tables for managing user sessions
   - On-demand billing mode (no capacity planning required)
   - Global secondary indexes for query flexibility
   - Point-in-time recovery enabled

6. **API Gateway Integration**
   - API Gateway as entry point for API requests
   - Request throttling to prevent abuse
   - Integration with backend ECS service
   - API key management for clients

7. **Content Delivery Network**
   - CloudFront distribution for global content delivery
   - S3 bucket as origin for static assets (images, CSS, JS)
   - ALB as origin for dynamic API content
   - Edge caching for performance
   - HTTPS enforcement

8. **Monitoring and Observability**
   - CloudWatch dashboards for operational visibility
   - Monitor ECS task health metrics (CPU, memory, task count)
   - Monitor RDS connection count and database performance
   - Monitor API Gateway latency and error rates
   - Alarms for critical metrics

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **ECS Fargate** for container orchestration
- Use **Application Load Balancer** for HTTP routing
- Use **RDS Aurora PostgreSQL** for relational database
- Use **DynamoDB** for session storage
- Use **API Gateway** for API management
- Use **CloudFront** for content delivery
- Use **CloudWatch** for monitoring
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Use Route53 for DNS management with failover routing policies

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter
- No resources with RemovalPolicy.RETAIN or similar retention policies
- No deletion protection enabled on any resources
- All resources must be fully destroyable for testing purposes
- NAT instances must be properly configured for cost optimization
- RDS cluster must have skip_final_snapshot enabled for destroyability
- All S3 buckets must have auto-delete objects enabled

### Security Constraints

- IAM roles must follow least privilege principle
- Security groups must have minimal required port access
- All data encryption at rest where supported (RDS, DynamoDB, S3)
- All data encryption in transit (HTTPS/TLS)
- No hardcoded credentials or secrets in code
- Use AWS Secrets Manager for database credentials
- Financial services compliance requirements must be met

### Performance Constraints

- Application must handle varying traffic loads
- Auto-scaling for ECS services based on CPU/memory
- Aurora read replicas for query performance
- CloudFront caching for reduced latency
- DynamoDB on-demand mode for burst capacity
- Health check intervals appropriate for quick detection

### Cost Optimization

- Use NAT instances instead of NAT Gateways (approximately $32/month savings per AZ)
- Use Fargate Spot for non-production workloads
- Use DynamoDB on-demand billing
- Implement CloudWatch log retention policies (7-14 days)
- Use Aurora Serverless v2 if appropriate for workload
- Tag all resources for cost allocation

## Success Criteria

- Infrastructure successfully synthesizes with `cdk synth`
- All 8 requirement categories fully implemented
- Resource naming includes environmentSuffix in all named resources
- All resources are destroyable (no retention policies)
- Infrastructure can be deployed to us-east-1 without errors
- VPC spans 3 availability zones with proper subnet configuration
- ECS services deployed on Fargate with auto-scaling
- ALB routes traffic correctly to frontend and backend services
- Aurora PostgreSQL cluster operational with writer and readers
- DynamoDB tables created with GSI support
- API Gateway integrated with backend service
- CloudFront serves static and dynamic content
- CloudWatch dashboards display all required metrics
- Security groups properly configured
- IAM roles follow least privilege
- All encryption requirements met
- Code is type-safe and follows TypeScript best practices

## What to deliver

- Complete AWS CDK TypeScript implementation in lib/ directory
- Main stack file: lib/tap-stack.ts (or modular constructs)
- Entry point: bin/tap.ts (already exists, may need props updates)
- VPC with 3 AZ, public/private subnets, NAT instances
- ECS cluster with Fargate services (frontend, backend)
- Application Load Balancer with path-based routing
- RDS Aurora PostgreSQL cluster (1 writer, 2 readers)
- DynamoDB tables with on-demand billing and GSI
- API Gateway with throttling
- CloudFront distribution with S3 and ALB origins
- CloudWatch dashboards and alarms
- All IAM roles and security groups
- Comprehensive unit tests for infrastructure
- Integration tests that verify connectivity
- Documentation (lib/README.md) with deployment instructions
- All resources using environmentSuffix parameter
