# Multi-Region Disaster Recovery Architecture

Hey team,

We need to build a robust disaster recovery solution for a payment processing application. A financial services company recently experienced a 4-hour outage in their primary region that caused significant revenue loss, and they need us to design and implement an active-passive DR architecture that can handle failover in under 15 minutes while maintaining data consistency.

The business has made it clear that reliability is paramount - they process critical payment transactions and cannot afford extended downtime. They want a solution that automatically detects failures and fails over to the DR region with minimal human intervention. The architecture needs to span us-east-1 as the primary region and us-west-2 as the disaster recovery region.

This is an expert-level infrastructure challenge that requires careful orchestration of multiple AWS services across two regions, with automated health monitoring and failover capabilities. The infrastructure must be deployable and destroyable without manual intervention, as it will be used in our CI/CD pipeline for validation.

## What we need to build

Create a multi-region disaster recovery architecture using **Terraform with HCL** for a payment processing application. The solution must implement active-passive failover between us-east-1 (primary) and us-west-2 (DR) with automated health monitoring and DNS-based routing.

### Core Requirements

1. **Aurora PostgreSQL Global Database**
   - Deploy Aurora PostgreSQL Global Database with primary cluster in us-east-1
   - Configure secondary cluster in us-west-2 for read replicas and failover
   - Enable automated backups with 7-day retention in both regions
   - Configure backup retention period of 7 days minimum
   - Use skip_final_snapshot = true for resource destroyability
   - Set deletion_protection = false for resource destroyability

2. **ECS Fargate Multi-Region Deployment**
   - Configure ECS Fargate services in us-east-1 running payment application containers
   - Configure ECS Fargate services in us-west-2 as standby (can be scaled down to 0)
   - Implement auto-scaling policies for both regions
   - Connect ECS services to appropriate Aurora clusters (primary in us-east-1, secondary in us-west-2)
   - Configure proper security group associations for ECS services

3. **Route53 Health Checks and Failover**
   - Set up Route53 health checks monitoring primary region availability
   - Configure failover routing policy for automatic DNS failover
   - Implement health check alarms with appropriate thresholds
   - Ensure health checks monitor actual application endpoints, not just EC2 instances

4. **Multi-Region VPC Architecture**
   - Create VPC in us-east-1 with 3 private subnets across 3 availability zones
   - Create VPC in us-west-2 with 3 private subnets across 3 availability zones
   - Use non-overlapping CIDR blocks for both VPCs
   - Configure appropriate subnet groups for Aurora clusters in both regions
   - Ensure private subnets have proper routing for database access

5. **CloudWatch Monitoring and Alarms**
   - Configure CloudWatch alarms for database replication lag exceeding 30 seconds
   - Set up alarms for ECS service health in both regions
   - Implement monitoring for Route53 health check status
   - Configure SNS topics for alarm notifications

6. **Backup and Recovery**
   - Configure automated Aurora backups with 7-day retention in both regions
   - Ensure backup settings allow for point-in-time recovery
   - Set appropriate backup windows to minimize performance impact

7. **Terraform Workspaces Management**
   - Use Terraform workspaces or separate configurations to manage both regional deployments
   - Alternatively, use modules with region-specific instantiation
   - Ensure proper state management for multi-region deployment

8. **Resource Tagging**
   - Apply consistent tags to all resources: Environment, Region, Application, CostCenter
   - Use tags for cost allocation and resource organization
   - Ensure tags are propagated to all child resources

### Optional Enhancements

If time permits, consider adding:

- **AWS Backup Integration**: Centralized backup management across both regions for unified backup governance
- **EventBridge Rules**: Configure EventBridge rules for failover notifications to enable automated alerting
- **Lambda Post-Failover Validation**: Create Lambda functions to validate application functionality after failover for automated recovery verification

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Aurora PostgreSQL Global Database** for cross-region replication
- Use **ECS Fargate** for containerized payment application
- Use **Route53** for health-check based DNS failover
- Use **VPC** with private subnets across 3 AZs in each region
- Use **CloudWatch** for monitoring and alarms
- Deploy to **us-east-1** (primary) and **us-west-2** (DR) regions
- Resource names must include **var.environment_suffix** for uniqueness
- Follow naming convention: `{resource-type}-${var.environment_suffix}`
- All resources must be destroyable (use skip_final_snapshot = true for RDS, deletion_protection = false)
- No RemovalPolicy.RETAIN or DeletionPolicy: Retain allowed
- Include proper error handling and validation

### Constraints

- RTO (Recovery Time Objective) must be under 15 minutes
- RPO (Recovery Point Objective) must be under 5 minutes - configure replication accordingly
- Use Aurora Global Database for automated cross-region replication
- Implement automated health checks with Route53 for failover detection
- Primary region must be us-east-1, DR region must be us-west-2
- All resources must have consistent tagging for cost allocation
- Backup retention must be at least 7 days in both regions
- All named resources must be unique using environment suffix

## Deployment Requirements (CRITICAL)

These requirements are MANDATORY for successful deployment:

1. **Resource Naming with environmentSuffix**:
   - ALL named resources MUST include var.environment_suffix
   - Pattern: `resource-name-${var.environment_suffix}`
   - This prevents naming conflicts in parallel CI/CD deployments
   - Examples: `aurora-primary-${var.environment_suffix}`, `ecs-cluster-${var.environment_suffix}`

2. **Resource Destroyability**:
   - Use `skip_final_snapshot = true` for all Aurora/RDS clusters
   - Set `deletion_protection = false` for all Aurora/RDS clusters
   - NO prevent_destroy lifecycle rules allowed
   - NO DeletionPolicy: Retain or retention_policy: Retain
   - All resources must be cleanly destroyable via terraform destroy

3. **AWS Service-Specific Warnings**:
   - **GuardDuty**: Do not create GuardDuty detectors (account-level limit of 1 per region)
   - **AWS Config**: If using Config, use managed policy `service-role/AWS_ConfigRole`
   - **Lambda**: If using Lambda, ensure Node.js 18+ compatibility (AWS SDK v3, not v2)
   - **Aurora Global Database**: Secondary cluster requires primary cluster to be fully available (20-30 min), consider depends_on

4. **Multi-Region Configuration**:
   - Configure AWS provider for both us-east-1 and us-west-2
   - Use provider aliases for region-specific resources
   - Ensure Aurora Global Database spans both regions correctly

5. **Variables**:
   - Define environment_suffix variable (string type, no default)
   - Pass environment_suffix to all resource names
   - Define any other required variables (region, tags, etc.)

## Success Criteria

- **Functionality**: Complete multi-region DR architecture with automated failover
- **RTO Compliance**: Failover completes in under 15 minutes
- **RPO Compliance**: Data replication lag under 5 minutes (monitored via CloudWatch)
- **Reliability**: Health checks properly detect failures and trigger DNS failover
- **Security**: Aurora encryption enabled, private subnets, proper security groups
- **Resource Naming**: All resources include environment_suffix for uniqueness
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: Clean HCL code, well-structured modules, comprehensive documentation
- **Monitoring**: CloudWatch alarms for replication lag, health checks, and service health
- **Cost Optimization**: Use Aurora Serverless where possible, minimize NAT Gateway usage

## What to deliver

- Complete Terraform HCL configuration files (main.tf, variables.tf, outputs.tf, providers.tf)
- Terraform modules for reusable components (VPC, Aurora, ECS, Route53)
- Variables file defining all configurable parameters including environment_suffix
- Outputs file exposing key resource identifiers and endpoints
- Provider configuration for multi-region deployment (us-east-1 and us-west-2)
- Unit tests validating Terraform configuration syntax and structure
- Integration tests validating deployed resource configuration (post-deployment)
- Documentation explaining architecture, deployment process, and failover procedures (lib/README.md)
