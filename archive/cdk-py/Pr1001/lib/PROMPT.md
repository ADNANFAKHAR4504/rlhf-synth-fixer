> **Act as an AWS Solutions Architect**. Write an AWS CDK application in Python to design and implement a secure AWS environment in the **us-west-2** region with the following requirements:
>
> 1. **IAM & Security**
>
>    * Create IAM roles and policies with **least privilege** permissions for all AWS resources.
>    * Enable **Multi-Factor Authentication (MFA)** for IAM users.
> 2. **S3 Security & Logging**
>
>    * Create S3 buckets with public access **fully blocked**, server access logging enabled, **versioning** turned on, and **KMS-managed encryption**.
>    * Apply S3 bucket policies to enforce security.
> 3. **Monitoring & Compliance**
>
>    * Create **CloudWatch Alarms** to monitor IAM policy changes.
>    * Enable **CloudTrail** for logging all API calls, store logs in encrypted S3 buckets.
>    * Enable **VPC Flow Logs** for traffic monitoring.
>    * Enable **GuardDuty** for continuous threat detection.
> 4. **Network & Compute Security**
>
>    * Create a **VPC** with private and public subnets.
>    * Deploy all EC2 instances in an **Auto Scaling Group** with restricted SSH access via Security Groups.
>    * Deploy AWS Lambda functions **inside the VPC** for enhanced security.
> 5. **Web Application Security**
>
>    * Deploy an **AWS WAF** to protect against common exploits.
> 6. **Backup & Recovery**
>
>    * Enable **AWS Backup** with a backup plan for critical resources.
> 7. **Other Constraints**
>
>    * All data at rest must be encrypted with AWS **KMS**.
>    * All resources must use the naming convention: `"sec-<resource-type>"`.
>    * Follow **AWS security best practices** for every configuration.
>
> **Expected Output:**
>
> * Provide a **complete AWS CDK Python project** in app.py file:


---