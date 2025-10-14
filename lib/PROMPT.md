# PCI-DSS Compliant Payment Processing Infrastructure

## Background

PaySecure, a growing FinTech startup, needs to process credit card transactions securely. They require a containerized architecture that meets PCI-DSS compliance standards while handling sensitive payment data. The solution must automatically scale during peak traffic periods and ensure all data is encrypted both at rest and in transit.

## Task Description

Build a production-ready, PCI-DSS compliant payment processing infrastructure using AWS CDK with TypeScript. The system should process financial transactions through containerized microservices while maintaining the highest security standards and high availability.

## Technical Requirements

### Platform & Language
- **Platform**: AWS CDK v2.x
- **Language**: TypeScript
- **Region**: us-west-2 (Oregon)

### Core AWS Services Required

1. **Amazon ECS (Fargate)** - Serverless containerized payment processing microservices
2. **Amazon RDS (PostgreSQL)** - Multi-AZ encrypted database for transaction storage
3. **Amazon ElastiCache Redis** - Encrypted caching layer for session management
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
- Three-tier subnet architecture across 3 Availability Zones:
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
- Multi-AZ deployment for all critical components
- RDS PostgreSQL in Multi-AZ configuration with automated backups
- ElastiCache Redis with replication groups
- ECS services with auto-scaling policies
- NAT Gateways deployed in each Availability Zone
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
- 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- 3 private subnets (10.0.3.0/24, 10.0.4.0/24, 10.0.5.0/24)
- 3 database subnets (10.0.6.0/24, 10.0.7.0/24, 10.0.8.0/24)
- Internet Gateway for public subnet connectivity
- NAT Gateways in each public subnet for private subnet internet access
- VPC Flow Logs sent to CloudWatch Logs
- Separate security groups for:
  - Load balancer
  - ECS tasks
  - RDS database
  - ElastiCache Redis
  - EFS file system

#### ECS Fargate Configuration
- Fargate launch type for serverless container management
- Task definition with 512 MB memory and 256 CPU units
- Container image: httpd:alpine (lightweight web server)
- CloudWatch Logs integration for container logging
- Task execution role with permissions for:
  - Pulling container images
  - Reading from Secrets Manager
  - Writing logs to CloudWatch
- Task role with permissions for:
  - Writing to Kinesis streams
  - Reading from Secrets Manager
- Service configuration:
  - Desired count: 1 task
  - Deployment circuit breaker disabled for more control
  - Health check integration with target group
- Auto-scaling configuration:
  - Scale between 1-5 tasks
  - CPU-based scaling at 70% utilization
  - Memory-based scaling at 80% utilization

#### Database Configuration
- RDS PostgreSQL 14.x
- Instance class: db.t3.micro
- Storage: 20 GB GP2 with encryption
- Multi-AZ deployment enabled
- Automated backups with 7-day retention
- Performance Insights enabled for monitoring
- Security group allowing access only from ECS security group on port 5432
- Credentials stored in Secrets Manager with 30-day rotation

#### Caching Layer
- ElastiCache Redis 7.0
- Node type: cache.t3.micro
- Replication group with automatic failover
- Encryption at rest using KMS
- Encryption in transit enabled
- Auth token authentication
- CloudWatch Logs for slow queries
- Security group allowing access only from ECS security group on port 6379

#### Shared Storage
- EFS file system with encryption at rest
- Mount targets in each private subnet
- Performance mode: General Purpose
- Throughput mode: Bursting
- Security group allowing NFS traffic from ECS security group

#### Load Balancing
- Network Load Balancer (Layer 4) for VPC Link compatibility
- Deployed in public subnets across all AZs
- Target group with IP target type
- Health checks on port 80 with 10-second intervals
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
- 1 shard for development workloads
- 24-hour data retention
- Server-side encryption with KMS
- Enhanced fan-out disabled to reduce costs

#### Secrets Management
- Database secret with auto-generated password
- Application secret for JWT and API keys
- Lambda-based rotation for database secret every 30 days
- KMS encryption for all secrets
- VPC endpoint for Secrets Manager access

#### Monitoring and Alerting
- CloudWatch Dashboard with:
  - API Gateway metrics (requests, latency, errors)
  - ECS metrics (CPU, memory, task count)
  - RDS metrics (connections, CPU, storage)
  - ElastiCache metrics (CPU, memory, connections)
  - Kinesis metrics (throughput, iterator age)
- CloudWatch Alarms for:
  - API 4xx errors (threshold: 100)
  - API 5xx errors (threshold: 50)
  - Database CPU (threshold: 80%)
  - ECS Service CPU (threshold: 80%)
  - ECS Service Memory (threshold: 80%)
  - NLB unhealthy hosts
- SNS topic for alarm notifications

## Implementation Constraints

1. **Security First**: Every component must be configured with security best practices
2. **Zero Trust Network**: Components in private subnets cannot directly access the internet
3. **Encryption Everywhere**: All data encrypted at rest and in transit
4. **Least Privilege**: IAM roles grant only necessary permissions
5. **Audit Trail**: All API calls and data access logged to CloudWatch
6. **Automated Rotation**: Database credentials rotate every 30 days
7. **Multi-AZ Resilience**: Critical components survive AZ failures
8. **Cost Optimization**: Use appropriate instance sizes for development workloads

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
- Encryption configured for all data at rest and in transit
- High availability across multiple Availability Zones
- Auto-scaling responds to traffic changes
- Security best practices followed throughout
- Code is clean, modular, and production-ready
- Stack deploys in approximately 15-20 minutes
