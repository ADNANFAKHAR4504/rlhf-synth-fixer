You are required to design a secure, production-ready AWS environment implemented entirely in Terraform using a single file named main.tf. The configuration must follow IaC best practices, be idempotent, and be deployable in us-west-2. Do not use external modules or additional files — everything must be inline in main.tf.

Core Implementation Requirements

VPC & Networking

Create a VPC with CIDR 10.0.0.0/16 in us-west-2.

Create 3 subnets: 1 public and 2 private, distributed across Availability Zones.

Enable DNS support and hostnames on the VPC.

Create and attach an Internet Gateway; configure a public route table that routes 0.0.0.0/0 to the IGW for the public subnet.

Create RDS subnet group using the two private subnets.

Compute & Access

Create an EC2 Launch Template and an Auto Scaling Group (min=1, max=3) in the public subnet for the web tier.

Provide an example of associating an Elastic IP to a primary instance; note autoscaling recommendation to use a Load Balancer (include an ALB example or comment explaining best practice).

Enable AWS Systems Manager Session Manager by attaching an IAM role to EC2 (no SSH required by default).

Database

Provision an RDS MySQL instance (Multi-AZ) in the private subnets.

Enable automated backups (retention ≥ 7 days), storage encryption using a KMS key created inline (with rotation enabled), and set publicly_accessible = false.

RDS security group must allow inbound MySQL (3306) only from the EC2 autoscaling security group.

Security, IAM & KMS

Create an inline KMS key with enable_key_rotation = true used to encrypt RDS and S3.

Create an S3 bucket for storing CloudFormation templates (as requested), with versioning enabled, block public access, and server-side encryption using the KMS key.

Create IAM roles/policies:

EC2 role: SSM, CloudWatch Logs Put, and S3 read access (least privilege).

Minimal IAM resources for Terraform where required.

Ensure no hard-coded credentials; mark sensitive variables as sensitive = true.

Observability & Notifications

Create CloudWatch Log Groups (EC2 & RDS) with retention settings.

Create CloudWatch alarms:

High EC2 CPU → SNS topic → Auto Scaling policy to scale out/in.

Low RDS free storage → SNS topic.

Create an SNS topic for alarm notifications and outputs.

Autoscaling & Alarms

Implement CPU-based autoscaling (example: scale out when avg CPU > 70% for 2 periods; scale in when < 30%).

Use aws_launch_template + aws_autoscaling_group + aws_cloudwatch_metric_alarm + aws_autoscaling_policy.

Operational Hygiene & Tags

Tag all resources with Name, Project, Environment, Owner, CostCenter. Use variables for project, environment, and owner.

Add inline comments/documentation for each major resource and non-obvious decisions.

Include a commented example showing how to create a CloudFormation ChangeSet-like workflow (e.g., null_resource + local-exec uploading a CloudFormation template to S3) — this is illustrative only and must not be required for main infra.

Variables & Outputs

Provide variables (with sensible defaults) for: aws_region (default us-west-2), project, environment, owner, instance_type, allowed_admin_cidr, db_username, db_password (sensitive), db_allocated_storage, db_instance_class, autoscaling min/max, and s3_bucket_name.

Produce outputs: vpc_id, public_subnet_ids, private_subnet_ids, ec2_asg_name, eip_addresses (if any), rds_endpoint, s3_bucket_name, sns_topic_arn, kms_key_id.

Constraints

All resources must be in region us-west-2.

Single file only: main.tf — include provider block, terraform block (required_version), variables, locals, data sources, resources, and outputs.

Use Terraform AWS Provider 

RDS must not be publicly accessible; S3 must block public access; IAM must follow least privilege.

Mark sensitive variables appropriately.

Expected Output

Generate only one complete Terraform file named main.tf (HCL) that:

Implements all resources above.

Includes inline comments/documentation.

Is ready to terraform init, terraform validate

Uses clean, maintainable Terraform idioms (for_each where appropriate, lifecycle blocks where useful).

Includes example terraform apply usage as a top-file comment and example terraform.tfvars content as comments (do not create separate files).

Output Instructions
Generate a single-file Terraform configuration (main.tf) implementing all requirements above.
Ensure the output is formatted as valid Terraform HCL code 
Include comments throughout explaining key security best practices.
Do not summarize or break into sections — produce one full Terraform file as the output.