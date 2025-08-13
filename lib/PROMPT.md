Here's a prompt designed to align with Claude's Sonnet best practices, providing clear and structured instructions for creating a secure AWS infrastructure with Terraform.

---

## 📝 Secure AWS Foundation with Terraform

---

### Objective

As a cloud security engineer, your primary task is to design and implement a **secure foundational infrastructure** on **AWS** using **Terraform**. The configuration must adhere to security best practices, including robust network isolation, comprehensive logging, secure secrets management, and strict access controls.

---

### Core Architectural Components

The Terraform configuration must provision and configure the following AWS services in the `us-west-2` region:

- **Virtual Private Cloud (VPC)**: A logically isolated network with both public and private subnets.
- **Network Access Control Lists (NACLs)**: Stateless firewalls to control traffic at the subnet level.
- **Security Groups (SGs)**: Stateful firewalls to control traffic at the instance level.
- **AWS Identity and Access Management (IAM)**: Roles and policies to enforce the principle of least privilege.
- **AWS Secrets Manager**: A service to securely store and retrieve sensitive data like passwords or API keys.
- **Logging & Monitoring**:
  - VPC Flow Logs for network traffic visibility.
  - A CloudTrail trail for auditing AWS account activity.
  - An S3 bucket configured for server access logging.

---

### Technical Specifications & Constraints

- **Infrastructure as Code (IaC)**: The entire infrastructure must be defined using **Terraform HCL**.
- **Region**: All resources **must** be provisioned in the **`us-west-2`** region.
- **Network Security**:
  - The VPC **must** contain at least one **public subnet** and one **private subnet**.
  - **Security Groups must deny all inbound traffic by default**. Only explicitly defined `ingress` rules for necessary traffic (e.g., allowing SSH from a specific IP) should be added.
  - **NACLs must be configured** to restrict inbound and outbound traffic at the subnet level, providing a second layer of defense.
- **Secrets Management**: The use of hard-coded secrets, passwords, or API keys within the Terraform files is **strictly prohibited**. All sensitive data must be stored and referenced using **AWS Secrets Manager**. You should create a placeholder secret to demonstrate this pattern.
- **Comprehensive Logging**:
  - **VPC Flow Logs** must be enabled to capture IP traffic information for the VPC and sent to a dedicated log group or S3 bucket.
  - A new **CloudTrail** trail must be created to log all management events.
  - Any created **S3 buckets** must have **server access logging enabled**, with logs directed to a separate, secure S3 bucket.
- **Resource Tagging**: **All** created resources (VPC, subnets, SGs, IAM roles, etc.) **must** be tagged with the following keys:
  - `Name`
  - `Environment` (e.g., `development`, `production`)
  - `Owner` (e.g., `DevOpsTeam`)

---

### Expected Output

Your response should provide a set of well-organized and commented **Terraform configuration files (`.tf`)**. The configuration should be ready to deploy and successfully pass `terraform plan` and `terraform apply` without errors.

```terraform
# main.tf
# (Resource definitions for VPC, subnets, etc.)

# variables.tf
# (Variable definitions for region, tags, etc.)

# outputs.tf
# (Outputs for important resource IDs or endpoints)

# security.tf
# (Resource definitions for NACLs, Security Groups, IAM)

# logging.tf
# (Resource definitions for CloudTrail, Flow Logs, S3 logging)
```
