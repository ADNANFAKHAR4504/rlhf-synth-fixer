I'm looking to spin up a secure and scalable AWS environment using Terraform, and I was hoping you could help me write the code for it. The goal is to create a complete, self-contained configuration that's ready for a production-like deployment.

Could you generate the code for two files, `provider.tf` and `main.tf`?

* `provider.tf`: This file should just define the AWS provider and set up the S3 backend for storing Terraform's state remotely.
* `main.tf`: This should be the main file containing everything else—all variables, locals, resources, and outputs. To keep things simple and self-contained, please don't use any external modules.

Here’s a breakdown of the resources we need to create in `main.tf`.

---

## The Infrastructure

### Networking
Let's start by building a custom VPC. Inside it, we'll need at least one **public subnet** (with an Internet Gateway) and one **private subnet**. The private subnet should have a **NAT Gateway** so its resources can access the internet without being publicly exposed. Please also set up all the necessary route tables and associations.

### Compute & Load Balancing
We'll need an **Application Load Balancer (ALB)** that's configured to handle only encrypted **HTTPS** traffic on port 443, and it must enforce **TLS 1.2**. Behind this ALB, please launch an **EC2 instance** inside the private subnet and enable detailed CloudWatch monitoring for it.

### Storage
We also need a **private S3 bucket**. It's critical that this bucket is configured to **block all public access** and enforce **server-side encryption** (using SSE-S3) for all objects.

---

## Security & Logging

### IAM & Security Groups
Security is a top priority, so let's lock things down:

* **EC2 IAM Role**: Create an IAM role for the EC2 instance that follows the **principle of least privilege**. For this example, just give it read-only access to a specific S3 bucket.
* **MFA Policy**: Let's create a global IAM policy that **denies all actions** if the user isn't authenticated with Multi-Factor Authentication (MFA).
* **Security Groups**:
    * **ALB Security Group**: Should allow inbound traffic on port `443` from anywhere (`0.0.0.0/0`).
    * **EC2 Security Group**: Should only allow ingress traffic from the ALB's security group on the application port. Please **do not** allow any unrestricted SSH access from the internet.

### Auditing
To keep an eye on things, please enable **CloudTrail** to create a trail that logs all AWS API calls and delivers the logs to a dedicated, secure S3 bucket.

---

##  Best Practices

To keep our code clean and manageable, let's follow a few best practices:

* **Tagging**: Please apply a consistent set of tags to all resources: `Environment`, `Owner`, and `CostCenter`. Using a `locals` block to manage these centrally would be perfect.
* **Variables**: Use variables for all configurable parameters like the `aws_region`, VPC CIDR, and environment name.
* **Outputs**: Finally, create outputs for essential info we might need for CI/CD or other operations, like the `vpc_id`, `alb_dns_name`, and `s3_bucket_id`. Please make sure **not to output any sensitive information** or secrets.
