# Student Assessment Processing System

Hey team,

We need to build a secure data pipeline for processing student assessment data. An educational technology company has asked us to create infrastructure that collects assessment results from various schools, processes them for analytics, and stores them securely while maintaining FERPA compliance. I've been asked to create this using **CDKTF with TypeScript**.

The business wants a containerized processing system that can handle assessment data at scale while ensuring all student information remains encrypted and access is properly audited. This is critical because we're dealing with educational records that fall under strict privacy regulations.

## What we need to build

Create a secure student assessment processing infrastructure using **CDKTF with TypeScript** that handles data collection, processing, and storage while maintaining FERPA compliance.

### Core Requirements

1. **Container-Based Processing**
   - Deploy containerized assessment processing workloads
   - Use managed container orchestration without EC2 instances
   - Auto-scale based on assessment processing workload

2. **Data Storage and Caching**
   - Store assessment metadata in a managed relational database
   - Use serverless database option to optimize costs
   - Cache frequently accessed assessment data for performance
   - Implement in-memory data store for caching layer

3. **Security and Compliance**
   - Encrypt all data at rest using AWS managed keys
   - Encrypt all data in transit
   - Implement automatic credential rotation every 30 days
   - Store database credentials securely with managed rotation
   - Maintain audit logs for all data access patterns

4. **Network Architecture**
   - Implement proper VPC with public and private subnets
   - Use multiple availability zones for high availability
   - Configure security groups with least-privilege access
   - Ensure database and cache are not publicly accessible

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **ECS Fargate** for containerized assessment processing
- Use **RDS Aurora Serverless** for assessment metadata storage
- Use **ElastiCache Redis** for caching frequently accessed data
- Use **Secrets Manager** for database credential management with auto-rotation
- Use **KMS** for encryption at rest
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-${environmentSuffix}`
- Deploy to **us-east-1** region

### Constraints

- All data must be encrypted at rest and in transit using AWS managed keys
- Database credentials must be rotated automatically every 30 days
- System must maintain audit logs for all data access patterns
- Database and cache must be in private subnets only
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and CloudWatch logging

### Deployment Requirements (CRITICAL)

- **Resource Naming**: All resources MUST include environmentSuffix parameter for uniqueness
- **Destroyability**: All resources MUST use RemovalPolicy.DESTROY (no RETAIN policies allowed)
- **ECS Task Role**: Ensure ECS tasks have proper IAM roles to access Secrets Manager
- **Security Groups**: Implement least-privilege access between services
- **Subnet Configuration**: Database and cache MUST be in private subnets only

## Success Criteria

- **Functionality**: Complete assessment processing pipeline with all components connected
- **Performance**: Caching layer reduces database load for frequently accessed data
- **Reliability**: Multi-AZ deployment with auto-scaling for container workloads
- **Security**: All data encrypted, credentials rotated, audit logs maintained
- **Resource Naming**: All resources include environmentSuffix in their names
- **Code Quality**: TypeScript code with proper type definitions and error handling

## What to deliver

- Complete CDKTF TypeScript implementation in lib/tap-stack.ts
- Separate stack files for VPC, database, cache, and ECS components (optional, based on architecture)
- ECS Fargate cluster with task definition
- RDS Aurora Serverless cluster in private subnets
- ElastiCache Redis cluster in private subnets
- Secrets Manager secret with automatic rotation configuration
- KMS key for encryption at rest
- Security groups with least-privilege rules
- CloudWatch log groups for all services
- Documentation with deployment instructions in lib/README.md