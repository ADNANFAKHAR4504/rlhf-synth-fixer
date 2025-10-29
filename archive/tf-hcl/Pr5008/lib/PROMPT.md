Hey team,

We need to build out a solid AWS environment using Terraform - everything should go into a single main.tf file. The goal is a production-ready setup that's secure, follows IaC best practices, and can be deployed reliably in us-west-2. Let's keep it simple - no external modules or extra files, just clean inline Terraform code.

Here's what we need to cover:

**Networking Foundation**

Start with a VPC using 10.0.0.0/16 in us-west-2. We'll need 3 subnets total: 1 public and 2 private, spread across different availability zones for redundancy.

Make sure DNS support and hostnames are enabled on the VPC - that'll help with service discovery later.

Set up an Internet Gateway and configure the public route table to route 0.0.0.0/0 traffic through it. That'll handle our public subnet's internet access.

For the database, create an RDS subnet group using those two private subnets.

**Compute Layer**

We'll need an EC2 Launch Template and Auto Scaling Group configured for min=1, max=3 instances in the public subnet. This gives us our web tier.

Include an example showing how to associate an Elastic IP to a primary instance, but also note that with autoscaling, a Load Balancer is the better approach. Add an ALB example or at least comment on the best practice there.

For access, let's use AWS Systems Manager Session Manager - attach the right IAM role to EC2 so we don't need SSH keys by default.

**Database Setup**

Spin up an RDS MySQL instance with Multi-AZ enabled in those private subnets for high availability.

We need automated backups with at least 7 days retention. Storage should be encrypted using a KMS key we create inline (make sure rotation is enabled). Obviously set publicly_accessible to false.

The RDS security group should only allow MySQL traffic (port 3306) from the EC2 autoscaling security group - nothing else.

**Security and IAM**

Create an inline KMS key with enable_key_rotation set to true. We'll use this for encrypting both RDS and S3 data.

Set up an S3 bucket for storing CloudFormation templates. Enable versioning, block all public access, and use server-side encryption with that KMS key.

For IAM roles and policies:
- EC2 role needs SSM access, CloudWatch Logs Put permissions, and S3 read access - keep it least privilege
- Add minimal IAM resources as needed for Terraform operations

Important: no hard-coded credentials anywhere. Mark any sensitive variables with sensitive = true.

**Monitoring and Alerts**

Set up CloudWatch Log Groups for both EC2 and RDS with appropriate retention settings.

We'll need a few CloudWatch alarms:
- High EC2 CPU alarm that triggers an SNS topic and an Auto Scaling policy to scale out/in
- Low RDS free storage alarm that sends to an SNS topic

Create an SNS topic for these alarm notifications and include it in the outputs.

**Auto Scaling**

Implement CPU-based autoscaling. Something like: scale out when average CPU goes above 70% for 2 periods, scale in when it drops below 30%.

You'll need aws_launch_template, aws_autoscaling_group, aws_cloudwatch_metric_alarm, and aws_autoscaling_policy all working together.

**Tagging and Documentation**

Tag everything with Name, Project, Environment, Owner, and CostCenter. Use variables for project, environment, and owner so they're consistent.

Add inline comments throughout for major resources and any decisions that might not be obvious to someone reading the code later.

Would be nice to include a commented example showing how you could do a CloudFormation ChangeSet-like workflow - maybe using null_resource with local-exec to upload a template to S3. Just illustrative though, not required for the main infrastructure.

**Variables and Outputs**

Set up variables with sensible defaults for: aws_region (default us-west-2), project, environment, owner, instance_type, allowed_admin_cidr, db_username, db_password (mark as sensitive), db_allocated_storage, db_instance_class, autoscaling min/max, and s3_bucket_name.

Output these key values: vpc_id, public_subnet_ids, private_subnet_ids, ec2_asg_name, eip_addresses (if applicable), rds_endpoint, s3_bucket_name, sns_topic_arn, kms_key_id.

**Important Constraints**

Everything needs to be in us-west-2.

Keep it to a single file - main.tf. That means provider block, terraform block with required_version, all your variables, locals, data sources, resources, and outputs in one place.

Use the Terraform AWS Provider.

Security basics: RDS cannot be publicly accessible, S3 must block public access, IAM follows least privilege principle.

Make sure sensitive variables are marked appropriately.

**What We're Looking For**

A single complete Terraform file called main.tf that implements everything above. Should be well-commented, ready to run through terraform init and terraform validate without issues.

Use clean Terraform patterns - for_each where it makes sense, lifecycle blocks where useful.

Add a comment block at the top with example terraform apply usage and what a terraform.tfvars file would look like, but don't create separate files.