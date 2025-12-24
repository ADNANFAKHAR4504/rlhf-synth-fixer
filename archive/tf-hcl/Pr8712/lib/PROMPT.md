Hey team,

We have a fintech startup that needs identical infrastructure across dev, staging, and production. The business requirement is strict consistency - what works in dev must work exactly the same in prod. But we also need environment-specific sizing and cost optimization. Building this with Terraform modules in HCL.

The key challenge is avoiding code duplication while allowing different instance sizes and retention periods per environment. We need Lambda functions that connect to RDS databases, both deployed in VPCs with proper security groups and IAM roles. The Lambda functions process payment transactions and store results in PostgreSQL.

## What we need

Create reusable Terraform modules that accept environment-specific variables. All three environments use identical module code but different tfvars files for configuration. The modules should deploy Lambda functions, RDS instances, VPCs, IAM roles, and CloudWatch log groups.

Set up VPCs for each environment with public and private subnets across two availability zones. Each VPC gets its own CIDR block so they don't overlap - dev uses one range, staging another, prod a third. NAT gateways in public subnets provide outbound connectivity for resources in private subnets.

Deploy Lambda functions that run in the VPC private subnets and connect to RDS databases in the same private subnets. The Lambda security group allows outbound to the RDS security group on port 5432. The RDS security group allows inbound only from the Lambda security group. Lambda functions scale memory differently per environment - dev gets less memory, staging medium, prod the most.

The connectivity flow is: API Gateway → Lambda in VPC Private Subnets → RDS PostgreSQL in Private Subnets. For outbound dependencies: Lambda → NAT Gateway → Internet for external API calls. Lambda uses IAM roles to authenticate to RDS instead of passwords.

Create RDS PostgreSQL instances sized per environment. Dev uses small instance class, staging medium, prod large. Each environment has its own separate database. Enable encryption at rest and automated backups. Deploy databases in private subnets with Multi-AZ disabled for dev but enabled for staging and prod.

Configure IAM execution roles for Lambda functions with least privilege permissions. The role needs access to CloudWatch Logs for writing logs, VPC network interfaces for ENI attachment, and RDS IAM authentication for database access. Each environment gets its own IAM role with environment suffix in the name.

Set up CloudWatch log groups for Lambda functions with environment-specific retention. Dev keeps logs for 7 days, staging for 30 days, prod for 90 days. This balances cost with troubleshooting needs across environments.

Create S3 buckets and DynamoDB tables for Terraform state backend per environment. Each environment has separate state files and lock tables. The state bucket name includes environment suffix and uses encryption. The DynamoDB table provides locking so parallel deployments don't conflict.

Tag all resources consistently with Environment, Project, and ManagedBy tags passed as variables. Use the environmentSuffix variable in all resource names following pattern project-environment-resource-type.

Create three tfvars files - dev.tfvars with small instance types and short retention, staging.tfvars with medium sizes, prod.tfvars with large instances and long retention. No hardcoded environment values in module code.

Deploy to us-east-1. Make everything destroyable with skip_final_snapshot on RDS and no deletion protection anywhere. Export VPC IDs, Lambda function names, RDS endpoints, and security group IDs as outputs that other modules can reference.
