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
1) main.tf (providers, resources, modules as needed)
2) variables.tf
3) backend.tf (if required) with placeholders, not real secrets
4) state-migration.md (exact Terraform CLI commands: workspace create/select, import, and verification)
5) id-mapping.csv sample (headers: resource,address,old_id,new_id,notes)
6) runbook.md (cutover plan, roll-back, checks)


Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in region  us-west-2. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary .
2. VPCs should have 2  private and 2 public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Set up an Internet Gateway for public subnets and NAT Gateway for private subnets. 
3. Create t3.micro EC2 instance in private subnet behind auto scaler with security group restricting SSH to CIDR only. Run instance  on latest Amazon linux 2 AMI.
4. Create non public s3 bucket with versioning enabled to prevent data loss and server side encryption enabled.
5. Utilize an Application Load Balancer (ALB) to manage incoming traffic
6.  Implement EC2 Auto Scaling groups to manage instance health and scaling. 
7. Ensure IAM roles have the least privilege necessary.
8. Encrypt all data stored using AWS KMS
9. Provide secure SSH access through a bastion host only. 
10. Store application logs in Amazon S3 with versioning. 
11.  Configure CloudWatch to collect logs and application metrics.
12. 5.  Implement Individual MySql RDS with version 8.0 or later but with multiple AZ support for respective regions ensuring it is not internet accessible and that the storage is encrypted with AWS-managed KMS keys. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS.  Ensure that all RDS instances are set to not be publicly accessible .Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. and automatic backups enabled.  Use 8.0.43 DB Version.
13. Set up security groups to control network access.
14. Restrict access through IAM roles and policies to only necessary services
15. Include all the outputs in outputs section for all the resources being created.
16. Tag all resources with 'Environment:Production' , 'ownership:self', 'departmental:businessunit'.
17. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
