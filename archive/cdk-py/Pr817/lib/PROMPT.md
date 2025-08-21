```markdown
# Prompt: Generate CDK (Python) IaC for Secure Multi-Region Infrastructure (EU West & EU Central)

You are an expert Prompt Engineer with 10 years of experience. Your task is to generate a single clear prompt that will instruct an AI to produce **Infrastructure as Code (IaC)** using **AWS CDK with Python**. The AI must produce CDK Python code (a CDK app/stack) that implements the exact requirements below. **Do not change, omit, or reinterpret any of the provided data** treat everything in the "Constraints" and "Environment" sections as immutable.

---

## **Provided data (MUST REMAIN EXACTLY AS WRITTEN)**

**Contraints:**

Implement role-based access control using AWS IAM roles. | Ensure all S3 buckets are encrypted using SSE-S3 or SSE-KMS. | Use VPC to host resources and ensure no direct public access to databases. | Create a CloudWatch alarm that triggers an SNS notification on high CPU usage. | Lambda functions must use the latest version of AWS runtime. | Deploy resources across two AWS regions for high availability. | Ensure all resources are tagged with 'Project' and 'Environment' for easy identification and management.

**Environment:**

Design a highly secure and compliant cloud infrastructure using CDK PYTHON. Your task is to create a CDK Python code that adheres to the following requirements: 1. Implement role-based access control using AWS IAM roles for different application components. 2. Ensure all S3 buckets are encrypted using server-side encryption (SSE-S3 or SSE-KMS). 3. Set up a Virtual Private Cloud (VPC) to house your resources, ensuring that databases are not accessible from the public internet; only allow access via private subnets. 4. Provision a CloudWatch alarm to monitor and notify on high CPU usage via an SNS topic. 5. Use Lambda functions with the latest version of AWS runtime. 6. Deploy resources across the EU West (London) and EU Central (Frankfurt, Germany) AWS regions to ensure high availability. 7. Ensure all resources are tagged with 'Project' and 'Environment' for easy identification. Expected output: a YAML CloudFormation template that meets all specified constraints, deployable on AWS without errors.

**Proposed Statement:**

CDK Python code targeting EU West (London) and EU Central (Frankfurt, Germany) regions. Resources are provisioned using default naming conventions unless explicitly stated. The budget allows for selection of predefined AWS managed services where applicable.

---

## **Generation instructions (strict)**

1. **Treat the "Provided data" section above as immutable.** Do not change wording, punctuation, capitalization, or order of any lines in that section.

2. **Primary deliverable:** Produce **CDK Python source code** (stack(s) and any helper modules) that implements the infrastructure described in the "Provided data". The CDK code must be runnable in a CDK v2 Python project.

3. **What must appear in the generated CDK Python code:**
- Explicitly set AWS `env`/region for stacks to **EU West (London) (`eu-west-2`)** and **EU Central (Frankfurt) (`eu-central-1`)** as separate stacks or as multi-stack deployment.
- Implement **role-based access control** using AWS IAM roles for application components; roles must follow least-privilege principle and should not use wildcard (`*`) actions.
- Create **S3 buckets** with server-side encryption (SSE-S3 or SSE-KMS). At least one bucket must be SSE-KMS with an explicitly created KMS key.
- Create a **VPC** with public and private subnets. Ensure databases are placed in private subnets and **no direct public access** is allowed to them.
- Provision a **CloudWatch alarm** that monitors CPU usage for a compute resource (e.g., an EC2 or Lambda metric) and triggers an **SNS topic** notification on high CPU usage.
- Use **Lambda functions** using the **latest AWS runtime version** available in CDK (ensure timeouts and runtime settings are defined).
- Deploy resources across **two AWS regions** (as specified above) for high availability.
- Tag **all resources** with `Project` and `Environment` tags.
- Ensure **CloudWatch Logs** are enabled for Lambda and any other services producing logs.
- If using managed databases (RDS) or other managed services, ensure they are in private subnets and use encryption at rest.

4. **Implementation details & best-practices:**
- IAM roles: supply narrowly scoped policies (examples: access to specific S3 bucket ARNs, KMS key ARNs, SNS publish to the specific SNS topic ARN, CloudWatch Logs PutLogEvents for the specific log groups).
- KMS: create and use customer-managed KMS key(s) for SSE-KMS buckets and grant decrypt/encrypt to only required roles.
- VPC: create appropriate route tables, NAT Gateways or AWS-managed NAT solutions if needed so that private subnets can reach the internet for updates without exposing databases publicly.
- CloudWatch alarm: configure threshold, evaluation periods, and attach the SNS topic as an alarm action. Include an email (placeholder) subscription or show how to add subscriptions.
- Lambda: ensure runtime uses the latest stable runtime name available in CDK (e.g., `python3.11` or newer if available), set reasonable memory and timeout values.
- Multi-region: show clearly how stacks/resources are mapped to each region (two stacks, one per region, or a multi-stack pattern).
- Tags: apply `Project` and `Environment` tags globally to all resources.

5. **Output format:**
- Output **only** the CDK Python source files (one or more `.py` files), plus a `requirements.txt` listing Python dependencies, and a synthesized YAML CloudFormation template per region named `template-eu-west-2.yaml` and `template-eu-central-1.yaml` (or equivalent). If synthesizing is not possible in the response, include instructions in code comments showing how to synthesize (`cdk synth`).
- **Do not** include explanatory prose outside code comments.
- The CDK code must be ready to run: imports, stack class(es), constructs, and `app` bootstrapping file(s) if required (minimal bootstrap). If you include `app`/entrypoint, ensure region selection is explicit.

6. **Validation expectations:**
- The generated CDK app should synthesize successfully (`cdk synth`) for each targeted region.
- The synthesized YAML CloudFormation templates should reflect the constraints (encryption, VPC/private DBs, IAM least privilege, CloudWatch alarm with SNS action, resource tags).

7. **Security & compliance:**
- Do not leave open permissions or public access to databases.
- Do not use overly broad IAM policies.
- Use KMS where SSE-KMS is requested and ensure KMS key policies restrict usage to needed principals.

8. **Deliverables:**
- CDK Python source files implementing the infrastructure.
- `requirements.txt`.
- Synthesized YAML CloudFormation templates per region (or clear in-code comments on how to generate them with `cdk synth`).

---

## **Final instruction**

Generate the CDK Python code and supporting files following the rules above and the immutable provided data. Output **only** the files requested (code, `requirements.txt`, and synthesized YAML files or synthesis instructions). Do not add any extra commentary or alter the provided data section.
```
