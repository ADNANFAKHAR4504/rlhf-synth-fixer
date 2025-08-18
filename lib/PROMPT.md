# Secure AWS Web Application Infrastructure

We need to setup a **secure AWS environment using Terraform HCL** to host a web application. The configuration must **adhere to AWS Security Best Practices** and be modular, readable, and production-ready.

## Security Requirements

### VPC

- Create a **VPC named `secure-network`** in the `us-west-2` region.
- Include:
  - Public Subnets
  - Internet Gateway
  - Route Tables

### Network Controls

- **Security Groups**:
  - Allow inbound traffic **only on ports 80 (HTTP) and 443 (HTTPS)**.
  - Allow all outbound traffic.

- **Network ACLs** (NACLs):
  - Restrict traffic in and out of the public subnet following **AWS best practices**.

### Compute

- Launch an **EC2 instance** in the **public subnet**.
- Attach the **Security Group** created above.
- Ensure the instance has **public internet access** (via IGW; NAT not required).
- Do **not attach unnecessary IAM permissions**.

### Storage (S3)

- Create an **S3 bucket** for storing **web application logs**.
- Enable **Server-Side Encryption** (AES-256 or AWS KMS).
- Restrict **write access** to the EC2 instance only (least privilege).

### IAM

- Create an **IAM Role** for the EC2 instance.
- Attach an **IAM Policy** with **minimal access**:
  - Only `s3:PutObject` to the log bucket.

### Tagging

All AWS resources must be tagged with:

Environment = "Production"

## **Non‑negotiables**

- The `provider.tf` already exists and holds your **AWS provider + S3 backend**.
- **Do not** put a `provider` block in `lib/tap_stack.tf`. That stays in `provider.tf`.
- The variable **`aws_region`** must be declared in `lib/tap_stack.tf` and is consumed by `provider.tf`.
- Integration tests **must read** from `cfn-outputs/all-outputs.json` (CI/CD will create it).
- Tests must **not** run `terraform init/plan/apply` during test cases stage.
