I'm starting to spec out the infrastructure for our new "IaC - AWS Nova Model Breaking" project and could really use your DevOps expertise to get the Terraform configuration right from the start.

The main goal is to build a highly available, multi-region setup that can handle both our production and testing environments. We're thinking of using `us-east-1` as our primary region and `us-west-2` as the failover.

Here's a quick rundown of what we're aiming for:

* **Networking:** A VPC in each region with public/private subnets, peered together for secure cross-region communication. The VPC peering connection should allow resources in the primary region to communicate with resources in the secondary region through route tables.
* **Compute:** An Auto Scaling Group of EC2 instances behind an Application Load Balancer in each region. The ALB should distribute traffic to EC2 instances via target groups, and the EC2s should connect to RDS for database operations and write application logs to CloudWatch Logs.
* **Database:** A Multi-AZ PostgreSQL RDS instance in the primary region's private subnet, with backups enabled. The RDS should be accessible only from EC2 instances via security group ingress rules on port 5432.
* **Storage & Security:** A secure S3 bucket for artifacts and logs with versioning and encryption. EC2 instances should have IAM instance profiles with policies that allow them to read/write objects to S3. Encrypted EBS volumes for the instances, and tightly configured security groups and IAM roles. Let's avoid opening SSH to the world.
* **DNS & Monitoring:** Route 53 should perform health checks on the ALBs and automatically failover DNS routing from the primary to secondary region when the primary ALB health check fails. CloudWatch metric alarms should monitor EC2 Auto Scaling Group CPU utilization.
* **Cost Savings:** A Lambda function triggered by EventBridge on a nightly cron schedule to shut down non-essential testing resources. The Lambda should have IAM role permissions to stop EC2 and RDS instances.

To keep the project clean, could we try to stick to a few guidelines?

1.  Keep all the resources in a single `lib/tap_stack.tf` file.
2.  Let's build everything from scratch without using any external Terraform modules.
3.  We'll have the provider configs in a separate `provider.tf` file, so the main file will just need to reference the `aws.primary` and `aws.secondary` aliases.
4.  Make sure we tag everything with `Project`, `Environment`, `Owner`, and `ManagedBy = "terraform"`.

Could you help put together the HCL code for `lib/tap_stack.tf` and `lib/provider.tf`? Let me know if you have any thoughts or suggestions!
