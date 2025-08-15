> **Act as an AWS Solution Architect**.
> I need you to design and implement AWS infrastructure security configurations using **AWS CDK in Python**.
>
> **Requirements:**
>
> 1. **IAM Roles & Policies** – Enforce the **principle of least privilege** for all roles and policies.
> 2. **VPC Configuration** – Create a VPC with at least **two public** and **two private subnets** spread across **two Availability Zones** for high availability.
> 3. **Security Groups** – Restrict inbound and outbound traffic to **specific IP ranges only**.
> 4. **S3 Buckets** – All S3 buckets must have:
>
>    * Server-side encryption enabled.
>    * Names containing the keyword **`secure-data`**.
> 5. **CloudTrail** – Enable CloudTrail to log **all management events**.
> 7. **KMS for RDS** – Use AWS Key Management Service (KMS) to encrypt sensitive data stored in RDS instances.
> 8. **Tagging Policy** – Apply a consistent set of **tags** to all resources for cost tracking and compliance
>
>
> **Output:**
>
> * Provide a **fully working AWS CDK Python project structure** that meets the above requirements in main.py file.
> * Include clear comments in the code explaining **why** each configuration is applied.
> * Show **`cdk.json`**, **`requirements.txt`**, and stack/constructs files.
> * Ensure it’s deployable in **us-west-2** by default.