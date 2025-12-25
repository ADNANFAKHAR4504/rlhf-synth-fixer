---
## Building a Secure AWS Environment: Our Plan
---

### What We're Aiming For

Our main task here is to write Terraform code to set up a really **secure AWS environment**. We're especially focusing on how we manage identities and access (IAM) and make our network super secure.

---

### Key Things We Need to Implement

Here's what your Terraform configuration should include:

- **IAM Policy Management**: We need to make sure all our IAM policy definitions are stored in a **version-controlled repository**.
- **Security Group Rules**: Define our security group rules to only allow **HTTP (port 80) and HTTPS (port 443)** traffic. No other ports should be open by default.
- **Least Privilege for IAM**: Every IAM role we create must strictly follow the **principle of least privilege**. This means roles should only have the exact permissions they need, nothing more.
- **S3 Bucket Encryption**: All S3 buckets we set up **must have default encryption enabled**.
- **CloudWatch API Logging**: Configure CloudWatch to capture **every single API request** made across our AWS accounts. This is crucial for auditing.
- **Approved AMIs for EC2**: When creating EC2 instances, we should only use **approved Amazon Machine Images (AMIs)**. These AMIs must come from a **trusted source**.
- **MFA for Console Access**: For any IAM users who need console access, we need to set up **multi-factor authentication (MFA)**.
- **Encrypted RDS Storage**: Ensure that the storage for our RDS instances is **encrypted at rest**.

---

### Important Things to Remember (Our Ground Rules)

Here are the critical requirements and constraints for this project:

- **IAM Policy Storage**: All IAM policies absolutely _must_ be kept in a version-controlled system.
- **Security Group Traffic**: Security groups are limited to allowing _only_ HTTP and HTTPS traffic.
- **IAM Permissions**: We're serious about the principle of least privilege for all IAM roles.
- **S3 Encryption**: S3 buckets need to have encryption enabled by default.
- **CloudWatch Logging**: CloudWatch must capture all API requests.
- **AMI Validation**: We need to confirm that all AMIs used come from a trusted source.
- **MFA Requirement**: MFA is mandatory for IAM users who access the console.
- **RDS Encryption**: RDS instance storage must be encrypted at rest.

### Where This Fits In (Environment Context)

Just so you know, this infrastructure will span multiple AWS accounts, specifically in the `us-east-1` region. Our VPCs will have IDs starting with `vpc-`. Also, we have some strict naming conventions: all resources need to be prefixed with 'corp-', and we'll be using specific tagging standards, including 'Environment', 'Owner', and 'CostCenter'.

---

### What We're Looking For as an Output

Please provide a **complete Terraform configuration (`.tf` file)** that meets all the specifications above. The code should be well-organized and commented, designed for reusability (think modules!), and easy to understand. It also needs to include outputs that help us confirm everything meets the requirements. Your code should run successfully when validated with `terraform plan`.

