Here’s the refined **CloudFormation generation prompt**, excluding **AWS Config Recorder** and **AWS ACM** while keeping all other requirements intact:

---

**Prompt:**
Create an AWS CloudFormation YAML template that designs and implements a secure, highly available web application infrastructure with the following requirements:

1. Deploy an **Application Load Balancer (ALB)** integrated with **AWS WAF** to protect against common web exploits and attacks.
2. Use an **existing SSL certificate ARN** (passed as a parameter) for secure **HTTPS (port 443)** traffic on the ALB instead of provisioning a new ACM certificate.
3. Create an **S3 bucket** to store **AWS CloudTrail logs**, ensuring **server-side encryption (SSE-S3)** is enabled and public access is blocked.
4. Configure **CloudWatch Alarms** to detect and alert on the following metrics:

   * `UnauthorizedAPICall`
   * `AWSBruteForceReport`
5. Define **IAM Roles and Policies** applying the **principle of least privilege** for all AWS services involved (EC2, ALB, CloudWatch, CloudTrail, WAF, S3).
6. Implement a **VPC** spanning **at least two Availability Zones**, with **public and private subnets**, **Internet Gateway**, **NAT Gateway**, and proper **route tables** for high availability.
7. Add a **Config Rule (only the rule, not the Config Recorder or Delivery Channel)** that checks for **unrestricted SSH access (port 22)** in any Security Group.
8. Enable **logging for all S3 buckets** used in the infrastructure, including the CloudTrail bucket.
9. Configure **Security Groups** so that:

   * The ALB allows **only inbound HTTPS (443)**.
   * EC2 instances in private subnets allow inbound traffic only from the ALB.
10. Ensure the overall design follows **AWS security best practices** and **least privilege principles**, with parameterized and reusable CloudFormation syntax for production readiness.

The output should be a **single, production-grade CloudFormation YAML template** that includes:

* All `Parameters`, `Resources`, and `Outputs` sections.
* Proper dependency handling between resources.
* Descriptive logical IDs and comments.
* Compliance with AWS security and availability standards — **without using Config Recorder or AWS ACM certificate creation**.

---
