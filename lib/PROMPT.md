Using Pulumi's Java SDK, provision an infrastructure with the following specification.

**Requirements**
- VPC & Networking
    - Create a Virtual Private Cloud (VPC) with both **public** and **private subnets**.
    - Ensure proper separation of resources based on accessibility requirements.

- Compute Security
    - Deploy EC2 instances.
    - Secure them with **Security Groups**:
        - Only necessary ports and protocols should be allowed.
        - All ingress/egress traffic must be locked down by default.

- Storage Security
    - Provision S3 buckets for critical data.
    - Ensure all buckets are encrypted using **AWS KMS with Customer Managed Keys (CMKs)**.

- IAM & Access Control**
    - Define IAM roles following the **principle of least privilege**.
    - Enforce **Multi-Factor Authentication (MFA)** for IAM users who manage cloud resources.

- Auditing & Compliance**
    - Enable **AWS CloudTrail** to log all account activities.
    - Ensure logs are stored securely and are immutable.

- Regional Deployment**
    - All resources must be deployed exclusively in:
        - `us-west-2`
        - `us-east-1`

**Constraints**
- EC2 instances must only be accessible via explicitly defined Security Group rules.
- S3 buckets with critical data **must be encrypted with KMS CMKs**.
- IAM roles must be scoped to the **minimum permissions required**.
- MFA must be enabled for IAM users managing resources.
- Deployment is restricted to **`us-west-2` and `us-east-1`**.
- AWS CloudTrail must be enabled for full account auditing.

**Compliance and Design**
A Pulumi Java IaC implementation that:
- Provisions all required resources.
- Enforces the listed constraints.
- Meets strict security compliance standards.
- Follows a **modular design pattern**, with resource definitions organized in a **`components` package**.