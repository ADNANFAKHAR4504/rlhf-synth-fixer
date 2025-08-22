Think of yourself as the lead engineer responsible for building out a brand new, top-tier AWS infrastructure from scratch using Terraform.

The project is called **`IaC - AWS Nova Model Breaking`**, and our main goal is to create a rock-solid foundation for our services. The real challenge is building a multi-region setup that's consistent, secure, and easy to manage across different environments (like dev, staging, etc.). We need a solution that's built to last.

Here's the technical blueprint I have in mind:

* **Modern Terraform:** Let's stick with **Terraform v1.0 or newer**. All the code should be clean, well-formatted HCL.
* **Built for High Availability:** The whole setup needs to run in **at least two AWS regions** (say, `us-east-1` and `us-west-2`). We'll be deploying the usual core services—**VPC, EC2, RDS**—in each region.
* **Global Reach:** We'll need at least one **global AWS service** to tie the regions together. **Route 53** for DNS failover or **CloudFront** for a CDN would be perfect examples.
* **Solid State Management:** Let's use a proper **remote backend** for our Terraform state, like an **S3 bucket with DynamoDB for locking**. This is non-negotiable for team collaboration and preventing state file conflicts.
* **Consistent Naming:** To keep things sane, every resource should follow this naming convention: **`ProjectName-Environment-ResourceType`**. For example, a VPC in dev would be `iac-aws-nova-model-breaking-dev-vpc`.

Security is a huge priority here, so we need to get this right from the start:

* **No Hardcoded Secrets:** This one's critical. All sensitive info like database passwords or API keys needs to be managed through **AWS Secrets Manager or KMS**. Nothing secret should ever be in a `.tf` file.
* **Lock Down the Network:** The network needs to be buttoned up tight. Everything—our servers, our databases—must be in **private subnets**. The only way in should be through a **VPN or an AWS PrivateLink**. No public SSH or RDP ports open to the world, please.
* **Tag Everything:** Let's be diligent about tagging. Every single resource needs an `Environment` tag and an `Owner` tag. This will help us track costs and ownership down the line.
* **Pre-flight Security Check:** Before we call it done, we need a plan to scan the code for issues. In the documentation, please outline how you'd run a tool like **`tfsec` or `checkov`** to catch any security misconfigurations.

Now, for the structure of the code itself, we have a specific way we do things here:

* **Generate Two Core Files:** I need you to generate two specific files: `provider.tf` and `lib/tap_stack.tf`.
* **`provider.tf`:** This file will handle the AWS provider configuration. If we're using multiple regions, this is where you'll define the provider aliases that `tap_stack.tf` will reference.
* **`lib/tap_stack.tf`:** This is where the magic happens. I want you to generate a **single, self-contained Terraform file** for the entire stack.
    * It should include everything: all **variable declarations** (including `aws_region` for the provider), **locals**, all the **resources**, and all the **outputs**.
    * For this project, **build all resources directly**. Don't use any external modules; we're creating this stack from the ground up.
    * Make sure you're following **best practices** throughout: least-privilege IAM roles, encryption enabled on services that support it, and tightly-scoped security groups.
    * The **outputs should be useful for a CI/CD pipeline** or for running automated tests. Just make sure you don't output any secrets.

So, when you're finished, the final package should look something like this:

1.  I'm looking for a production-ready, well-documented Terraform project that anyone on the team could pick up and use with confidence. Let me know what you come up with!
2.  **The Two Terraform Files:** `lib/provider.tf` and `lib/tap_stack.tf`, ready to go.

