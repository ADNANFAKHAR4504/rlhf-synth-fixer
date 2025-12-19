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

OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:
```hcl
# tap_stack.tf
...

1. There is requirement to have resources deployed in region  us-west-2. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary .
2. VPCs should have 2  private and 2 public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Set up an Internet Gateway for public subnets and NAT Gateway for private subnets. 
3. Create t3.micro EC2 instance in private subnet behind auto scaler with security group restricting SSH to CIDR only.
4. Create non public s3 bucket with versioning enabled to prevent data loss and server side encryption enabled.
5.  Implement Individual MySql RDS with version 8.0 or later but with multiple AZ support for respective regions ensuring it is not internet accessible and that the storage is encrypted with AWS-managed KMS keys. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS.  Ensure that all RDS instances are set to not be publicly accessible .Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. and automatic backups enabled. 
6. Ensure no public IPs are assigned to EC2 instances.
7.  Ensure all data in transit is encrypted.
8. Enable CloudTrail for auditing changes. Use correct AWS parameters to create the cloudtrails
9. Secure RDS access using security groups.
10. Utilize AWS Systems Manager Parameter Store for handling sensitive information using AWS managed keys.
11.  Implement EC2 Auto Scaling groups to manage instance health and scaling. 
12.  Enable lifecycle management policies for unused EBS volumes to optimize costs.
13. Configure logging for all S3 access requests.
14. Establish proper health checks for the load balancer to ensure availability. 
15. Restrict access through IAM roles and policies to only necessary services
16. Include all the outputs in outputs section for all the resources being created.
17. Tag all resources with 'Environment:Production' , 'ownership:self', 'departmental:businessunit'.
