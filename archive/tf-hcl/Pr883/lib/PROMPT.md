I'm building a new project called "Nova" and could really use your expertise. The goal is to build a solid, multi-region foundation on AWS using Terraform. I want to get it right from the start with clean, automated, and secure code that follows best practices.

I'm thinking we'll need two files: a `provider.tf` for the setup and a `main.tf` for all the resources. The idea is to deploy a baseline environment to both `us-east-1` and `us-west-2` from a single `terraform apply`.

Could you help me put together the code for these two files?

---
### **What I'm thinking for `provider.tf`:**

This one should be pretty straightforward. We just need to define the AWS providers.

* Let's make sure we're using the `hashicorp/aws` provider and pin it to a recent version, like `~> 5.0`.
* We'll need a default region variable, maybe `aws_region`, defaulting to `us-east-1`.
* Of course, we'll also need provider aliases for both `us-east-1` and `us-west-2` so we can target them specifically.

---
### **And for `main.tf`:**

This is where the main infrastructure will live. Here's the plan:

1.  **Keep it organized:** Let's start with variables for my name (`your_name`) for an `Owner` tag and a list of the regions (`aws_regions`). We should also have some standard tags (`Owner`, `Purpose`) in a `locals` block that we can apply to everything.
2.  **Keep it DRY:** To keep things clean, let's use a `for_each` loop over the regions for all the regional stuff. No need to repeat ourselves.
3.  **Find the right AMI:** In each region, we'll need to dynamically find the latest Amazon Linux 2 AMI.
4.  **Encryption is key:** Let's create a customer-managed KMS key in each region with a 10-day deletion window and give it the alias `alias/nova-app-key`.
5.  **Secure our storage:** We'll also need an S3 bucket in each region. The name should be globally unique, maybe something like `nova-data-bucket-ACCOUNT_ID-REGION`. It absolutely has to be encrypted with our new KMS key and have all public access blocked.
6.  **Lock down permissions:** For the EC2 instances, we can just use one global IAM role. The policy just needs to give it read-only access to the S3 buckets and permissions to write to CloudWatch Logs.
7.  **Spin up some compute:** Let's launch a small `t3.micro` instance in each region. The root drive must be encrypted with our regional KMS key, and we need to attach the IAM role we created.
8.  **Stay compliant:** To keep an eye on things, let's deploy a few standard AWS Config rules in each region: `S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED`, `ENCRYPTED_VOLUMES`, and `IAM_ROLE_MANAGED_POLICY_CHECK`.
9.  **Show me the goods:** Finally, can you add an output that shows the S3 bucket names, instance IDs, and KMS key ARNs for each region? Just the essentials, no secrets.
