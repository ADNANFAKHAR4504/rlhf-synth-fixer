I need you to act as a senior DevOps engineer and create a complete, single-file Terraform configuration to deploy a resilient, multi-region AWS infrastructure. This is for a new project called "IaC - AWS Nova Model Breaking," and we'll be building everything from the ground up.

The goal is to have a robust setup for both production and testing environments, focusing on high availability and security best practices.

### **Core Infrastructure Requirements**

Here’s what the infrastructure needs to include:

* **Multi-Region High Availability:** Deploy all resources across two regions: `us-east-1` (primary) and `us-west-2` (secondary).
* **Networking:**
    * Create a VPC in each region with both public and private subnets.
    * Set up VPC peering between the two regional VPCs to allow secure, private communication.
* **Compute & Load Balancing:**
    * Deploy an Auto Scaling Group of EC2 instances in the public subnets of each region.
    * Place an Application Load Balancer (ELB) in front of the EC2 instances in each region to distribute traffic.
* **Database:**
    * Provision a PostgreSQL RDS instance in the primary region's private subnets.
    * It must be a Multi-AZ deployment with automatic backups enabled for resilience.
* **Storage:**
    * Create a secure S3 bucket for application artifacts and logs. Make sure versioning and server-side encryption are enabled.
    * All EC2 instances must use encrypted EBS volumes for data-at-rest security.
* **Security:**
    * Implement IAM roles and policies based on the principle of least privilege. Specifically, create roles for EC2 instances and the Lambda function.
    * Configure security groups to be as restrictive as possible. Avoid allowing SSH from `0.0.0.0/0`.
* **Monitoring & DNS:**
    * Set up CloudWatch alarms (e.g., for high CPU on EC2) and a CloudWatch Log Group for application logs.
    * Use Route 53 to manage DNS, including setting up failover routing records that point to both the primary and secondary region's load balancers.
* **Cost Optimization:**
    * Create an inline Lambda function that is triggered by a CloudWatch Event rule every night at midnight. The function's purpose is to scale down or stop non-essential resources (like testing EC2 instances or RDS databases) to save costs.

### **Strict Rules for the Terraform Code**

Pay close attention to these rules, as they are critical:

1.  **Single File:** All Terraform code—variables, locals, resources, and outputs—must be in a single file located at `./lib/tap_stack.tf`.
2.  **No External Modules:** Do not use any public or external Terraform modules. You must define every resource from scratch.
3.  **Provider Configuration:** The `provider` blocks will be in a separate `provider.tf` file. You should assume that provider aliases (`aws.primary` and `aws.secondary`),  you need to reference them in your resource definitions (e.g., `provider = aws.primary`).
4.  **Tagging:** Apply a consistent set of tags to all resources: `Project`, `Environment`, `Owner`, and `ManagedBy = "terraform"`.

Please generate the complete HCL code for `lib/tap_stack.tf` and `lib/provider.tf`. Make sure it's clean, well-commented and ready to be deployed.
