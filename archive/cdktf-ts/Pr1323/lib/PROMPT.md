# Infrastructure as Code AWS Setup

We need to spin up some AWS infrastructure using **CDKTF (Cloud Development Kit for Terraform)**.
The aim is to keep the setup clean, modular, and secure so we can reuse parts of it later for other environments.

### Scope

Well be deploying the following:

* **VPC** with public and private subnets (10.0.0.0/16 CIDR, split across two AZs in `us-east-1`)
* **EC2 instance** in the public subnet (for testing connectivity)
* **S3 bucket** for storing application assets
* **IAM roles and policies** for least-privilege access
* **Security groups** to allow SSH and HTTP inbound, block everything else

### Things to Keep in Mind

* Use **CDKTF constructs** for all resources (no raw Terraform in `.tf` files)
* Break the code into separate stacks/modules e.g., `network`, `compute`, `storage`, `security`
* Sensitive info (like keys or passwords) should come from **environment variables**, not hardcoded
* Use a consistent naming style and apply proper tags 
* Add brief comments in the code explaining any non-obvious configuration choices

### Security

* IAM roles should follow **least privilege**
* Security groups must be explicit: e.g., SSH (port 22) only from our office IP range, HTTP (port 80) open to the world for testing
* No wildcard `*` in IAM policy actions unless absolutely required

### Outputs

After `cdktf deploy`, we should have:

* VPC ID
* Public subnet IDs
* EC2 public IP
* S3 bucket name
* Security group IDs

That should give us a working baseline we can extend later for production.

---
