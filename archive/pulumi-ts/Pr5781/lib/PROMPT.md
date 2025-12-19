# Pulumi TypeScript Multi-Environment AWS Infrastructure Prompt

You are an expert AWS infrastructure engineer. Create a Pulumi TypeScript program that deploys a multi-environment payment processing application infrastructure across three environments (dev, staging, prod).

## Architecture Requirements

### VPC & Networking

- Create VPCs with CIDR 10.0.0.0/16 per environment
- Deploy 2 public subnets (for ALB) and 2 private subnets (for ECS/RDS) across 2 AZs
- Configure NAT gateways for private subnet egress
- Create security groups for ALB, ECS, and RDS with appropriate ingress rules

### ECS Fargate Cluster

- Deploy ECS cluster with Fargate launch type
- Create task definitions with environment-specific CPU/memory: dev (512/1024), staging (1024/2048), prod (2048/4096)
- Configure container logging to CloudWatch log groups
- Set up ECS services with desired task count (dev: 1, staging: 2, prod: 3)

### Application Load Balancer

- Deploy ALB in public subnets with HTTP/HTTPS listeners
- Create target groups for ECS services with health check configuration
- Configure listener rules for path-based routing

### RDS Aurora PostgreSQL

- Create Aurora cluster with environment-specific instance types: dev (db.t3.medium), staging (db.r5.large), prod (db.r5.xlarge)
- Deploy read replicas for staging and production only
- Configure automated backups: dev (7 days), staging (30 days), prod (90 days)
- Set multi-AZ deployment for staging and production
- Create database subnet group and parameter group

### ECR & Container Registry

- Create ECR repositories per environment
- Configure lifecycle policies to retain last 10 images and delete untagged images after 30 days

### CloudWatch Integration

- Create log groups with retention: dev (7 days), staging (30 days), prod (90 days)
- Deploy alarms for ECS CPU/memory and RDS connections with environment-specific thresholds
- Configure CloudWatch dashboards

### IAM & Security

- Create ECS task execution roles with CloudWatch Logs permissions
- Create ECS task roles with ECR and S3 access
- Create RDS enhanced monitoring role
- Apply least-privilege policies across all roles

## Implementation Constraints

- Use **ComponentResource pattern** for reusable infrastructure components (VPC, ECS Cluster, RDS Cluster, ALB)
- Implement a **shared configuration interface** that all environments inherit from
- Tag all resources with: Environment, Project ("PaymentProcessor"), ManagedBy ("Pulumi")
- Export stack outputs for cross-environment references
- Use TypeScript interfaces with strict typing for all configuration parameters
- Load environment-specific values from Pulumi stack configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
- Implement stack references for multi-stack deployments

## Output Files

Only modify and create code in these three files:

1. **lib/tap-stack.ts** - Main stack implementation with ComponentResources
2. **test/tap-stack.unit.test.ts** - Unit tests for configuration logic and resource properties
3. **test/tap-stack.int.test.ts** - Integration tests validating resource creation and interdependencies

## Code Quality Requirements

- Use strict TypeScript types throughout
- Document ComponentResource constructors with JSDoc comments
- Include error handling for configuration validation
- Implement helper functions for common patterns (tagging, naming conventions)
- Write tests that verify resource properties and cross-resource relationships
