# Containerized Learning Management System Infrastructure

Hey team,

We need to build infrastructure for EduTech Singapore's modernized Learning Management System platform. I've been asked to create this using **CloudFormation with YAML**. The business is facing challenges with their existing LMS during peak exam periods, and they need a solution that can handle 50,000+ concurrent users while keeping sensitive student data secure and compliant with Singapore's regulations.

The current system struggles with scalability during high-traffic periods, lacks proper security controls for student data, and doesn't provide the real-time analytics that educators need to track learning patterns. We're going containerized to ensure consistency across environments and enable faster deployments. The platform needs to meet Singapore's Personal Data Protection Act (PDPA) requirements, which means strict encryption, access controls, and audit logging.

This is a critical project for the Singapore education sector. The system will be used by multiple institutions across the region, so reliability and performance are non-negotiable. We need multi-AZ deployment to hit that 99.99% availability target, and the infrastructure must scale up within 2 minutes when user load increases.

## What we need to build

Create a containerized Learning Management System infrastructure using **CloudFormation with YAML** for EduTech Singapore's educational platform in the eu-west-1 region.

### Core Requirements

1. **Container Platform**
   - ECS Fargate cluster for running the LMS application containers
   - Support for automatic scaling based on concurrent user metrics
   - Multi-AZ deployment for high availability

2. **Data Storage**
   - RDS Aurora cluster for student data, assignments, and grades
   - Encryption at rest for all database storage
   - Multi-AZ configuration for database failover
   - ElastiCache Redis cluster for session management and caching
   - EFS for shared storage of course materials, videos, and documents

3. **API and Integration Layer**
   - API Gateway for RESTful API management
   - Support for authentication and rate limiting
   - Integration with backend services

4. **Analytics and Monitoring**
   - Kinesis Data Streams for real-time analytics on learning patterns
   - Stream student activity data for analysis
   - Support for downstream processing pipelines

5. **CI/CD Pipeline**
   - CodePipeline for continuous deployment of application updates
   - Automated build and deployment workflows
   - Integration with source control

6. **Security Management**
   - SecretsManager for storing database credentials and API keys
   - Automatic rotation of secrets every 30 days
   - Secure credential retrieval for applications

7. **Network Security**
   - NAT Gateway for secure outbound internet communication
   - Private subnets for sensitive resources
   - Security groups with least privilege access

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **ECS Fargate** for containerized application hosting
- Use **RDS Aurora** for relational database with encryption
- Use **ElastiCache Redis** for session management
- Use **EFS** for shared file storage
- Use **API Gateway** for API management
- Use **Kinesis Data Streams** for real-time analytics
- Use **CodePipeline** for CI/CD automation
- Use **SecretsManager** for credential management with automatic rotation
- Use **NAT Gateway** for secure outbound connectivity
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **eu-west-1** region

### Constraints

- System must maintain 99.99% availability with multi-AZ deployment
- Infrastructure must scale up within maximum 2 minutes for load increases
- All database credentials and API keys must rotate automatically every 30 days
- Must meet Singapore's Personal Data Protection Act (PDPA) compliance requirements
- Encryption at rest for all data stores using AWS KMS
- Encryption in transit using TLS/SSL
- Principle of least privilege for all IAM roles and policies
- All resources must be destroyable with no Retain deletion policies
- Enable comprehensive CloudWatch logging and monitoring

## Success Criteria

- **Functionality**: All 9 AWS services properly configured and integrated
- **Performance**: System scales to handle 50,000+ concurrent users with sub-2-minute scale-up
- **Reliability**: Multi-AZ deployment achieves 99.99% availability target
- **Security**: PDPA compliance met with encryption at rest and in transit, automatic secret rotation every 30 days
- **Resource Naming**: All resources include environmentSuffix parameter for environment isolation
- **Code Quality**: Clean YAML, well-structured CloudFormation template, comprehensive documentation
- **Destroyability**: All resources can be cleanly deleted without manual intervention

## What to deliver

- Complete CloudFormation YAML template implementation
- ECS Fargate cluster with auto-scaling configuration
- RDS Aurora cluster with encryption and multi-AZ setup
- ElastiCache Redis cluster for session management
- EFS file system for shared course materials
- API Gateway with proper integration
- Kinesis Data Streams for analytics pipeline
- CodePipeline for automated deployments
- SecretsManager with 30-day rotation policy
- NAT Gateway for secure outbound traffic
- Comprehensive IAM roles and security groups
- CloudWatch logging and monitoring configuration
- Unit tests validating template structure
- Integration tests using cfn-outputs/flat-outputs.json
- Documentation covering deployment and architecture
