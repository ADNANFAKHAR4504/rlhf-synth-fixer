Hey team,

We need to build a payment processing infrastructure for a fintech startup. I've been asked to create this in Python using Pulumi. The business wants to maintain identical infrastructure across development, staging, and production environments while keeping environment-specific configurations separate.

The challenge here is maintaining consistency across all environments while still supporting environment-specific values like instance sizes, database configurations, and scaling parameters. The platform needs to handle payment transactions, so security and reliability are non-negotiable.

Make sure to include a unique environmentSuffix in all resource names so we can deploy multiple environments in the same account without conflicts.

## What we need to build

Create a payment processing platform using **Pulumi with Python** that maintains consistency across dev, staging, and production environments.

### Core Requirements

1. **Multi-Environment Support**
   - Support dev, staging, and production environments
   - Core infrastructure must be identical across environments
   - Environment-specific values parameterized using Pulumi Stack configurations
   - Resource names must include **environmentSuffix** for uniqueness

2. **Application Hosting**
   - Container-based application deployment using ECS Fargate
   - Auto-scaling based on CPU and memory metrics
   - Load balancing for high availability
   - Health checks and automatic recovery

3. **Data Storage**
   - Database for transaction records using RDS Aurora Serverless v2
   - Transaction logs stored securely
   - Automated backups with point-in-time recovery
   - Read replicas for production environment

4. **Message Processing**
   - Asynchronous payment processing using SQS
   - Dead letter queues for failed transactions
   - Event-driven architecture for payment notifications
   - SNS topics for real-time alerts

5. **Caching Layer**
   - ElastiCache Redis for session management
   - Cache frequently accessed payment metadata
   - Improve response times for payment status checks

6. **Security Controls**
   - VPC with private subnets for databases and compute
   - Security groups with least-privilege access
   - Encryption at rest for all data stores
   - Encryption in transit using TLS
   - IAM roles with minimal required permissions
   - Secrets Manager for sensitive configuration

7. **Monitoring and Logging**
   - CloudWatch Logs for all application and infrastructure logs
   - CloudWatch Metrics for performance monitoring
   - CloudWatch Alarms for critical thresholds
   - CloudTrail for API audit logging
   - SNS notifications for operational alerts

8. **API Management**
   - Application Load Balancer for HTTPS traffic
   - API endpoints for payment processing
   - Rate limiting and request throttling
   - SSL/TLS termination at load balancer

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Deploy to **us-east-1** region
- Use **ECS Fargate** for compute
- Use **RDS Aurora Serverless v2** for database
- Use **SQS** and **SNS** for messaging
- Use **ElastiCache Redis** for caching
- Use **Application Load Balancer** for API access
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `payment-{service}-{environmentSuffix}`
- Stack configurations stored in Pulumi.{stack}.yaml files

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: ALL resources must include environmentSuffix parameter for unique naming
- **Destroyability**: All resources must be destroyable (no Retain policies, no deletion protection)
- **Stack Configurations**: Use Pulumi config for environment-specific values
- **Serverless Services**: Prefer Aurora Serverless v2 over provisioned RDS for cost efficiency
- **No Slow Resources**: Avoid NAT Gateways (use VPC endpoints), avoid ConfigRecorder

### Constraints

- No hardcoded credentials or secrets in code
- All sensitive data encrypted at rest and in transit
- Follow PCI DSS principles for payment data handling
- No storage of card numbers or CVV codes
- All resources properly tagged for cost tracking and compliance
- Include proper error handling and retry logic
- Use least-privilege IAM policies throughout
- Resources must be fully destroyable for testing

## Success Criteria

- **Functionality**: Complete payment processing infrastructure deployable to any environment
- **Consistency**: Dev, staging, prod environments structurally identical
- **Performance**: Sub-second response times for payment status checks
- **Reliability**: 99.9% uptime, automatic failover capabilities
- **Security**: All data encrypted, proper IAM roles, no hardcoded secrets
- **Resource Naming**: All resources include environmentSuffix parameter
- **Scalability**: Auto-scaling handles traffic spikes up to 10x normal load
- **Code Quality**: Python, well-structured, modular design, comprehensive tests

## What to deliver

- Complete Pulumi Python implementation in modular components
- ECS Fargate cluster with application containers
- RDS Aurora Serverless v2 database cluster
- SQS queues and SNS topics for messaging
- ElastiCache Redis cluster for caching
- Application Load Balancer with target groups
- VPC with public and private subnets
- Security groups and IAM roles
- CloudWatch monitoring and alarms
- Pulumi stack configuration files for dev/staging/prod
- Unit tests for all infrastructure components
- Integration tests validating cross-resource connectivity
- Documentation with architecture diagram and deployment instructions
