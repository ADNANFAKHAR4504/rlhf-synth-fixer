# Payment Processing Web Application Infrastructure

Hey team,

We need to build a production-grade payment processing web application infrastructure for a fintech startup launching their real-time payment service. The business needs this deployed in Singapore (eu-south-2) to serve their Asia-Pacific customers. I've been asked to create this infrastructure using **AWS CDK with TypeScript**. This is a critical system that handles financial transactions, so we need to meet PCI-DSS compliance requirements and ensure zero-downtime deployments.

The application architecture consists of three main components: a React frontend served through CloudFront for fast global access, a Node.js API backend running on containerized infrastructure, and a PostgreSQL database for storing transaction records. The business has strict requirements around security, availability, and compliance given the sensitive nature of payment data.

We're targeting deployment across three availability zones for high availability and need to support blue-green deployment patterns to minimize risk during updates. The infrastructure must be fully monitored with dashboards and alerting so the operations team can track system health and respond quickly to issues.

## What we need to build

Create a complete payment processing infrastructure using **AWS CDK with TypeScript** deployed to the eu-south-2 region. This infrastructure must support a React frontend, Node.js API backend, and PostgreSQL database with full observability and security controls.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public, private, and isolated subnet tiers across 3 availability zones
   - Public subnets for Application Load Balancer and NAT Gateways
   - Private subnets for ECS Fargate tasks
   - Isolated subnets for RDS database cluster
   - Proper routing tables and security groups for each tier

2. **Database Layer**
   - RDS Aurora PostgreSQL cluster deployed in isolated subnets
   - Automated daily backups with appropriate retention
   - Encryption at rest enabled for all data
   - Multi-AZ configuration for high availability
   - Database credentials stored in AWS Secrets Manager
   - Automatic credential rotation configured for every 30 days

3. **Container Platform**
   - ECS Fargate cluster for running Node.js API containers
   - Application Load Balancer in public subnets with proper health checks
   - Health checks configured to run every 30 seconds
   - Two consecutive health check failures trigger container replacement
   - Security groups restricting database access to only ECS tasks
   - Container logs forwarded to CloudWatch with 90-day retention

4. **Auto Scaling**
   - ECS service auto-scaling based on CPU utilization
   - Scale-out trigger at 70% CPU utilization
   - Appropriate cool-down periods to prevent flapping
   - Minimum and maximum task count configuration

5. **Frontend Hosting**
   - S3 bucket configured for static website hosting of React application
   - CloudFront distribution with Origin Access Identity for S3
   - CloudFront configured as the only access point to frontend assets
   - Proper caching policies for static assets


6. **Monitoring and Observability**
   - CloudWatch dashboard showing key metrics:
     - API response times and latency percentiles
     - Application error rates
     - Active database connections
     - ECS task health and count
   - All application logs centralized in CloudWatch Logs
   - 90-day log retention policy

7. **Alerting**
   - SNS topic for operational alerts
   - CloudWatch alarm triggered when error rate exceeds 1%
   - Notifications sent to SNS topic for on-call team

8. **Blue-Green Deployment**
   - ECS service configured to support blue-green deployment pattern
   - Deployment configuration allowing safe rollback
   - Health checks ensuring new tasks are healthy before traffic shift

9. **Encryption**
    - All data encrypted at rest using AWS KMS customer-managed keys
    - Database encryption enabled
    - S3 bucket encryption enabled
    - Secrets encrypted in Secrets Manager

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **VPC** for network isolation with proper subnet segmentation
- Use **RDS Aurora PostgreSQL** for transactional database
- Use **ECS Fargate** for serverless container orchestration
- Use **Application Load Balancer** for distributing traffic to containers
- Use **S3** and **CloudFront** for frontend asset delivery
- Use **Secrets Manager** for credential management with rotation
- Use **CloudWatch** for logs, metrics, and dashboards
- Use **SNS** for alerting and notifications
- Use **KMS** for encryption key management
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **eu-south-2** region
- Container runtime should use Node.js 18 or later

### Security Constraints

- IAM roles must follow least privilege principle
- Explicit deny rules for unnecessary actions
- API endpoints accessible only through CloudFront distribution
- Frontend assets served exclusively from S3 via CloudFront (no direct S3 access)
- All resources deployed within single VPC with proper network segmentation
- Database only accessible from ECS security group
- All data encrypted at rest with KMS customer-managed keys
- Database credentials never hardcoded, always from Secrets Manager
- Security groups configured with minimum required access

### Operational Constraints

- All resources must be destroyable after testing (no Retain deletion policies)
- Application logs centralized with 90-day retention
- Health checks every 30 seconds for containers
- Two consecutive failures trigger replacement
- Automated database backups enabled
- Credential rotation every 30 days
- Blue-green deployment capability for zero-downtime updates

## Success Criteria

- **Functionality**: Complete three-tier architecture with VPC, compute, database, and CDN
- **Security**: Encryption at rest, secrets management, and least privilege IAM
- **High Availability**: Multi-AZ deployment for database and load balancer
- **Auto Scaling**: Dynamic scaling based on CPU metrics at 70% threshold
- **Monitoring**: CloudWatch dashboard with API latency, errors, and database metrics
- **Alerting**: SNS notifications when error rate exceeds 1%
- **Deployment**: Blue-green deployment configuration for safe updates
- **Compliance**: PCI-DSS aligned with encryption, logging, and access controls
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Code Quality**: TypeScript with proper types, well-tested, and documented

## What to deliver

- Complete AWS CDK TypeScript implementation in lib/ directory
- VPC with three subnet tiers across 3 availability zones
- RDS Aurora PostgreSQL cluster with encryption and automated backups
- ECS Fargate service with Application Load Balancer
- Auto-scaling configuration for ECS based on CPU utilization
- S3 bucket and CloudFront distribution for React frontend
- Secrets Manager secret with 30-day rotation for database credentials
- CloudWatch dashboard with API, database, and error metrics
- SNS topic and alarm for error rate threshold
- Blue-green deployment configuration for ECS service
- KMS keys for encryption at rest
- Unit tests covering all infrastructure components
- Integration tests validating resource connectivity
- README documentation with deployment instructions
- All code following TypeScript best practices with proper typing