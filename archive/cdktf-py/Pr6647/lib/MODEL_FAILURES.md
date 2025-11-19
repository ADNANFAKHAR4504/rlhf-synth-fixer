# Model Failures Documentation - Task 2m6t7h

## Overview

The initial implementation provided a CDKTF Python implementation for a multi-region payment processing migration system. While the code structure was largely correct (approximately 75% complete), it contained 13 significant issues across resource naming, security configuration, monitoring completeness, and secondary region setup. These failures represent realistic mistakes that would prevent successful deployment or violate critical requirements.

## Failures Identified

### 1. Missing environmentSuffix in VPC Names

**Location**: `stacks/networking.py`, lines 216 and 228
**Problem**: VPC resource names are missing the environmentSuffix parameter. Both primary and secondary VPCs use `f"payment-vpc-{migration_phase}"` instead of including the environment suffix.
**Fix**: Changed to `f"payment-vpc-{migration_phase}-{environment_suffix}"`
**Category**: B (Moderate - Resource Naming)
**Learning Value**: This is a critical deployment requirement. Without environmentSuffix, multiple deployments in the same account will conflict. The requirement was explicitly stated in PROMPT.md under "Deployment Requirements (CRITICAL)" section. Models must include environmentSuffix in ALL named resources.

### 2. Missing environmentSuffix in KMS Aliases

**Location**: `stacks/security.py`, lines 849 and 868
**Problem**: KMS key aliases are missing environmentSuffix. Both primary and secondary aliases use `alias/payment-primary` and `alias/payment-secondary` without the environment suffix.
**Fix**: Changed to `f"alias/payment-primary-{environment_suffix}"` and `f"alias/payment-secondary-{environment_suffix}"`
**Category**: B (Moderate - Resource Naming)
**Learning Value**: KMS aliases are globally unique within an account. Without environmentSuffix, multiple deployments will fail with "alias already exists" errors. This demonstrates that suffix requirements apply to ALL AWS resources with names, not just obvious ones like VPCs and ECS clusters.

### 3. Hardcoded Database Password

**Location**: `stacks/database.py`, line 435
**Problem**: Aurora cluster uses hardcoded password "ChangeMe12345!" directly in code
**Fix**: Use AWS Secrets Manager to generate and store password securely, reference via data source
**Category**: A (Critical - Security)
**Learning Value**: Hardcoded credentials are a critical security vulnerability, especially for PCI-compliant payment processing systems. Passwords must be stored in Secrets Manager or Parameter Store and rotated regularly. This is a common mistake that creates immediate security risks.

### 4. Missing Database Encryption Configuration

**Location**: `stacks/database.py`, lines 422-424 and 439-441
**Problem**: Aurora Global Cluster and regional clusters are missing encryption configuration. No `storage_encrypted=True` or `kms_key_id` parameters set.
**Fix**: Added `storage_encrypted=True` and `kms_key_id=security.primary_kms_key.arn` (or secondary key for secondary cluster)
**Category**: A (Critical - Security & Compliance)
**Learning Value**: PCI compliance requires encryption at rest for all data. The PROMPT.md explicitly stated "All data must be encrypted in transit and at rest using customer-managed KMS keys". Missing encryption configuration violates compliance requirements and would fail security audits. Models must implement encryption for all data stores.

### 5. Missing RDS Security Group

**Location**: `stacks/networking.py`, line 375-376
**Problem**: No security group created for Aurora database clusters. Comment indicates it should exist but is not implemented.
**Fix**: Created `primary_rds_sg` and `secondary_rds_sg` security groups allowing PostgreSQL traffic (port 5432) from ECS security groups only
**Category**: B (Moderate - Security & Networking)
**Learning Value**: Database clusters require dedicated security groups to control access. Without proper security groups, the database either cannot be accessed or is overly permissive. The security group should follow least privilege by only allowing access from specific application security groups.

### 6. Missing S3 Cross-Region Replication Configuration

**Location**: `stacks/storage.py`, line 742-743
**Problem**: S3 buckets for transaction logs and audit trails lack cross-region replication configuration, despite being a core requirement
**Fix**: Added `S3BucketReplicationConfiguration` for both transaction logs and audit trails buckets, referencing replication role and secondary buckets
**Category**: A (Critical - Functional Requirement)
**Learning Value**: Cross-region replication was explicitly required in PROMPT.md: "Implement S3 buckets with cross-region replication for transaction logs and audit trails". This is essential for disaster recovery and data durability. Missing this means the multi-region architecture is incomplete and won't meet business requirements.

### 7. Missing IAM Policies for ECS Task Role

**Location**: `stacks/security.py`, lines 914-918
**Problem**: ECS task role exists but has no policies attached. Tasks need S3 access for transaction logs and KMS access for decryption.
**Fix**: Created custom IAM policy with permissions for s3:GetObject, s3:PutObject on transaction/audit buckets, and kms:Decrypt on KMS keys. Attached policy to ecs_task_role.
**Category**: B (Moderate - Security & Functionality)
**Learning Value**: IAM roles must follow least privilege principle. The execution role has policies but the task role (used by application code) was empty. Models must identify which services need access and create appropriate policies. Missing policies cause runtime failures when applications try to access AWS services.

### 8. Missing IAM Policy for S3 Replication Role

**Location**: `stacks/security.py`, lines 954-955
**Problem**: S3 replication role created but has no policy allowing replication actions
**Fix**: Created IAM policy with s3:GetReplicationConfiguration, s3:ListBucket, s3:GetObjectVersionForReplication, s3:ReplicateObject, s3:ReplicateDelete, s3:ReplicateTags, and kms:Decrypt/Encrypt permissions. Attached to replication role.
**Category**: B (Moderate - Functionality)
**Learning Value**: S3 cross-region replication requires specific IAM permissions. The role alone is insufficient without the policy. This shows models must understand service-to-service relationships and required permissions. Replication will silently fail without proper IAM configuration.

### 9. Incorrect ECS Deployment Controller for Blue-Green

**Location**: `stacks/compute.py`, line 654
**Problem**: ECS service uses `deployment_controller={"type": "ECS"}` instead of `{"type": "CODE_DEPLOY"}` for blue-green deployments
**Fix**: Changed to `{"type": "CODE_DEPLOY"}` to enable CodeDeploy-based blue-green deployments
**Category**: B (Moderate - Functional Requirement)
**Learning Value**: Blue-green deployment was explicitly required: "Configure ECS Fargate services with blue-green deployment capability using target group switching". ECS deployment controller must be CODE_DEPLOY to support this. Using standard ECS deployment limits traffic shifting capabilities and doesn't meet the requirement.

### 10. Missing Secondary Region Compute Resources

**Location**: `stacks/compute.py`, lines 671-672
**Problem**: Only primary region has ECS cluster, ALB, target groups, and service. Secondary region (us-east-2) is completely missing.
**Fix**: Added secondary_cluster, secondary_alb, secondary_tg_blue, secondary_tg_green, secondary_listener, and secondary_service in us-east-2
**Category**: A (Critical - Functional Requirement)
**Learning Value**: This is a major omission. The task requires multi-region architecture with active-active capabilities. Missing the entire secondary region means the system cannot handle regional failover or distribute traffic. This demonstrates the importance of thoroughly implementing multi-region requirements across ALL service layers.

### 11. Missing Critical CloudWatch Alarms

**Location**: `stacks/monitoring.py`, lines 1039-1046
**Problem**: No alarms for database replication lag, S3 replication status, or ECS memory utilization
**Fix**: Added CloudWatch alarms for:
  - Aurora Global DB Replication Lag (threshold: 1000ms)
  - S3 Replication Latency (transaction logs and audit trails)
  - ECS Memory Utilization (threshold: 80%)
**Category**: B (Moderate - Monitoring & Operations)
**Learning Value**: Comprehensive monitoring is critical for multi-region systems. Replication lag can indicate problems with Aurora Global Database. Missing these alarms means operational issues could go undetected. The PROMPT.md required "Monitor database replication lag, ECS service health, and S3 replication status".

### 12. Missing Secondary Region DNS Configuration

**Location**: `stacks/dns.py`, lines 1104-1107
**Problem**: Route 53 only has primary region record. Missing secondary region weighted routing record and health check.
**Fix**: Added secondary_health_check and secondary_record with weighted routing policy for gradual traffic shifting between regions
**Category**: B (Moderate - Functional Requirement)
**Learning Value**: Route 53 weighted routing was required to "Support gradual traffic shifting between regions". Without secondary region DNS records, all traffic goes to primary only. This defeats the purpose of multi-region architecture and prevents gradual migration as specified.

### 13. Hardcoded Route 53 Weights

**Location**: `stacks/dns.py`, line 1095
**Problem**: Primary record has hardcoded weight of 100. No mechanism to adjust weights based on migration phase.
**Fix**: Made weights configurable based on migration_phase variable (legacy: 100/0, migration: 50/50, production: 0/100)
**Category**: C (Minor - Configuration Flexibility)
**Learning Value**: The PROMPT.md specified "weighted routing policies for gradual traffic shifting". Hardcoded weights prevent this. Using migration_phase to determine weights enables the phased migration strategy required by the business.

## Summary Statistics

- Total Issues: 13
- Category A (Critical): 4 (31%)
- Category B (Moderate): 8 (61%)
- Category C (Minor): 1 (8%)

## Key Learning Points for Model Training

1. **environmentSuffix is mandatory**: ALL named resources must include environmentSuffix, including VPCs, KMS aliases, security groups, etc. This requirement applies universally.

2. **Encryption is non-negotiable**: PCI compliance and explicit PROMPT requirements mean all data stores must have encryption at rest and in transit configured with KMS keys.

3. **Never hardcode secrets**: Database passwords, API keys, and credentials must use AWS Secrets Manager or Systems Manager Parameter Store.

4. **Multi-region means ALL services**: When requirements specify multi-region, EVERY service layer must be deployed in both regions (networking, compute, storage, database).

5. **Cross-region replication requires IAM**: S3 replication needs both replication configuration AND proper IAM role with replication permissions.

6. **Blue-green deployment needs correct controller**: ECS blue-green requires CODE_DEPLOY controller, not standard ECS deployment.

7. **Monitoring must be comprehensive**: CloudWatch alarms for replication lag, service health, and resource utilization are required for production multi-region systems.

8. **DNS supports traffic shifting**: Route 53 weighted routing must cover both regions with configurable weights for migration phases.

9. **Security groups for all network resources**: Every networked resource (ALB, ECS, RDS) needs dedicated security groups following least privilege.

10. **IAM roles need policies**: Creating an IAM role without attached policies is incomplete. Models must identify required permissions and create appropriate policies.

## Training Quality Assessment

This training example provides strong learning value (8/10):

**Strengths**:
- Realistic issues that would occur in actual development
- Mix of security, functionality, and configuration problems
- Covers multiple AWS services and their integrations
- Issues span different severity levels
- Clear relationship between PROMPT requirements and failures

**Areas for improvement**:
- Could include more subtle configuration issues (e.g., backup retention, monitoring thresholds)
- Could add cost optimization opportunities
- Could demonstrate lifecycle policies and conditional resource creation based on migration_phase

**Recommended use**: This example is excellent for teaching models about multi-region architecture, PCI compliance requirements, encryption best practices, and the importance of complete implementation across all service layers.