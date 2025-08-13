# 🛡️ CDKTF Python IaC Prompt for Security Configuration

## 🧠 Prompt Engineer Role

You are an expert Prompt Engineer with 10 years of experience. Your task is to create prompts for AI to generate Infrastructure as Code (IaC) using CDKTF in Python. This prompt is specifically designed to ensure that security configurations are enforced in a large-scale AWS environment.

---

## 📌 Problem Statement Constraints

Please ensure that **none of the following constraints are modified or omitted**:

- ✅ Ensure all S3 buckets have server-side encryption enabled by default.
- ✅ Configure IAM policies to follow the principle of least privilege.
- ✅ Set up CloudTrail to record all API actions across all regions.
- ✅ Implement AWS Shield for DDoS protection on all publicly accessible endpoints.
- ✅ All EC2 instances must not have public IP addresses by default.
- ✅ Ensure that all RDS instances are encrypted using KMS keys.
- ✅ Use CloudWatch to monitor network intrusions and trigger alarms for suspicious activity.
- ✅ All Lambda functions should have restricted permissions via IAM roles.
- ✅ Enforce VPC flow logs to be enabled for all VPCs in the account.

---

## 🌐 Problem Statement Environment

> "Design a comprehensive security as code configuration using CDKTF PYTHON for a large-scale enterprise environment. The configuration must address the following requirements to enhance the security of the AWS resources:

1. Ensure all S3 buckets have server-side encryption enabled by default.
2. Configure IAM policies to follow the principle of least privilege.
3. Set up CloudTrail to record all API actions across all regions.
4. Implement AWS Shield for DDoS protection on all publicly accessible endpoints.
5. All EC2 instances must not have public IP addresses by default.
6. Ensure that all RDS instances are encrypted using KMS keys.
7. Use CloudWatch to monitor network intrusions and trigger alarms for suspicious activity.
8. All Lambda functions should have restricted permissions via IAM roles.
9. Enforce VPC flow logs to be enabled for all VPCs in the account."

---

## 🧾 Expected Output

- A **single CDKTF Python stack file** that implements all the security configurations listed above.
- The **stack must extend the `Construct` class**, not `TerraformStack`.
- Do **not** include the main application entrypoint (e.g., `App()` or `main()` logic).
- The code must pass:
  - ✅ Basic **pylint syntax checks**
  - ✅ Basic **Terraform integrity checks** (`terraform plan`, `terraform validate`)

---

## 🗺️ Scope of AWS Environment

You are working in an **AWS multi-region environment**, with focus on **North America** and **Europe**.

---

## 🚫 Do Not

- ❌ Do not alter or summarize the problem constraints.
- ❌ Do not merge or omit any security requirement.
- ❌ Do not include boilerplate unrelated to the security configuration.

---

## ✅ Deliverables for the AI

A complete and secure IaC **CDKTF Python construct-based class**, addressing all the listed constraints, tailored to a multi-region AWS environment.
