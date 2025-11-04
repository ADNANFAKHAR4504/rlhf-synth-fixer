# AWS Infrastructure Migration - Pulumi TypeScript Prompt

## Role and Context

You are an expert AWS infrastructure engineer specializing in Pulumi TypeScript implementations. You will create production-grade infrastructure code for migrating a fintech payment processing system from development to production with zero-downtime.

## Task

Build a complete Pulumi TypeScript infrastructure-as-code solution that migrates an existing development RDS MySQL environment to production with enhanced security, high availability, and blue-green deployment capabilities.

## Infrastructure Requirements

### VPC and Networking

- VPC CIDR: 10.0.0.0/16 in us-east-1
- Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (AZs: us-east-1a, us-east-1b, us-east-1c)
- Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- NAT Gateways in each AZ for private subnet egress

### RDS Configuration

- Import existing dev RDS MySQL 8.0 instance
- Create production replica with Multi-AZ deployment
- Enable encryption at rest (AES-256)
- Automated backups with 7-day retention
- Point-in-time recovery enabled
- Create from snapshot with transaction consistency

### EC2 Blue-Green Deployment

- Transition from t3.micro (dev) to m5.large (prod)
- Auto Scaling Groups across 3 AZs
- IMDSv2 enforced for metadata access
- Application Load Balancer with health checks

### Route53 Traffic Management

- Weighted routing policy for gradual traffic shift: 0% → 10% → 50% → 100%
- DNS TTL: 60 seconds maximum

### S3 Configuration

- Production log buckets with lifecycle policies
- Cross-region replication for disaster recovery
- Encryption in transit and at rest

### Security Groups

- Internet-facing: HTTPS (443) only
- Application tier: Restricted to ALB
- Database tier: Access only from application subnet

### CloudWatch Monitoring

- CPU utilization alarms
- Database connection count monitoring
- Application health check metrics

### IAM Configuration

- Least privilege roles for EC2 to access RDS and S3
- Service-specific policies with explicit resource ARNs

### Resource Management

- Naming pattern: `prod-{service}-{az}-{random}`
- Tags: `Environment=production`, `ManagedBy=pulumi`
- All operations must be idempotent
- Support rollback within 15 minutes

## Output Structure

Create three files with the following implementations:

### 1. lib/tap-stack.ts

- Main Pulumi stack class extending `pulumi.ComponentResource`
- Organize resources into logical groups: networking, compute, database, storage, monitoring
- Implement resource connections with explicit dependencies
- Use Pulumi's `import` for existing dev resources
- Export stack outputs for endpoints and resource IDs

### 2. tests/tap-stack.unit.test.ts

- Test resource configurations (instance types, encryption settings)
- Validate security group rules
- Verify IAM policy least privilege principles
- Check resource naming conventions and tagging
- Test subnet CIDR allocations

### 3. tests/tap-stack.int.test.ts

- Test VPC connectivity between subnets
- Verify RDS accessibility from application tier
- Validate ALB to EC2 connectivity
- Test S3 bucket access from EC2 instances
- Verify Route53 DNS resolution
- Test CloudWatch alarm creation and thresholds

## Critical Implementation Details

### Resource Connections

- VPC → Subnets → NAT Gateways → Route Tables
- Security Groups → EC2 Instances ← IAM Roles
- ALB → Target Groups → Auto Scaling Groups
- RDS Subnet Group → RDS Instance ← Security Group
- CloudWatch Alarms → SNS Topics (for notifications)
- Route53 → ALB (weighted routing)

### Encryption Requirements

- RDS: `storageEncrypted: true`, `kmsKeyId: <key-arn>`
- S3: Server-side encryption with AES-256
- EBS volumes: Encrypted by default

### Blue-Green Deployment Strategy

1. Create new prod Auto Scaling Group with m5.large
2. Register instances with ALB target group
3. Health check validation
4. Gradual Route53 weight adjustment
5. Drain connections from dev instances
6. Terminate dev resources after successful cutover

### Snapshot Migration Process

1. Create final snapshot of dev RDS with consistent state
2. Tag snapshot with migration metadata
3. Create prod RDS from snapshot with enhanced config
4. Enable Multi-AZ after initial creation
5. Update application connection strings via parameter store

## Code Style Requirements

- Use TypeScript strict mode
- Implement proper error handling with try-catch blocks
- Add JSDoc comments for complex resource configurations
- Use Pulumi's `Output<T>` type for dependent resources
- Implement stack outputs with meaningful names
- Use `pulumi.all()` for combining multiple outputs

## Deliverable Format

Provide complete, production-ready code for all three files with:

- Clear section comments
- Resource dependency documentation
- Migration rollback instructions in comments
- Performance and cost optimization notes

## Success Criteria

The implementation must demonstrate:

- Proper resource interdependencies ensuring correct creation order
- Zero-downtime migration capability
- Production-grade security configurations
- Comprehensive test coverage (unit and integration)
- Idempotent operations supporting safe re-runs
- Clear rollback procedures documented in code comments

Generate the infrastructure code focusing on resource interdependencies and production resilience.
