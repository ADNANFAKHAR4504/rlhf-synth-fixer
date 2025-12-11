Hey team,

We need to build a secure, scalable payment processing API for a fintech startup that handles sensitive transaction data. The business requires enterprise-grade security controls, automatic scaling based on transaction volume, and deep integration with CloudWatch for monitoring. I've been asked to create this infrastructure using AWS CDK with Python.

The application itself is a Python Flask API that runs in containers, and we need to make sure it can handle variable transaction loads while maintaining strict security posture. The startup is particularly concerned about protecting customer payment data, so we need encryption everywhere and proper access controls throughout the stack.

They're currently using CloudWatch for their monitoring infrastructure, so we need to integrate seamlessly with dashboards and alarms they can use to track API performance and database health in real-time.

## What we need to build

Create a containerized payment processing API infrastructure using **AWS CDK with Python** that deploys a secure, highly available application across multiple availability zones with comprehensive monitoring.

### Core Infrastructure Requirements

1. **Network Foundation**
   - VPC spanning exactly 3 availability zones for high availability
   - Public subnets for the load balancer to receive internet traffic
   - Private subnets for application containers and database to stay isolated
   - NAT Gateway for outbound internet access from private subnets (1 gateway to optimize costs)

2. **Container Platform**
   - ECS cluster using Fargate for serverless container orchestration
   - Enable Container Insights for detailed container-level metrics
   - Auto-scaling configuration for 2-10 tasks based on traffic load
   - Integration with the private subnets for security isolation

3. **Load Balancing and Security**
   - Application Load Balancer deployed in public subnets
   - HTTPS listeners using ACM certificates for encrypted traffic
   - AWS WAF attached to ALB with rate limiting rules
   - SQL injection protection rules to defend against common attacks

4. **Database Layer**
   - Aurora PostgreSQL cluster in private subnets
   - Multi-AZ deployment for database high availability
   - Encryption at rest enabled for all data
   - Credentials stored in Secrets Manager, not hardcoded

5. **Secrets Management**
   - Store all database credentials in AWS Secrets Manager
   - Inject secrets into ECS tasks as environment variables
   - Ensure no credentials are hardcoded in application code or infrastructure

6. **Monitoring and Observability**
   - CloudWatch dashboards showing API latency metrics
   - Dashboard widgets for error rates and database connection counts
   - CloudWatch alarms for error rates exceeding 5%
   - CloudWatch alarms for database CPU usage exceeding 80%

7. **Security and Access Control**
   - IAM roles for all components following least-privilege principles
   - ECS task execution role with only necessary permissions
   - Database access restricted to application containers only
   - No public internet access to database or application containers

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **us-east-1** region
- Use **ECS Fargate** for serverless container hosting
- Use **Application Load Balancer** for HTTPS traffic distribution
- Use **AWS WAF** for web application firewall protection
- Use **Aurora PostgreSQL** for relational database storage
- Use **AWS Secrets Manager** for credential management
- Use **CloudWatch** for dashboards and alarms
- Use **Container Insights** for detailed container metrics
- Use **ACM** for TLS certificate management
- Use **IAM** for access control with least-privilege policies
- Resource names must include **environment_suffix** variable for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain policies or DeletionProtection)

### Infrastructure Validation

- Include CDK unit tests to validate security group rules
- Include CDK unit tests to validate IAM policies follow least-privilege
- Use Python type hints throughout the code
- Include CDK assertions in tests for infrastructure validation
- Test coverage should exceed 90%

### Constraints

- Use AWS Fargate for serverless container hosting to minimize operational overhead
- Implement end-to-end encryption using AWS Certificate Manager for TLS certificates
- Deploy the application across exactly 3 availability zones for high availability
- Use AWS Secrets Manager for all database credentials and API keys
- Configure CloudWatch Container Insights for detailed container-level metrics
- Implement AWS WAF rules to protect against common web exploits
- Use Python type hints and CDK assertions for infrastructure validation

## Success Criteria

- Functionality: Payment API accessible via HTTPS through Application Load Balancer
- Security: End-to-end encryption with WAF protection and least-privilege IAM roles
- High Availability: Multi-AZ deployment across 3 availability zones
- Scalability: Auto-scaling from 2 to 10 ECS tasks based on load
- Monitoring: CloudWatch dashboards showing latency, errors, and database metrics
- Alarms: Notifications when error rate exceeds 5% or database CPU exceeds 80%
- Testing: Unit tests validate security groups and IAM policies
- Resource Naming: All resources include environment_suffix for uniqueness
- Destroyability: All resources can be cleanly destroyed after testing

## What to deliver

- Complete AWS CDK Python application with all stack definitions
- VPC configuration with 3 availability zones, public and private subnets
- ECS cluster with Fargate compute and Container Insights enabled
- Application Load Balancer with HTTPS listeners using ACM certificates
- AWS WAF with rate limiting and SQL injection protection rules
- ECS Fargate service running payment API with auto-scaling (2-10 tasks)
- Aurora PostgreSQL cluster with encryption at rest
- Secrets Manager configuration for database credentials
- CloudWatch dashboards for API latency, error rates, database connections
- CloudWatch alarms for high error rates and database CPU usage
- IAM roles with least-privilege access for all components
- CDK unit tests validating security group rules and IAM policies
- Documentation and deployment instructions
