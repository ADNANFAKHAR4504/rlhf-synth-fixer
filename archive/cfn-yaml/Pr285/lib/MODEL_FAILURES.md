## Model Failure Criteria

This document outlines scenarios in which the model's output would be considered a failure when responding to the provided CloudFormation prompt for securing a web application on AWS.

### 1. **Missing Required Resources**
- **S3 Bucket not encrypted** using a **custom KMS key** (i.e., uses the default AWS-managed key or no encryption at all).
- **API Gateway** is missing or does not have **access logging** configured to CloudWatch.
- **IAM roles** are either not defined or include overly broad permissions (e.g., `Action: "*"`, `Resource: "*"`) violating the **least privilege principle**.
- **VPC is missing**, not defined with `10.0.0.0/16` CIDR block, or lacks proper subnet configuration.
- **Security groups** allow traffic on **port 80 (HTTP)** or other unnecessary open ports without restrictions.

### 2. **Incorrect Resource Configuration**
- KMS key is not configured as a **customer-managed key**.
- API Gateway logs are not configured for **all endpoints** or lack critical log fields such as `requestId`, `caller IP`, `method`, or `status`.
- Subnets have overlapping CIDRs or do not fall within `10.0.0.0/16`.
- Security group allows unrestricted ingress/egress or lacks specific port/protocol rules (e.g., missing TCP/443).

### 3. **Syntax or Structural Errors**
- YAML is malformed or contains syntax errors.
- CloudFormation intrinsic functions (`!Ref`, `!GetAtt`, etc.) are misused or broken.
- The template does not pass **AWS CloudFormation validation**.

### 4. **Non-compliance with Naming and Scope Requirements**
- Resources are not named descriptively or consistently.
- IAM roles are unnamed or use generic/default roles instead of scoped, role-specific definitions.

### 5. **Incomplete Template**
- Omits any of the five primary requirements listed in the prompt.
- Does not define outputs or useful metadata when necessary for verification or debugging.
- Template contains placeholders (e.g., `YOUR_ROLE_HERE`, `TODO`, `<replace_me>`) instead of valid CloudFormation syntax.

---

To be considered successful, the model must return a **complete**, **valid**, and **secure** CloudFormation YAML template that satisfies **all** functional and security requirements described in the original prompt.
