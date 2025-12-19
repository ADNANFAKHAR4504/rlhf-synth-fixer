Hey team,

We need to build infrastructure for EduTech Brasil, a growing educational technology provider in South America. They're running a custom Learning Management System (LMS) that needs to support 10,000 concurrent students. The challenge is handling high traffic loads during peak exam periods while maintaining fast session management and reliable content delivery.

The business requirements are clear: high availability, strong performance during peak loads, and rock-solid security since we're dealing with student data and educational content. The system needs session caching to keep response times low, shared storage for course materials, and proper secrets management for database credentials.

We're deploying this to the sa-east-1 region (São Paulo, Brazil) to minimize latency for their South American user base.

## What we need to build

Create an LMS deployment infrastructure using **CDKTF with Python** for EduTech Brasil's containerized learning management system.

### Core Requirements

1. **Container Orchestration**
   - ECS Fargate cluster for running the LMS application containers
   - Task definitions with proper resource allocation for 10K concurrent users
   - Service auto-scaling based on CPU and memory utilization
   - Integration with CloudWatch for container logging

2. **Session Management and Caching**
   - ElastiCache Redis cluster for managing user sessions
   - Must support encryption at rest using KMS
   - Must support encryption in transit (TLS enabled)
   - Configured for high availability with automatic failover

3. **Shared Content Storage**
   - EFS (Elastic File System) for shared course content and materials
   - Mounted to ECS tasks for consistent content access
   - Encryption at rest enabled
   - Performance mode appropriate for concurrent access

4. **Secrets Management**
   - Fetch existing database credentials from Secrets Manager (do not create new secrets)
   - Securely inject secrets into ECS task definitions
   - Proper IAM permissions for secret access

5. **Networking and Security**
   - VPC with public and private subnets across multiple availability zones
   - Security groups with least privilege access rules
   - ECS tasks in private subnets with proper egress
   - ElastiCache and EFS in private subnets

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Amazon ECS (Fargate)** for containerized application hosting
- Use **Amazon ElastiCache (Redis)** with encryption at-rest and in-transit
- Use **Amazon EFS** for shared file storage
- Use **AWS Secrets Manager** to fetch existing secrets (don't create new ones)
- Use **AWS KMS** for encryption keys
- Use **Amazon VPC** for networking with proper security groups
- Use **AWS IAM** for roles and policies following least privilege principle
- Use **Amazon CloudWatch** for logging and monitoring
- Resource names must include a **string suffix** for uniqueness (environmentSuffix variable)
- Follow naming convention: resource-type-environment-suffix
- Deploy to **sa-east-1** region
- All resources must be tagged with: environment='production', project='edutechbr-lms'

### Constraints

- ElastiCache must have encryption at rest enabled using KMS
- ElastiCache must have encryption in transit enabled (TLS)
- All data stores must use encryption at rest
- IAM roles must follow principle of least privilege
- All resources must be fully destroyable (no Retain deletion policies)
- ECS tasks must use Fargate launch type (serverless)
- Fetch secrets from existing Secrets Manager entries (do not create new secrets)
- All resources must include environmentSuffix in their names for uniqueness
- Include proper error handling and CloudWatch logging
- Enable container insights for ECS monitoring

## Success Criteria

- **Functionality**: ECS service deploys successfully and runs LMS containers
- **Functionality**: ElastiCache Redis cluster is accessible from ECS tasks
- **Functionality**: EFS volume mounts successfully to ECS tasks
- **Functionality**: Secrets are fetched from Secrets Manager and injected into tasks
- **Performance**: Infrastructure supports 10,000 concurrent student sessions
- **Performance**: Redis caching improves response times for session data
- **Reliability**: Multi-AZ deployment with automatic failover capability
- **Reliability**: ECS service auto-scales based on load
- **Security**: All encryption requirements met (at-rest and in-transit)
- **Security**: IAM roles implement least privilege access
- **Security**: Security groups restrict access appropriately
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Resource Tagging**: All resources tagged with environment and project tags
- **Code Quality**: Python code follows CDKTF best practices
- **Code Quality**: Well-structured, readable, and properly documented
- **Testing**: Unit tests cover all stack constructs
- **Testing**: Integration tests verify deployed resources work correctly
- **Destroyability**: All infrastructure can be cleanly destroyed

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- VPC with public and private subnets across multiple AZs
- ECS Fargate cluster with task definition and service
- ElastiCache Redis cluster with encryption enabled
- EFS file system with encryption
- KMS keys for encryption
- IAM roles and policies for ECS tasks
- Security groups for ECS, ElastiCache, and EFS
- CloudWatch log groups for ECS container logs
- Unit tests in tests/unit/test_tap_stack.py
- Integration tests in tests/integration/test_tap_stack.py
- Proper resource tagging and naming with environmentSuffix
