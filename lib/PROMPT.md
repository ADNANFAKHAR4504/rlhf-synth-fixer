You are an expert AWS CloudFormation architect.
Your task is to generate a **fully valid CloudFormation YAML template** that meets the following requirements and constraints. Before producing the output:

1. **Validate all resources are the latest available**:

   * Ensure the latest **Amazon Linux 2 AMI ID** for the `us-east-1` region is used for EC2 instances.
   * Confirm all AWS resources (RDS, Lambda, CloudTrail, Config, etc.) use the most up-to-date and supported configurations.

2. **Validate IAM policies and roles**:

   * No IAM policy should include wildcards (`*`) in actions or resources.
   * All IAM roles and policies must comply with AWS best practices.

3. **Generate a CloudFormation YAML template** that meets the following requirements:

   * Provision S3 buckets with **server-side encryption using AWS KMS keys**.
   * Launch all EC2 instances with a specific IAM role granting access to an S3 bucket.
   * Security groups must only allow **SSH (port 22)** inbound from a defined IP range.
   * RDS instances must be **encrypted at rest with AWS KMS keys**.
   * Lambda functions must have **CloudWatch Logs enabled**.
   * The VPC must contain only **private subnets** (no public subnets).
   * All resources must be tagged with `'Environment'` and `'Owner'`.
   * IAM policies must not permit **wildcard actions**.
   * Enable **termination protection** for critical EC2 instances.
   * Ensure **CloudTrail is enabled in all regions** with **log file validation**.
   * Configure **CloudWatch alarms** for unauthorized access attempts.
   * Deploy everything in the **us-east-1** region.
   * Enable **AWS Config rules** to track security group modifications.
   * Security groups must have **descriptive names and purposes**.

4. **Output formatting rules**:

   * Provide only the **CloudFormation YAML template** (no explanations, no extra text).
   * The template must be **validated** and deployment-ready.

⚡ Example system-style instruction to the AI model:

> "Generate a CloudFormation YAML template that provisions all required AWS resources in **us-east-1**, using the **latest AMI IDs** and ensuring all IAM policies are **valid** and free from wildcards. The template must meet all listed compliance/security requirements, pass validation, and be deployment-ready. Only output the YAML file."