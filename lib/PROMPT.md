Hey, I've got a new project for you. We're working on the **`IaC - AWS Nova Model Breaking`** initiative, and this piece is all about building out our core infrastructure securely using CloudFormation. Think of this as the master template for a hardened AWS environment that we can reuse.

The main goal is to create a single CloudFormation YAML template that we can use to stamp out a secure and compliant AWS account. This needs to be production-grade right out of the box.

Here’s a breakdown of what I need:

**First, let's tackle the network.** I want you to completely get rid of the default VPC. Instead, build us a new, **custom VPC** from the ground up—that means all the necessary subnets, route tables, and gateways. This setup will need to work across multiple regions, specifically **`us-east-1`** and **`eu-west-1`**, so plan for that.

**Security is the absolute top priority here.** Let's make sure we hit every one of these points:

* **Data at Rest:** All data in S3 buckets must be encrypted using server-side encryption with AWS-managed keys (**SSE-S3**). No exceptions.
* **Data in Transit:** Any traffic hitting our EC2 instances or load balancers has to be encrypted with **TLS 1.2**.
* **Access Control:** Let's lock down our IAM roles. They should only have the **bare minimum permissions** they need to talk to S3, EC2, and RDS. The principle of least privilege is key.
* **No Public Access:** S3 buckets should be completely private. The configuration must **explicitly block all public read/write access**.
* **Firewalls:** Our security groups need to be tight. **No allowing unrestricted traffic** from `0.0.0.0/0`. Ingress should only be from specific, approved IP ranges.
* **User Access:** For any privileged IAM users, we need to enforce **Multi-Factor Authentication (MFA)**.

**For operations and monitoring, let's get this right from the start:**

* **Logging:** We need full visibility. Turn on **CloudTrail** to log every single API call across the account.
* **Monitoring:** For our EC2 instances, enable **detailed CloudWatch monitoring** so we can keep a close eye on performance.
* **Cost Management:** Let's be disciplined with our tagging from day one. Every resource you create needs these three tags: **`Environment`**, **`Owner`**, and **`CostCenter`**.

In the end, what I need from you is a single, clean, and well-commented **CloudFormation YAML file**. It should define everything we just talked about. Before you hand it over, make sure it validates successfully against AWS's best practices. This template should be ready to deploy.
