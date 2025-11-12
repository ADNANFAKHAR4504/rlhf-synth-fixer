# Payment Processing API Infrastructure

Hey team,

We need to build a production-grade payment processing API infrastructure for a fintech startup. They're handling sensitive financial data and need to maintain PCI DSS compliance while supporting 10,000+ concurrent transactions. I've been asked to create this using **CDK with Python**. The business wants end-to-end encryption, multi-AZ high availability, and strict compliance controls.

This is a complex deployment spanning multiple AWS services. The application processes financial transactions, so we need to ensure proper isolation, encryption at rest and in transit, and comprehensive monitoring. The infrastructure needs to be deployed in us-east-1 with full redundancy across 3 availability zones.

The team is looking for a complete solution that handles everything from network isolation to application deployment, database clustering, API management, asynchronous processing, and comprehensive observability. All resources need to be cost-optimized where possible while maintaining security and compliance requirements.

## What we need to build

Create a comprehensive payment processing infrastructure using **CDK with Python** for a fintech application that handles sensitive financial transactions with strict compliance requirements.

### Core Requirements

1. **Network Infrastructure**
   - VPC spanning 3 availability zones
   - Public subnets for load balancers
   - Private subnets for compute resources
   - Database subnets for RDS instances
   - Appropriate route tables and NAT instances for each AZ

2. **Load Balancing and WAF**
   - Application Load Balancer deployed in public subnets
   - AWS WAF integration with custom rule groups
   - OWASP Top 10 protection including SQL injection and XSS prevention
   - SSL/TLS termination at load balancer

3. **Container Orchestration**
   - ECS Fargate service for containerized API
   - Tasks running in private subnets with no direct internet access
   - Auto-scaling based on target tracking (CPU 70%, Memory 80%)
   - Integration with ALB for traffic distribution

4. **Database Layer**
   - RDS Aurora PostgreSQL cluster with one writer and two reader instances
   - Multi-AZ deployment for high availability
   - Encryption using customer-managed KMS keys
   - IAM database authentication instead of password-based access
   - Database subnets isolated from public internet

5. **API Management**
   - API Gateway for external access
   - Mutual TLS authentication enforcement for all endpoints
   - Request throttling configured to 1000 requests per second
   - Usage plans for API consumers

6. **Asynchronous Processing**
   - Lambda functions for async payment processing
   - SQS integration with dead letter queues for failed messages
   - Proper error handling and retry logic
   - Execution roles with least-privilege IAM permissions

7. **Storage Layer**
   - S3 buckets for encrypted document storage
   - Lifecycle policies for data retention management
   - Versioning enabled for audit requirements
   - Cross-region replication for disaster recovery
   - Block all public access with SSE-KMS encryption

8. **Secrets Management**
   - Secrets Manager for database credentials and API keys
   - Automatic rotation Lambda functions configured
   - Rotation schedule set to every 30 days
   - Integration with RDS for credential rotation

9. **Monitoring and Observability**
   - CloudWatch dashboards with custom metrics
   - Transaction processing time tracking
   - Success rate monitoring
   - CloudWatch Logs with 7-year retention for audit compliance

10. **VPC Endpoints**
    - Private endpoints for S3, DynamoDB, ECR, and Secrets Manager
    - Eliminate internet routing for AWS service communications
    - Reduce data transfer costs and improve security posture

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Use **VPC** with 3 availability zones for network isolation
- Use **ALB** with **AWS WAF** for application load balancing and protection
- Use **ECS Fargate** for containerized workloads
- Use **RDS Aurora PostgreSQL** for relational database with read replicas
- Use **API Gateway** with mutual TLS for external API access
- Use **Lambda** and **SQS** for asynchronous processing
- Use **S3** for document storage with encryption
- Use **Secrets Manager** for credential management
- Use **CloudWatch** for monitoring and logging
- Use **KMS** for customer-managed encryption keys
- Use **VPC Endpoints** for S3, DynamoDB, ECR, and Secrets Manager
- Use **NAT Instances** for outbound connectivity from private subnets
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Python 3.9+ and AWS CDK 2.100+ required

### Constraints

- VPC endpoints must be used for all AWS service communications to avoid internet routing
- RDS instances must use IAM database authentication instead of passwords
- All data at rest must use customer-managed KMS keys with automatic rotation
- API Gateway must enforce mutual TLS authentication for all endpoints
- ALB must use AWS WAF with custom rule groups for SQL injection and XSS protection
- Lambda functions must have execution roles with least-privilege permissions
- Secrets Manager must store all database credentials with automatic rotation every 30 days
- CloudWatch Logs must retain audit logs for exactly 7 years (2555 days)
- S3 buckets must block all public access and use SSE-KMS encryption
- ECS tasks must run in private subnets with no direct internet access
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and CloudWatch alarms
- NAT instances must be used instead of NAT Gateways for cost optimization

## Success Criteria

- **Functionality**: All 10 core requirements implemented with proper AWS service integration
- **Performance**: Auto-scaling configured to handle 10,000+ concurrent transactions with target tracking policies
- **Reliability**: Multi-AZ deployment across 3 availability zones with automated failover
- **Security**: End-to-end encryption, IAM authentication, mutual TLS, WAF protection, and VPC isolation
- **Compliance**: PCI DSS aligned with 7-year log retention, encryption at rest, and secrets rotation
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Well-structured Python code, comprehensive unit tests with 100% coverage target, integration tests using cfn-outputs
- **Monitoring**: CloudWatch dashboards showing transaction metrics and system health
- **Cost Optimization**: Serverless where possible, NAT instances instead of NAT Gateways

## What to deliver

- Complete CDK Python implementation with proper stack structure
- VPC with 3 AZs including public, private, and database subnets
- ALB with AWS WAF integration and OWASP rule groups
- ECS Fargate service with auto-scaling policies
- RDS Aurora PostgreSQL cluster with IAM authentication
- API Gateway with mutual TLS configuration
- Lambda functions for async processing with SQS integration
- S3 buckets with lifecycle policies and cross-region replication
- Secrets Manager with automatic rotation functions
- CloudWatch dashboards and alarms
- VPC endpoints for S3, DynamoDB, ECR, and Secrets Manager
- KMS keys with automatic rotation
- NAT instances for outbound connectivity
- Unit tests for all CDK constructs
- Integration tests using cfn-outputs/flat-outputs.json
- Documentation and deployment instructions in README
