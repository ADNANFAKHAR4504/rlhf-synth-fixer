> **Act as an AWS Solution Architect.**
>
> Design a secure, production-grade AWS infrastructure using **CloudFormation in YAML format**. The template must deploy a web application environment that complies with **enterprise security standards** and **organizational policies**.
>
> Implement the following:
>
> 1. **VPC Configuration**
>        • Create two VPCs: `ProductionVPC` and `StagingVPC` in the `us-east-1` region
>        • Each VPC must contain one **public** and one **private** subnet
>
> 2. **IAM Roles & Policies**
>        • Use **AWS managed policies** where possible
>        • IAM roles must follow **least privilege** principles
>        • Include **comments** for every IAM definition
>        • Use **IAM condition keys** to restrict by AWS service
>
> 3. **S3 Bucket Security**
>        • All buckets must use **AES-256 encryption** at rest with **KMS**
>        • Enforce **encryption in transit** (HTTPS only) via bucket policy
>
> 4. **Security Groups and NACLs**
>        • Restrict **inbound traffic** to a specific IP CIDR (e.g., office IP)
>        • Deny **outbound internet traffic** in NACLs for private subnets
>
> 5. **Monitoring and Logging**
>        • Enable **VPC Flow Logs** for both VPCs and stream to **encrypted CloudWatch Logs**
>        • Enable **AWS Config** to track changes and monitor compliance
>
> 6. **Tagging**
>        • All AWS resources must be tagged with:
>            - `Environment: production` or `staging`
>            - `Project: <project-name>`
>
> Additional Requirements:
>
> * Use **CloudFormation intrinsic functions** (`!Ref`, `!Sub`, `!GetAtt`, etc.) to avoid hardcoded values.
> * Ensure the template is **valid and deployable** without manual changes.

Return only the **CloudFormation YAML template** that fulfills the above specifications.

---