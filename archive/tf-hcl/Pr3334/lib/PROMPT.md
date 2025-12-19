ROLE: You are a senior Terraform engineer.

CONTEXT:
We must migrate an AWS application from region us-west-1 to us-west-2 using Terraform HCL.

CONSTRAINTS:
- Preserve logical identity: keep the same names/tags/topology.
- Resource IDs are region-scoped; provide an old→new ID mapping plan using terraform import (do NOT recreate).
- Migrate Terraform state to the new region/workspace without data loss.
- Preserve all SG rules and network configuration semantics.
- Minimize downtime; propose DNS cutover steps and TTL strategy.

DELIVERABLES:
1) tap_stack.tf (providers, resources, modules as needed)
2) variables.tf
3) backend.tf (if required) with placeholders, not real secrets
4) state-migration.md (exact Terraform CLI commands: workspace create/select, import, and verification)
5) id-mapping.csv sample (headers: resource,address,old_id,new_id,notes)
6) runbook.md (cutover plan, roll-back, checks)

Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in region  us-west-2. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary .
2. VPCs should have 2  private and 2 public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Set up an Internet Gateway for public subnets and NAT Gateway for private subnets. 
3. Create t3.micro EC2 instance in private subnet behind auto scaler with security group restricting SSH to CIDR only.  Setting up an EC2 Auto Scaling group distributed across two Availability Zones with an Elastic Load Balancer to handle incoming traffic.
4.  Implement Individual MySql RDS with version 8.0 or later but with multiple AZ support for respective regions ensuring it is not internet accessible and that the storage is encrypted with AWS-managed KMS keys. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS.  Ensure that all RDS instances are set to not be publicly accessible .Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. and automatic backups enabled.  Use 8.0.43 DB Version..
5. RDS username and password must be stored in AWS secret manager.
6. Enforcing security and monitoring best practices by using IAM roles, VPC flow logs, and CloudWatch Alarms.
7. Storing configuration data for EC2 instances in the AWS Systems Manager Parameter Store and tagging all resources with 'Environment': 'Production'.
8. Include all the outputs in outputs section for all the resources being created.
9. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
