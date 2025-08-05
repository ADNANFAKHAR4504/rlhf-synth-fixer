You are an expert DevOps/SRE engineer skilled in Terraform and AWS infrastructure design. I need you to generate idiomatic, syntactically correct, production-ready Terraform code for the following task:

---

**Objective:**

Create a modular Terraform configuration to provision a secure and well-tagged AWS infrastructure in `us-east-1`. The environment must fulfill the following requirements:

1. **Networking:**
   - Create a Virtual Private Cloud (VPC) spanning 3 different subnets across 3 Availability Zones in `us-east-1`.
   - Include both public and private subnets.
   - Set up a **NAT Gateway** to enable outbound internet access from private subnets while keeping them inaccessible from the public internet.

2. **Security:**
   - Define **Security Groups**:
     - Allow ingress on port `80` (HTTP) and port `22` (SSH) only from a specific range of IPs (e.g., `203.0.113.0/24`).
   - Ensure all other ports are restricted by default.

3. **IAM & Access:**
   - Define an **IAM role** and instance profile for EC2 instances.
   - Allow the EC2 instances to securely access S3 buckets **without hardcoding credentials**.

4. **Modularity:**
   - Use separate Terraform **modules** for each major component:
     - `networking` (VPC, subnets, NAT gateway)
     - `security` (security groups)
     - `iam` (IAM roles and policies)
     - `compute` (optional EC2 instance for testing)

5. **Tagging & Governance:**
   - Apply consistent tags to **all resources**, such as:
     - `Project = "MyProject"`
     - `Environment = "Dev"`
     - `Owner = "Akshat Jain"`

---

**Expected Output Structure:**

- A `main` directory with:
  - `main.tf`, `variables.tf`, `outputs.tf`
- A `modules/` folder with:
  - `networking/`
  - `security/`
  - `iam/`
- Code should be clean, readable, and idiomatic Terraform.

---

**Deliverables:**
- Terraform files ready to be used with `terraform init`, `plan`, and `apply`.
- All variables clearly defined with defaults where appropriate.
- No hardcoded secrets or credentials.
- Assume the AWS provider is already configured via `~/.aws/credentials`.

Please generate the complete Terraform configuration accordingly.
