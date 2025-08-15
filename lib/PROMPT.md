> **Act as an AWS Solutions Architect** and write a complete **AWS CDK** project in **Python** to design and deploy an **advanced disaster recovery infrastructure** in AWS (region: **us-west-2**). The solution must meet the following requirements:
>
> **1. High Availability**
>
> * Deploy all resources across **multiple availability zones** for redundancy and fault tolerance.
>
> **2. IAM Roles & Security**
>
> * Define **IAM roles and policies** with **least privilege access** for all services.
> * Ensure encryption **at rest** (KMS-managed keys)
>
> **3. Automatic Rollback**
>
> * Implement an **automatic rollback mechanism** to revert infrastructure changes on deployment failure.
>
> **4. Backup Strategy**
>
> * Regularly backup **critical data** to **Amazon S3** with lifecycle policies and encryption enabled.
>
> **5. Automated Recovery**
>
> * Use **AWS Lambda functions** to detect failures and **restore failed services/resources** automatically.
>
> **6. Monitoring & Alarms**
>
> * Set up **CloudWatch Alarms** for CPU, memory, and service availability.
> * Create a **CloudWatch Dashboard** for centralized monitoring.
>
> **7. Traffic Routing**
>
> * Configure **CloudFront**  for secure global content delivery.
>
> **8. Logging & Auditing**
>
> * Enable **comprehensive logging** for all services (CloudFront, S3, Lambda, CloudWatch).
> * Store audit logs in an encrypted S3 bucket with restricted access.
>
> **Output Requirements:**
>
> * Provide a **deploy-ready AWS CDK Python project** in app.py file