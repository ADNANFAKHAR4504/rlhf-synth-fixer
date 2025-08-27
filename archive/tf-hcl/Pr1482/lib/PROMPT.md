I'm starting to spec out the infrastructure for our new "IaC - AWS Nova Model Breaking" project and could really use your DevOps expertise to get the Terraform configuration right from the start.

The main goal is to build a highly available, multi-region setup that can handle both our production and testing environments. We're thinking of using `us-east-1` as our primary region and `us-west-2` as the failover.

Here’s a quick rundown of what we're aiming for:

* **Networking:** A VPC in each region with public/private subnets, peered together for secure communication.
* **Compute:** An Auto Scaling Group of EC2s behind an Application Load Balancer in each region.
* **Database:** A Multi-AZ PostgreSQL RDS instance in the primary region's private subnet, with backups enabled.
* **Storage & Security:** A secure S3 bucket for artifacts and logs (with versioning and encryption), encrypted EBS volumes for the instances, and tightly configured security groups and IAM roles. Let's avoid opening SSH to the world.
* **DNS & Monitoring:** We'll need Route 53 for failover routing between the regions and some basic CloudWatch alarms and logging.
* **Cost Savings:** I had an idea to add a small Lambda function that runs nightly to shut down non-essential testing resources to keep costs down.

To keep the project clean, could we try to stick to a few guidelines?

1.  Keep all the resources in a single `lib/tap_stack.tf` file.
2.  Let's build everything from scratch without using any external Terraform modules.
3.  We'll have the provider configs in a separate `provider.tf` file, so the main file will just need to reference the `aws.primary` and `aws.secondary` aliases.
4.  Make sure we tag everything with `Project`, `Environment`, `Owner`, and `ManagedBy = "terraform"`.

Could you help put together the HCL code for `lib/tap_stack.tf` and `lib/provider.tf`? Let me know if you have any thoughts or suggestions!
