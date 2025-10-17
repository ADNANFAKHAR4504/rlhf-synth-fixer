You are a Senior Cloud Engineer with expertise in AWS.

# Global
- Primary region: `us-east-1`; Secondary region: `us-east-2`.
- Business context: financial-services trading platform processing millions of transactions daily; **strict data consistency**, **minimal downtime**.
- DR objective: **automatic failover to secondary within 30 seconds** of primary-region failure detection, driven by health checks and DNS updates.
- Variables (must be declared and parameterized):
  - `primary_region`: AWS region for primary deployment  
  - `secondary_region`: AWS region for secondary deployment  
  - `vpc_cidr_blocks`: CIDR blocks for both regions  
  - `database_instance_class`: Aurora instance type  
  - `backup_retention_period`: Backup retention duration in days  
  - `environment`: Deployment environment (prod/staging)  
  - `kms_deletion_window`: KMS key deletion window  
  - `route53_domain`: Domain name for DNS configuration

# VPC / Networking
- Provide `vpc_cidr_blocks` for **both regions** to host application and database networking.
- Ensure routing and security constructs support cross-region DR architecture (no assumptions beyond CIDR inputs).

# Aurora Global Database
- Use **Aurora Global Database** spanning `us-east-1` (primary) and `us-east-2` (secondary).
- Configure instance class via `database_instance_class`.
- Set automated backups with `backup_retention_period`.
- Configure global database topology to support **automatic failover** to the secondary region aligned with the **≤30s** failover objective (triggered by external health events/DNS).

# Route 53 (DNS + Health Checks)
- Hosted zone under `route53_domain`.
- **Health checks** monitoring primary-region endpoints.
- **Failover routing policy** that updates DNS to secondary when primary is unhealthy, targeting **≤30s** failover requirement.

# Application Load Balancers
- Expose application endpoints behind **ALB**.
- Integrate ALB targets with Route 53 health checks for failover decisions (no additional target details provided).
- Point it to EC2 instances (create a variable for the number of instancer per region).

# AWS Lambda (Failover Automation)
- Lambda functions to orchestrate failover actions based on health events.
- Permissions sufficient to:
  - Switch Aurora Global Database roles (as applicable to the service).
  - Update Route 53 records for failover.

# Amazon EventBridge (Monitoring & Triggers)
- Event rules capturing health signals and failure conditions.
- Targets: **Lambda** for initiating automated failover workflows.
- Ensure event-to-action path supports **≤30s** end-to-end failover SLA.

# AWS Secrets Manager
- Store application/database credentials.
- Encrypt secrets with **KMS** (customer-managed keys).
- Access scoped only to components that require credentials (no additional policy details provided).

# AWS KMS
- Create customer-managed keys with `kms_deletion_window`.
- Use KMS keys across **Aurora**, **Secrets Manager**, and any service in scope that stores data at rest.
- Enforce encryption-in-transit requirements by using TLS-enabled endpoints; KMS for at-rest coverage across all resources.

---

# File Structure
- `provider.tf` (already present)  
  - Configure the Terraform **S3 backend** for remote state (all identifiers/paths parameterized).  
- `lib/tap_stack.tf`  
  - Declare **all variables** (including `aws_region`) with default value set.
  - Define **locals** for resource naming conventions, tags, CIDR blocks, toggles, and IP ranges.  
  - **Implement resources**:  
  - **Outputs**:  
    Expose IDs/ARNs/hosts/endpoints for all key resources for integration tests purposes.