Design a Terraform solution to replicate a comprehensive application infrastructure across multiple AWS regions for consistent multi-environment replication. The solution should address the following requirements:
Provision identical, compliant infrastructure in each specified region using modules and for_each over regions.
Accept inputs: regions list, environment name, map of non-overlapping VPC CIDRs per region, and security/backup/network constraints.
Create isolated VPCs per region with provided CIDRs, multi-AZ public/private subnets, NAT gateways for private egress, and correct route tables.
Deploy EC2 Auto Scaling Groups behind regional ALB/NLB with target groups, health checks, and scaling policies.
Configure IAM roles/policies and instance profiles with least privilege; define security groups and NACLs per segmentation; use KMS CMKs for encryption at rest (EBS, RDS, S3, CloudTrail) and enforce encryption in transit where applicable.
Implement RDS in Multi-AZ with appropriate engine, class, storage, automated backups, retention, maintenance windows, and KMS encryption.
Configure DynamoDB with on-demand capacity, point-in-time recovery, and on-demand backups in each region.
Enable CloudTrail (regional or organization-aware as required) with encrypted S3 logging and proper bucket policies; set up CloudWatch Logs, metrics, and alarms for EC2, ELB, ASG, RDS, and DynamoDB.
Apply best practices for backup, access management, and network security exactly per constraints; tag all resources; avoid hard-coded names that could collide across regions/environments.
Use variables, locals, and outputs for parameters (regions, environment, CIDRs, instance types, DB settings, KMS key ARNs); structure reusable modules; ensure dependency ordering with explicit references.
Configure remote state backend and state locking; support workspaces or per-environment state separation.
Ensure idempotent, repeatable applies across regions without manual steps; avoid circular dependencies.
Produce Terraform HCL files and modules that, when applied, provision the described infrastructure accurately, efficiently, and identically in every specified region.