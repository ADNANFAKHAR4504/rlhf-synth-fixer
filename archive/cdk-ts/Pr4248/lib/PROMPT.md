# PCI-DSS Compliant Payment Processing Infrastructure

## Background

PaySecure, a growing FinTech startup, needs to process credit card transactions securely. They require a containerized architecture that meets PCI-DSS compliance standards while handling sensitive payment data. The solution must automatically scale during peak traffic periods and ensure all data is encrypted both at rest and in transit.

## Task Description

Build a production-ready, PCI-DSS compliant payment processing infrastructure using AWS CDK with TypeScript. The system should process financial transactions through containerized microservices while maintaining the highest security standards and high availability.

## Technical Requirements

### Platform & Language
- **Platform**: AWS CDK v2.x
- **Language**: TypeScript
- **Region**: us-west-1 (N. California)

### Core AWS Services Required

1. **Amazon ECS (Fargate)** - Serverless containerized payment processing microservices
2. **Amazon RDS (PostgreSQL)** - Single-AZ encrypted database for transaction storage (optimized for development)
3. **Amazon ElastiCache Redis** - Single-node encrypted caching layer for session management (optimized for development)
4. **AWS Secrets Manager** - Secure credential storage with automatic rotation
5. **Amazon EFS** - Encrypted shared file system for containers
6. **Amazon API Gateway** - Secure REST API with VPC Link integration
7. **Amazon Kinesis Data Streams** - Real-time transaction event streaming
8. **AWS KMS** - Customer-managed encryption keys with automatic rotation
9. **AWS WAF** - Web application firewall for API protection
10. **CloudWatch** - Comprehensive monitoring, logging, and alerting

### Architecture Requirements

#### Network Security
- VPC with CIDR block 10.0.0.0/16
- Three-tier subnet architecture across 2 Availability Zones (us-west-1 limitation):
  - Public subnets for load balancers and NAT gateways
  - Private subnets for ECS tasks
  - Isolated database subnets for RDS and ElastiCache
- All container tasks must run in private subnets with no direct internet access
- Outbound traffic routed through NAT Gateways
- Security groups implementing least privilege access
- VPC Flow Logs for network traffic monitoring

#### Data Encryption Standards
- All data encrypted at rest using AWS KMS customer-managed keys
- All data encrypted in transit using TLS 1.2 or higher
- KMS keys configured with automatic annual rotation
- Separate KMS keys for each service (RDS, ElastiCache, EFS, Kinesis, Secrets Manager)
- Secrets Manager for all sensitive credentials (database passwords, API keys, application secrets)

#### High Availability Design
- Deployment optimized for fast provisioning while maintaining security
- RDS PostgreSQL in Single-AZ configuration with automated backups (30-day retention)
- ElastiCache Redis single-node deployment with encryption
- ECS services with auto-scaling policies (1-5 tasks)
- NAT Gateways deployed in each Availability Zone (2 AZs)
- Network Load Balancer for high-performance traffic distribution

#### PCI-DSS Compliance Requirements
- Network segmentation separating payment processing from other components
- CloudWatch Logs for comprehensive audit trails
- Encrypted storage for all cardholder data
- Automated credential rotation via Secrets Manager
- CloudWatch Alarms for security event monitoring
- WAF rules for common attack patterns

### Detailed Implementation Specifications

#### VPC and Networking
- VPC with 10.0.0.0/16 CIDR block
- 2 public subnets across 2 AZs (us-west-1a, us-west-1c)
- 2 private subnets across 2 AZs
- 2 isolated database subnets across 2 AZs
- Internet Gateway for public subnet connectivity
- 2 NAT Gateways (one per AZ) for private subnet internet access
- VPC Flow Logs sent to CloudWatch Logs
- Separate security groups for:
  - Load balancer
  - ECS tasks (allows traffic from VPC CIDR on port 80)
  - RDS database (allows traffic from ECS on port 5432)
  - ElastiCache Redis (allows traffic from ECS on port 6379)
  - EFS file system (allows NFS traffic from ECS on port 2049)

#### ECS Fargate Configuration
- Fargate launch type for serverless container management
- Task definition with 512 MB memory and 256 CPU units
- Container image: httpd:alpine (lightweight web server)
- Container health check using wget on port 80
- CloudWatch Logs integration with 3-month retention
- Task execution role with permissions for:
  - Pulling container images from ECR
  - Reading from Secrets Manager
  - Writing logs to CloudWatch
- Task role with permissions for:
  - Writing to Kinesis streams
  - Reading from Secrets Manager
- Service configuration:
  - Desired count: 1 task
  - Min healthy percent: 0 (for faster deployments)
  - Max healthy percent: 200
  - Deployment circuit breaker explicitly disabled
  - Health check integration with NLB target group
- Auto-scaling configuration:
  - Scale between 1-5 tasks
  - CPU-based scaling at 70% utilization
  - Memory-based scaling at 80% utilization
  - Scale in/out cooldown: 30 seconds

#### Database Configuration
- RDS PostgreSQL 16.6
- Instance class: db.t3.medium
- Storage: 100 GB GP3 with auto-scaling up to 500 GB
- Single-AZ deployment for faster provisioning
- KMS encryption using customer-managed key
- Automated backups with 30-day retention
- Performance Insights enabled with KMS encryption
- CloudWatch Logs exports for PostgreSQL and upgrade logs (3-month retention)
- Security group allowing access only from ECS security group on port 5432
- Credentials stored in Secrets Manager with automated 30-day rotation
- Deletion protection disabled for development (enable for production)

#### Caching Layer
- ElastiCache Redis 7.1
- Node type: cache.t3.micro
- Single-node deployment (no replication for development)
- Encryption at rest using customer-managed KMS key
- Encryption in transit enabled (TLS required mode)
- Automatic minor version upgrades enabled
- 7-day snapshot retention with backup window 03:00-05:00 UTC
- Maintenance window: Sunday 05:00-07:00 UTC
- CloudWatch Logs delivery for slow-log queries (JSON format)
- Security group allowing access only from ECS security group on port 6379
- Subnet group across private subnets in both AZs

#### Shared Storage
- EFS file system with encryption at rest
- Mount targets in each private subnet
- Performance mode: General Purpose
- Throughput mode: Bursting
- Security group allowing NFS traffic from ECS security group

#### Load Balancing
- Network Load Balancer (Layer 4) for VPC Link compatibility
- Deployed in public subnets across both AZs
- Target group with IP target type for Fargate
- Optimized health checks:
  - Protocol: TCP on port 80
  - Interval: 10 seconds
  - Timeout: 5 seconds
  - Healthy threshold: 2
  - Unhealthy threshold: 2
- Deregistration delay: 10 seconds (for faster deployments)
- Cross-zone load balancing enabled
- VPC Link for private API Gateway integration

#### API Gateway
- REST API with regional endpoint
- VPC Link integration to ECS via Network Load Balancer
- HTTP_PROXY integration type for flexibility
- API key authentication
- Usage plan with throttling:
  - Rate limit: 1000 requests per second
  - Burst limit: 2000 requests
- CloudWatch logging for all requests
- WAF association for security:
  - Rate-based rule (limit 2000 requests per 5 minutes)
  - Common attack pattern blocking
  - IP-based access control capabilities

#### Event Streaming
- Kinesis Data Stream for transaction events
- 3 shards in provisioned mode
- 24-hour data retention
- Server-side encryption with customer-managed KMS key
- Stream mode: PROVISIONED

#### Secrets Management
- Database secret with auto-generated password
- Application secret for JWT and API keys
- Lambda-based rotation for database secret every 30 days
- KMS encryption for all secrets
- VPC endpoint for Secrets Manager access

#### Monitoring and Alerting
- CloudWatch Dashboard with 9 widgets:
  - ECS Service CPU and Memory utilization
  - NLB Active connections and Target response time
  - Database CPU and Connection count
  - API Gateway Request count and Latency
  - Kinesis Incoming records
- CloudWatch Alarms (6 total):
  - API 4xx errors (threshold: 100 in 5 minutes)
  - API 5xx errors (threshold: 10 in 5 minutes)
  - Database CPU (threshold: 80%, 2 evaluation periods)
  - ECS Service CPU (threshold: 80%, 2 evaluation periods)
  - ECS Service Memory (threshold: 85%, 2 evaluation periods)
  - NLB unhealthy hosts (threshold: 1 unhealthy, 2 evaluation periods)
- SNS topic for alarm notifications
- All alarms use TreatMissingData: NOT_BREACHING

## Implementation Constraints

1. **Security First**: Every component must be configured with security best practices
2. **Zero Trust Network**: Components in private subnets cannot directly access the internet
3. **Encryption Everywhere**: All data encrypted at rest and in transit using customer-managed KMS keys
4. **Least Privilege**: IAM roles grant only necessary permissions
5. **Audit Trail**: All API calls and data access logged to CloudWatch
6. **Automated Rotation**: Database credentials rotate every 30 days via Lambda
7. **Fast Deployment**: Optimized for quick provisioning with Single-AZ RDS and single-node ElastiCache
8. **Cost Optimization**: Use appropriate instance sizes for development workloads
9. **Regional Limitation**: us-west-1 has only 2 Availability Zones (us-west-1a, us-west-1c)

## Code Structure Requirements

The implementation should follow a modular stack design:

1. **Main Stack** (`tap-stack.ts`) - Orchestrates all nested stacks
2. **KMS Stack** (`kms-stack.ts`) - Customer-managed encryption keys
3. **Network Stack** (`network-stack.ts`) - VPC, subnets, security groups
4. **Secrets Stack** (`secrets-stack.ts`) - Secrets Manager resources
5. **Database Stack** (`database-stack.ts`) - RDS PostgreSQL instance
6. **Cache Stack** (`cache-stack.ts`) - ElastiCache Redis cluster
7. **Storage Stack** (`storage-stack.ts`) - EFS file system
8. **Compute Stack** (`compute-stack.ts`) - ECS cluster, service, load balancer
9. **API Stack** (`api-stack.ts`) - API Gateway, WAF
10. **Streaming Stack** (`streaming-stack.ts`) - Kinesis Data Streams
11. **Monitoring Stack** (`monitoring-stack.ts`) - CloudWatch dashboards and alarms

## Expected Deliverables

1. Complete, working CDK TypeScript code
2. Modular stack design with clear separation of concerns
3. All security requirements properly implemented
4. Auto-scaling policies for ECS services
5. Comprehensive monitoring and alerting setup
6. Stack outputs for API endpoints and resource identifiers

## Success Criteria

- All AWS services deploy successfully without errors
- PCI-DSS compliance requirements fully met
- Encryption configured for all data at rest and in transit using customer-managed KMS keys
- Infrastructure deployed across 2 Availability Zones (us-west-1 limitation)
- Auto-scaling responds to CPU/Memory utilization changes
- Security best practices followed throughout
- Code is clean, modular, and production-ready
- Stack deploys quickly (optimized for fast provisioning)
- All security groups follow least-privilege principles
- Comprehensive monitoring and alerting configured
- Database credentials automatically rotate every 30 days
