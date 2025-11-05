# Pulumi TypeScript Multi-Environment ECS Infrastructure Prompt

You are an expert AWS infrastructure engineer specializing in Pulumi with TypeScript. Build a production-grade, multi-environment infrastructure for a containerized trading platform.

## Context
A financial services company requires identical infrastructure across dev, staging, and prod environments with zero configuration drift. Each environment must maintain the same architecture but scale appropriately.

## Technical Stack
- **IaC Tool**: Pulumi 3.x with TypeScript
- **Container Orchestration**: AWS ECS Fargate
- **Database**: RDS Aurora PostgreSQL
- **Load Balancing**: Application Load Balancers with ACM SSL
- **DNS**: Route53 with environment subdomains
- **Storage**: S3 with lifecycle policies
- **Monitoring**: CloudWatch dashboards and alarms
- **Secrets**: AWS Secrets Manager
- **Networking**: VPC peering for cross-environment communication

## Environment Specifications

### Scaling Configuration
- **ECS Task Counts**: dev: 1, staging: 2, prod: 4
- **RDS Instance Class**: All environments use db.t3.micro
- **S3 Log Retention**: dev: 7 days, staging: 30 days, prod: 90 days
- **VPC CIDR Blocks**: Must be distinct per environment to avoid peering conflicts

### DNS Structure
- dev: dev.example.com
- staging: staging.example.com
- prod: example.com

## Architecture Requirements

### Network Layer
- Deploy separate VPCs per environment with 3 availability zones
- Create public subnets for ALBs and private subnets for ECS/RDS
- Configure VPC peering between all environments with least-privilege security groups
- Ensure distinct CIDR blocks per environment

### Compute Layer
- Deploy ECS Fargate clusters with environment-specific task counts
- Use identical task definitions across environments (only resource allocation differs)
- Configure ECS tasks to access RDS through private networking only

### Database Layer
- Create RDS Aurora PostgreSQL clusters in private subnets
- Store all database passwords in AWS Secrets Manager
- Block all internet access to database endpoints
- Enable encryption at rest

### Load Balancing & DNS
- Deploy Application Load Balancers in public subnets
- Provision ACM SSL certificates for each environment
- Configure Route53 hosted zones with appropriate subdomains
- Create A records pointing to ALBs

### Storage & Logging
- Create S3 buckets for application logs with environment-specific lifecycle policies
- Enable CloudWatch Log Groups with AWS-managed KMS encryption
- Implement log aggregation per environment

### Monitoring
- Deploy identical CloudWatch dashboards across environments
- Configure alarms with environment-adjusted thresholds
- Set up metrics for ECS task health, RDS connections, and ALB response times

### Tagging Strategy
Apply consistent tags to all resources:
- Environment: dev/staging/prod
- Team: <team-name>
- CostCenter: <cost-center-id>

## Critical Constraints
1. All configurations MUST be driven by Pulumi stack config files—no hardcoded values
2. Resource naming pattern: `{project}-{environment}-{resource-type}-{identifier}`
3. Database endpoints accessible ONLY through ECS tasks
4. VPC peering security groups must follow least-privilege principle
5. CloudWatch Log Groups require encryption with AWS-managed KMS keys
6. ECS task definitions identical except resource allocation

## File Structure Requirements

Modify and output code ONLY for these files:

### lib/tap-stack.ts
Implement the complete stack with:
- Environment-aware configuration loading from Pulumi stack configs
- VPC creation with public/private subnet separation
- ECS Fargate cluster and service definitions
- RDS Aurora PostgreSQL cluster with Secrets Manager integration
- Application Load Balancer with target groups
- Route53 hosted zone and DNS records
- S3 buckets with lifecycle rules
- CloudWatch dashboards and alarms
- VPC peering connections and route table updates
- Security groups with proper ingress/egress rules
- Resource tagging implementation
- Export critical outputs (ALB DNS, RDS endpoint, VPC IDs)

### tests/tap-stack.unit.test.ts
Create comprehensive unit tests covering:
- Resource creation with correct properties
- Environment-specific configuration validation
- Naming convention compliance
- Tag presence and correctness
- Security group rule validation
- Lifecycle policy configuration
- VPC CIDR uniqueness checks
- Secrets Manager integration

### tests/tap-stack.int.test.ts
Implement integration tests verifying:
- Stack deployment succeeds for all environments
- VPC peering connections established correctly
- ECS tasks can connect to RDS
- ALB health checks pass
- Route53 records resolve properly
- S3 lifecycle policies applied
- CloudWatch alarms functional
- Cross-environment connectivity through peering
- Secrets Manager accessible from ECS tasks

## Implementation Guidelines
- Use Pulumi ComponentResource pattern for reusable infrastructure components
- Leverage Pulumi Config for environment-specific values
- Implement proper dependency management with `dependsOn` where needed
- Use Pulumi Stack References if sharing outputs between stacks
- Apply TypeScript strict mode and proper type definitions
- Include error handling and validation logic
- Document complex resource relationships with inline comments
- Use async/await patterns correctly for Pulumi Outputs

## Expected Deliverables
Provide complete, production-ready code for all three files demonstrating:
- Zero configuration drift across environments
- Proper resource isolation and security
- Environment-appropriate scaling
- Comprehensive test coverage
- Clean, maintainable TypeScript code
- Clear separation of concerns

Build infrastructure that can be deployed to dev, staging, and prod stacks using `pulumi up --stack <env>` with consistent architecture and environment-specific configurations.