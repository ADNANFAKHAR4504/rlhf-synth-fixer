# Payment Processing Web Application Infrastructure

Hey team,

We're working with a fintech startup that needs to deploy their payment processing web application with strict security requirements. They have a React frontend and Python API backend that handles sensitive financial data, so PCI compliance is a major consideration. The business needs this infrastructure to be production-ready with automated scaling and full monitoring capabilities.

The architecture they're looking for is pretty comprehensive - ECS Fargate for the containerized Python API, Aurora PostgreSQL for the database layer, and S3 with CloudFront for hosting the React frontend. Everything needs to be properly isolated in a VPC with multiple availability zones for high availability, with all compute resources secured in private subnets.

I've been asked to implement this using **Pulumi with Python**. The infrastructure needs to support automatic scaling based on load, comprehensive monitoring through CloudWatch, and proper secrets management for database credentials.

## What we need to build

Create a production-grade payment processing web application infrastructure using **Pulumi with Python** for deployment in the us-east-1 region.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 availability zones
   - Each AZ must have both public and private subnets
   - NAT Gateways in public subnets for outbound internet access from private subnets
   - Proper routing tables for subnet traffic flow

2. **Application Layer**
   - ECS cluster with Fargate launch type
   - Python API container running in private subnets
   - Minimum 3 tasks, maximum 10 tasks
   - Application Load Balancer in public subnets with HTTPS listeners
   - Auto-scaling policies: CPU > 70% and memory > 80%
   - Container health checks with 30-second intervals and automatic replacement

3. **Database Layer**
   - Aurora PostgreSQL cluster with multi-AZ deployment
   - Encryption at rest enabled
   - Deployed in private subnets across availability zones
   - Connection string stored in AWS Secrets Manager

4. **Frontend Distribution**
   - S3 bucket for React frontend static files
   - CloudFront distribution for CDN delivery
   - HTTPS access with ACM certificates

5. **Security Configuration**
   - Security groups allowing only HTTPS traffic from internet to ALB
   - All compute resources in private subnets only
   - End-to-end encryption with AWS Certificate Manager
   - Secrets Manager integration for database credentials injected into ECS tasks

6. **Monitoring and Logging**
   - CloudWatch log groups for ECS tasks
   - CloudWatch log groups for ALB access logs
   - 30-day retention policy for all logs

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Deploy to **us-east-1** region
- Use **AWS VPC** for network isolation
- Use **AWS ECS with Fargate** for containerized workloads
- Use **AWS Application Load Balancer** for traffic distribution
- Use **AWS RDS Aurora PostgreSQL** for database
- Use **AWS S3** for frontend storage
- Use **AWS CloudFront** for CDN
- Use **AWS CloudWatch** for monitoring and logging
- Use **AWS Secrets Manager** for credential storage
- Use **AWS ACM** for SSL/TLS certificates
- Use **AWS NAT Gateway** for outbound connectivity
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- All resources must include tags: Environment='production' and CostCenter='payments'

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL resources must accept and use an environmentSuffix string parameter to ensure globally unique names (especially for S3 buckets and other resources requiring global uniqueness)
- **Destroyability**: All resources must be fully destroyable without manual intervention. Use RemovalPolicy.DESTROY for RDS clusters, S3 buckets, and other stateful resources. FORBIDDEN to use Retain policies
- **No Manual Resources**: Do not create resources that require manual setup (e.g., ACM certificates should use DNS validation or be referenced if already existing)
- **Private Subnet Placement**: All compute resources (ECS tasks, RDS) must be in private subnets only
- **NAT Gateway**: Required in public subnets for outbound internet access from private subnets (note: NAT Gateways are slow to create/destroy)

### Constraints

- Use only private subnets for all compute resources (ECS tasks, Aurora database)
- Implement end-to-end encryption with AWS Certificate Manager
- Configure auto-scaling based on CPU and memory metrics
- Use Aurora PostgreSQL with encryption at rest
- Deploy API using ECS Fargate with at least 3 tasks
- Frontend must be served through CloudFront CDN
- All logs must be sent to CloudWatch with 30-day retention
- Use AWS Secrets Manager for database credentials
- Implement health checks with automatic task replacement
- Tag all resources with Environment='production' and CostCenter='payments'
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete web application deployment with React frontend accessible via CloudFront and Python API accessible via ALB
- **Performance**: Auto-scaling configured and responding to CPU/memory thresholds
- **Reliability**: Multi-AZ deployment with automatic health checks and task replacement
- **Security**: All compute resources in private subnets, HTTPS only, encrypted database, secrets properly managed
- **Monitoring**: All logs flowing to CloudWatch with proper retention
- **Resource Naming**: All resources include environmentSuffix for global uniqueness
- **Code Quality**: Well-structured Pulumi Python code, properly tested, fully documented

## What to deliver

- Complete **Pulumi with Python** implementation
- VPC with 3 AZs, public and private subnets, NAT Gateways
- ECS cluster with Fargate tasks (min 3, max 10) and auto-scaling
- Application Load Balancer with HTTPS listeners
- Aurora PostgreSQL cluster with multi-AZ and encryption
- S3 bucket and CloudFront distribution for frontend
- CloudWatch log groups with 30-day retention
- Secrets Manager integration for database credentials
- Security groups configured for HTTPS traffic
- Comprehensive unit tests for all components
- Integration tests validating deployment
- Documentation and deployment instructions
