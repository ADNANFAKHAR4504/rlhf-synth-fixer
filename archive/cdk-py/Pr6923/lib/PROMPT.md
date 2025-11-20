# Financial Transaction Processing Web Application Infrastructure

Hey team,

We need to deploy a high-availability web application for a growing fintech startup that handles financial transaction processing. The business is scaling fast and expects 10,000+ concurrent users during peak hours, so we need rock-solid infrastructure that can handle the load while maintaining strict compliance requirements for financial data.

The application processes sensitive financial transactions, which means we need comprehensive audit trails, encryption at rest, and a multi-AZ setup that can survive availability zone failures. The startup's engineering team has already containerized their web application and needs us to provision the complete AWS infrastructure to run it in production.

This is a production deployment that needs to be ready for their next funding round demo, so everything needs to work correctly the first time. The business is especially concerned about security, reliability, and having proper monitoring in place.

## What We Need to Build

Create a complete production infrastructure using **AWS CDK with Python** that deploys a high-availability web application with database backend, caching, asynchronous processing, and comprehensive monitoring.

### Core Infrastructure Requirements

1. **Container Orchestration**
   - Deploy ECS Fargate service running the containerized web application
   - Configure auto-scaling from 2 to 10 tasks based on CPU/memory utilization
   - Use Fargate Spot instances for at least 50% of capacity to optimize costs
   - Ensure tasks are distributed across 3 availability zones

2. **Database Layer**
   - Create Aurora PostgreSQL cluster with one writer and one reader instance
   - Configure encrypted storage using customer-managed KMS keys
   - Enable multi-AZ deployment across all 3 availability zones
   - Set up automated backups and point-in-time recovery

3. **Load Balancing**
   - Deploy Application Load Balancer with health checks
   - Configure target group for ECS tasks with proper health check endpoints
   - Enforce TLS 1.2 minimum with AWS-managed SSL certificates
   - Distribute traffic across all availability zones

4. **Session Management**
   - Create DynamoDB table for session storage with on-demand billing mode
   - Enable point-in-time recovery for compliance
   - Add proper GSI for session lookups if needed

5. **Asynchronous Processing**
   - Deploy Lambda function for async transaction validation
   - Set reserved concurrent executions to ensure capacity
   - Configure proper IAM permissions with least privilege
   - Add CloudWatch Logs for debugging

6. **Static Assets and CDN**
   - Create S3 bucket for static assets with versioning enabled
   - Configure lifecycle policies for cost optimization
   - Deploy CloudFront distribution with origin access identity
   - Enable HTTPS-only access to CloudFront

7. **Network Architecture**
   - Implement VPC spanning 3 availability zones
   - Create public subnets for load balancer
   - Create private subnets for ECS tasks and databases
   - Deploy NAT gateways for outbound internet access from private subnets
   - Configure proper security groups with minimal access

8. **Monitoring and Observability**
   - Set up CloudWatch dashboards showing key application metrics
   - Monitor ECS task health, database performance, Lambda invocations
   - Track ALB request counts, latency, and error rates
   - Display DynamoDB consumed capacity and throttles

9. **Alerting**
   - Create SNS topic for critical alerts
   - Add email subscription for operational team notifications
   - Configure alarms for high error rates, latency spikes, database issues

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **us-east-1** region
- All resource names must include **environmentSuffix** for uniqueness (e.g., `web-app-alb-{environmentSuffix}`)
- Follow naming convention: `{resource-type}-{environmentSuffix}` or `{resource-type}-{purpose}-{environmentSuffix}`
- Use ECS Fargate for container orchestration (serverless compute)
- Use Aurora PostgreSQL for relational database
- Use DynamoDB for session storage
- Use Lambda for async processing
- Use CloudFront with S3 for static content delivery
- All resources must have proper tags: Environment, Team, CostCenter

### Security and Compliance Constraints

- RDS Aurora must use encrypted storage with customer-managed KMS keys
- ALB must enforce TLS 1.2 minimum protocol version
- All Lambda functions must have reserved concurrent executions configured
- CloudFront distribution must use origin access identity for S3 access
- All IAM roles must follow least-privilege principle with managed policies only (no inline policies)
- DynamoDB tables must have point-in-time recovery enabled
- S3 buckets must have versioning enabled
- All resources must be taggable for cost tracking

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (RemovalPolicy.DESTROY for non-production or proper cleanup)
- No RETAIN policies that would leave resources after stack deletion
- Include comprehensive error handling in Lambda functions
- Configure proper CloudWatch log retention
- Use AWS-managed SSL certificates for ALB (not custom certificates)
- ECS task definitions should pull from a placeholder ECR repository or public image

### Optional Enhancements

If time and complexity allow, consider adding:
- WAF rules to ALB for DDoS protection (enhances security posture)
- SQS queue between web app and Lambda (improves decoupling and reliability)
- ElastiCache Redis cluster for session caching (reduces database load)

These are nice-to-haves that improve the architecture but are not required for initial deployment.

## Success Criteria

- **Functionality**: Complete infrastructure that can host a containerized web application with database, caching, and async processing
- **High Availability**: Multi-AZ deployment across 3 availability zones with auto-scaling
- **Security**: Encryption at rest for database, TLS for data in transit, least-privilege IAM
- **Reliability**: Health checks, auto-scaling, point-in-time recovery for data stores
- **Observability**: CloudWatch dashboards and SNS alerts for key metrics
- **Resource Naming**: All resources include environmentSuffix for environment separation
- **Destroyability**: Stack can be completely removed without leaving resources behind
- **Code Quality**: Production-ready Python CDK code with proper error handling

## What to Deliver

- Complete AWS CDK Python implementation in the TapStack
- VPC with 3 AZs, public/private subnets, NAT gateways, security groups
- ECS Fargate cluster with service auto-scaling from 2-10 tasks
- Aurora PostgreSQL cluster with writer and reader instances, customer KMS encryption
- Application Load Balancer with TLS 1.2+ and health checks
- DynamoDB table with on-demand billing and PITR
- Lambda function with reserved concurrency for transaction validation
- S3 bucket with versioning and CloudFront distribution using OAI
- CloudWatch dashboard aggregating metrics from all services
- SNS topic with email subscription for critical alerts
- All resources properly tagged with Environment, Team, CostCenter
- Comprehensive unit tests validating all resource creation
- Documentation explaining the architecture and deployment process

The infrastructure should be production-ready, follow AWS best practices, and be deployable to us-east-1 without manual intervention.
