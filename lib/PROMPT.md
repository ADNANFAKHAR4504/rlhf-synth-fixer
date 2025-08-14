**Prompt**
You are an AWS Professional Solutions Architect and expert in CloudFormation YAML best practices.
Create a **CloudFormation YAML template** named `TapStack.yml` for a **secure AWS infrastructure** with the following specifications:

**Environment Context:**

* Deployment region: **us-west-2**
* Environment includes: IAM roles, S3 bucket, VPC with networking components, CloudWatch alarms, and resource tagging.

**Requirements:**

1. **IAM Roles**

   * Create IAM roles for different application components.
   * Each IAM role must have **minimal necessary permissions** (principle of least privilege).
   * Roles should only grant access to the exact services and actions needed.

2. **S3 Bucket**

   * Deploy an S3 bucket with **globally unique name**.
   * Enable **server-side encryption** using **AWS managed KMS keys (SSE-S3)**.

3. **VPC Setup**

   * Create a VPC with **one public subnet** and **one private subnet**.
   * Attach an **Internet Gateway** for public subnet internet access.
   * Deploy a **NAT Gateway** in the public subnet to allow private subnet resources outbound internet access.

4. **Monitoring & Security Alerts**

   * Implement a **CloudWatch alarm** to detect and notify about **unauthorized access attempts** on IAM roles or S3 buckets.
   * Use CloudTrail logs as the source for detecting these events.

5. **Tagging**

   * Apply consistent **Tags** to all resources for cost tracking and resource allocation (e.g., `Environment`, `Owner`, `Project`).

**Constraints:**

* The IAM roles must have only essential permissions (no wildcards like `"*"` unless unavoidable).
* CloudWatch alarm must trigger on `AWS.CloudTrail` events for unauthorized access.
* Ensure the template passes `cfn-lint` validation and follows AWS security best practices.

**Expected Output:**

* Provide a single **valid CloudFormation YAML file** named `TapStack.yml` that meets all the above requirements.
* The YAML must be fully functional and ready for deployment with `aws cloudformation deploy`.