---
## Automated Cloud Environment Setup on AWS
---

### Objective

As a proficient cloud infrastructure engineer, your primary goal is to develop a **Pulumi Python script** that meticulously sets up a secure and automated cloud environment in **AWS**. This script should focus on enabling automated resource management and adhering to stringent security and tagging policies.

---

### Core Architectural Components

The Pulumi program must provision and configure the following essential AWS services:

- **Virtual Private Cloud (VPC)**: A robust network foundation with clearly defined public and private subnets to ensure proper network segmentation and control.
- **Security Groups**: Precisely configured security groups to govern inbound and outbound traffic, allowing only necessary access.
- **Amazon S3 Bucket**: A storage bucket for data, configured for durability and versioning.
- **Amazon EC2 Instances**: Virtual machines to host applications, with a mechanism for automatic application deployment upon creation.
- **AWS Identity and Access Management (IAM)**: Roles and policies designed to grant resources the minimal permissions required for their operations, adhering to the principle of least privilege.

---

### Technical Specifications & Constraints

- **Deployment Technology**: The entire infrastructure must be defined using **Pulumi's Python SDK**.
- **Cloud Provider**: All resources must be deployed on **AWS**.
- **Target AWS Region**: The deployment must specifically target the `us-west-2` (Oregon) region.
- **Naming Convention**: All created AWS resources (VPC, subnets, security groups, S3 buckets, EC2 instances, IAM roles, etc.) **must** adhere to the organization's naming convention, starting with the prefix `prod-`. For example, `prod-web-server-sg`.
- **Network Security**:
  - The VPC must contain both **public and private subnets**.
  - **SSH access** to EC2 instances must be **strictly limited to the IP address `203.0.113.42`**. No other IPs should be allowed SSH access.
  - Security groups should generally restrict traffic to only necessary ports and protocols.
- **S3 Configuration**: The S3 bucket **must have versioning enabled** to protect against accidental deletions and to maintain a history of object changes.
- **EC2 Instance Automation**: EC2 instances should automatically deploy a simple application or script upon launch (e.g., using user data to install a web server and a "Hello, World\!" page).
- **Tagging Policy**: All provisioned resources **must** be tagged according to the following policy for cost allocation and identification:
  - `Environment: Production`
  - `Owner: DevOps`
  - `Compliance: PCI-DSS` (or another relevant custom tag for compliance, you can choose a placeholder).
- **IAM Least Privilege**: Ensure that all IAM roles and policies grant only the absolutely necessary permissions to perform their designated functions.

---

### Expected Output

Provide a complete, well-documented, and runnable **Pulumi Python script** that accurately sets up the described AWS resources and configurations. The script must:

- Be self-contained and executable.
- Clearly comment each major section and resource definition.
- Successfully pass `pulumi preview` and `pulumi up` checks without errors.
- Ensure all resources are tagged precisely according to the specified policy.

<!-- end list -->

```python
# Your complete Pulumi Python script will be provided here.
# It should be ready to deploy using `pulumi up` after setting up the stack.
```
