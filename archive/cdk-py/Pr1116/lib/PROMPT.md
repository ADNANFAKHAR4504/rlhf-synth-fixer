> **Act as an AWS Solution Architect** and write a complete **AWS CDK** project in **Python** that deploys a secure, multi-environment AWS infrastructure in the **us-west-2** region. The architecture must meet the following requirements:
>
> 1. **Storage Encryption**
>
>    * All **S3 buckets** must have:
>
>      * Encryption enabled by default using AWS KMS-managed keys.
>      * Versioning enabled.
>      * Public access fully blocked.
>    * All **RDS databases** must have:
>
>      * Encryption at rest enabled with AWS KMS.
>      * Automated backups enabled.
> 2. **Network Security**
>
>    * Create **Security Groups** to:
>
>      * Allow only required inbound ports (e.g., SSH, HTTPS) from specific CIDR ranges.
>      * Restrict outbound traffic to only necessary destinations.
> 3. **Access Control**
>
>    * Create **IAM Roles and Policies** that follow the **principle of least privilege**.
>    * Separate roles for development and production environments.
> 4. **Tagging & Environment Separation**
>
> **Output Format:** - give the aws cdk + python code in app.py file