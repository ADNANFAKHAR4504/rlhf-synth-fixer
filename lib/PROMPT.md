As an expert DevOps engineer, you are tasked with creating a production-grade infrastructure on AWS using Terraform. The primary goal is to build a highly available and secure environment in the `us-east-1` region, adhering to a specific set of technical and security requirements.

Your output must be a single, complete, and valid HCL Terraform configuration file. It should create all the necessary AWS resources and pass a `terraform validate` check without errors. Do not provide any conversational text or explanations outside of the code block.

Here are the detailed requirements for the infrastructure:

1.  **AWS Provider Version:** Use a provider version greater than or equal to `3.0`.
2.  **Resource Tagging:** All deployed resources must be tagged with `Environment = "Production"`.
3.  **VPC and Subnets:**
    * Create a single VPC with a CIDR block of `10.0.0.0/16`.
    * Within this VPC, create one public and one private subnet in two separate Availability Zones (`us-east-1a` and `us-east-1b`).
4.  **Internet Connectivity:**
    * Set up a NAT Gateway in each public subnet.
    * Ensure instances in the private subnets can access the internet via their respective NAT Gateways.
5.  **EC2 Instances:**
    * Deploy `t2.micro` instances for all application servers.
6.  **Logging and IAM:**
    * Create a dedicated S3 bucket for log storage.
    * Enable server-side encryption on the log bucket.
    * Implement an IAM role and an associated policy that grants EC2 instances read/write access to the S3 log bucket.
7.  **Security:**
    * Configure security groups to permit only essential traffic.
    * Restrict inbound SSH access to the specific IP CIDR block `203.0.113.0/24`.
8.  **Monitoring:**
    * Establish CloudWatch alarms for all EC2 instances to trigger if the CPU utilization exceeds 70%.