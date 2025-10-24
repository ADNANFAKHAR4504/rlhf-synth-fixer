# Educational Assessment Platform Infrastructure

Build a secure, scalable assessment delivery platform using CDKTF with Python for EduTech Solutions. The platform needs to support over 100,000 concurrent students taking online assessments while maintaining strict FERPA compliance.

## Background

EduTech Solutions is modernizing their assessment platform to handle the growing demand from large educational institutions. During peak examination periods, the system must support 100,000+ concurrent students accessing assessments, submitting answers, and receiving real-time feedback. The solution must maintain high availability across multiple availability zones in the London region (eu-west-2) and comply with educational data privacy regulations.

## Requirements

### Platform and Technology

- Use CDKTF with Python for infrastructure code
- Deploy all resources to eu-west-2 region (London)
- Include environment_suffix in all resource names for multi-environment support

### Core Infrastructure Components

#### Application Layer

- ECS Fargate cluster for running the assessment application with auto-scaling based on CPU and memory metrics
- Application Load Balancer for distributing traffic across multiple availability zones
- API Gateway REST API for external access to assessment endpoints with request throttling

#### Data Storage

- RDS Aurora PostgreSQL cluster with Multi-AZ deployment for student assessment data
- Enable encryption at rest using AWS KMS customer managed keys
- Configure automated backups with 7-day retention
- ElastiCache Redis cluster for session management and real-time caching of active assessments
- Deploy Redis across multiple availability zones for high availability

#### Real-Time Analytics

- Kinesis Data Streams for capturing student interaction events (answers submitted, time spent, progress)
- Kinesis Data Firehose for delivering analytics data to S3 for long-term analysis
- S3 bucket with server-side encryption for storing assessment analytics data

#### Secrets and Configuration

- AWS Secrets Manager for database credentials and API keys
- Enable automatic rotation for RDS database credentials (30-day rotation period)
- Store ElastiCache Redis connection strings in Secrets Manager

#### High Availability and Failure Recovery

- Deploy resources across at least 2 availability zones in eu-west-2
- Configure EventBridge Scheduler for automated health checks and recovery actions
- Implement retry policies with dead-letter queues for failed operations
- Set up AWS Fault Injection Service experiment template to test AZ failure scenarios

#### Monitoring and Observability

- CloudWatch log groups for ECS task logs, API Gateway logs, and application logs
- CloudWatch alarms for critical metrics: ECS CPU utilization, RDS connections, API Gateway 5xx errors
- CloudWatch dashboard displaying key performance indicators
- Enable X-Ray tracing for API Gateway and ECS tasks to track request flows

### Security and Compliance (FERPA)

#### Encryption

- All data encrypted at rest using KMS customer managed keys
- Enable encryption in transit using TLS 1.2 or higher
- RDS storage encryption enabled
- S3 bucket encryption enabled
- ElastiCache in-transit encryption enabled

#### Access Control

- Implement least privilege IAM roles for ECS tasks, Lambda functions (if needed), and services
- Security groups restricting traffic between layers (ALB to ECS, ECS to RDS, ECS to ElastiCache)
- Private subnets for RDS and ElastiCache with no direct internet access
- VPC endpoints for AWS services to avoid internet gateway traffic where possible

#### Audit and Compliance

- Enable CloudTrail for audit logging of all API calls
- Tag all resources with Environment, Owner, and DataClassification tags
- CloudWatch log retention set to 90 days minimum for compliance requirements

### Performance and Scalability

- ECS Fargate auto-scaling to handle 100,000+ concurrent users
- Target tracking scaling policies based on CPU (target 70%) and memory (target 75%)
- RDS Aurora read replicas for distributing read-heavy assessment retrieval queries
- ElastiCache Redis cluster with appropriate node types to handle session data for 100k+ users
- API Gateway with rate limiting (10,000 requests per second burst, 5,000 steady state)

## Deliverables

Provide complete CDKTF Python code that creates all infrastructure components described above. The code should be production-ready with proper error handling, resource dependencies, and configuration management. Include detailed comments explaining the architecture and how each component contributes to meeting the 100,000+ concurrent user requirement and FERPA compliance.
