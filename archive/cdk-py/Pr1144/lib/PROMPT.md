> **Act as an AWS Solution Architect** and write a complete **AWS CDK** project in **Python** to deploy a **secure AWS infrastructure** in the **us-west-2** region. The solution must follow AWS security best practices and include the following:
>
> 1. **VPC Configuration**
>
>    * Create a VPC with **both public and private subnets** across at least two Availability Zones.
>    * Enable VPC flow logs for monitoring.
> 2. **Security Groups**
>
>    * Only allow inbound **HTTP (80)** and **HTTPS (443)** traffic to public-facing services.
>    * Create separate security groups for the **bastion host**, **RDS instances**, and **EC2 application servers**.
>    * Restrict SSH access to the bastion host from specific CIDR ranges.
> 3. **IAM Roles & Policies**
>
>    * Create IAM roles for EC2 instances that grant **minimal privileges** to access specific S3 buckets.
>    * Ensure all IAM policies follow the **principle of least privilege**.
> 4. **Storage Encryption**
>
>    * Create S3 buckets with:
>
>      * Encryption enabled (AWS KMS).
>      * Public access blocked.
>    * Create RDS instances with:
>
>      * Encryption enabled.
>      * **Multi-AZ** deployment for high availability.
> 5. **Logging & Auditing**
>
>    * Enable **AWS CloudTrail** for API call auditing.
>    * Store CloudTrail logs in an encrypted S3 bucket.
> 6. **Bastion Host**
>
>    * Launch a bastion host in the public subnet for secure SSH access to private resources.
> 7. **Secrets Management**
>
>    * Store all sensitive data (e.g., DB credentials) in **AWS Secrets Manager**.
>
> **Output Requirements: AWS CDK python code in app.py file**