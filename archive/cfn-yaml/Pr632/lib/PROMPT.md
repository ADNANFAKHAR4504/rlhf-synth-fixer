# Prompt: Generate CloudFormation YAML (secure-infra.yaml)

You are an expert Prompt Engineer with 10 years of experience. Your task is to generate a **single, clear AI prompt** that will instruct an LLM to produce an **AWS CloudFormation template in YAML** named `secure-infra.yaml`. The generated CloudFormation must implement the exact requirements below. **Do not change, omit, or reinterpret any of the provided data** treat everything in the "Provided data" section as immutable.

---

## PROVIDED DATA (MUST REMAIN EXACTLY AS WRITTEN)

**Contraints:**

Ensure all AWS S3 buckets have server-side encryption enabled. | IAM roles must have policies attached using least privilege principle. | Enable logging for all AWS RDS instances. | Ensure all EC2 instances are within a VPC using private subnets.

**Environment:**

You are tasked with creating a CloudFormation template for a highly secure, multi-region AWS deployment. Your primary objectives are to enforce security best practices across several AWS services.

1. All AWS S3 buckets created by the template must have server-side encryption enabled.
2. Utilize IAM roles only with the least privilege principle; no IAM user access should be allowed.
3. Ensure all AWS RDS instances have logging enabled to track query and event logs.
4. EC2 instances within this template should be launched inside private subnets within an existing VPC.

Expected output: A CloudFormation YAML template named `secure-infra.yaml` that fulfills the above criteria. Your template will be tested for compliance against each specified constraint. Make sure to validate the stack creation using AWS CloudFormation to ensure no errors exist. Testing in at least two different AWS regions is required to check for compliance and interoperability. All tests must pass successfully for the submission to be considered complete.

**Proposed Statement:**

In a multi-region AWS environment, utilize existing VPCs in each region. Naming conventions follow the format CompanyName-Environment-ResourceType.

---

## GENERATION INSTRUCTIONS (STRICT)

1. **Treat the "PROVIDED DATA" section above as immutable.** Do not change wording, punctuation, capitalization, ordering, or content of any line in that section.

2. **Primary deliverable:** Produce a single CloudFormation YAML file named `secure-infra.yaml` that implements all requirements in the PROVIDED DATA.

3. **Mandatory template content:** The generated `secure-infra.yaml` **must include**:
- **S3 buckets** (one or more) with **server-side encryption enabled** (SSE-S3 or SSE-KMS). If using SSE-KMS, create and reference a Customer Managed KMS key in the template and include appropriate key policies that restrict usage to necessary principals.
- **IAM Roles** only (no IAM users). Roles must have policies attached that follow the **least privilege principle**. **Do not** use wildcard (`"Action": "*"`) permissions. Scope permissions to specific resource ARNs created or explicitly referenced in the template.
- **RDS instances** (or a representative RDS instance) with **logging enabled** (for example, audit, general, slow query, and error logs where applicable). Configure appropriate DB parameter group or option group settings required to enable logging, and ensure CloudWatch Logs export if applicable.
- **EC2 instances** launched **inside private subnets** of an existing VPC. The template should accept parameters to reference an **existing VPC ID** and **private subnet IDs** (do not create a new internet-facing subnet for these EC2 instances).
- **Tags:** resources should follow the naming convention `CompanyName-Environment-ResourceType` where applicable, and include tags consistent with that convention.

4. **Parameters & Outputs:**
- Provide CloudFormation **Parameters** to accept existing VPC identifiers, private subnet IDs (list), and other environment-specific inputs (e.g., DB subnet group, DB username secure parameter via `NoEcho`, KMS key alias if using external key).
- Provide useful **Outputs** (resource IDs/ARNs) for created resources (e.g., S3 bucket ARNs, KMS key ARN, IAM role ARNs, RDS endpoint).

5. **Multi-region testing:**
- The template should be **region-agnostic** (no hardcoded region-specific resource names or ARNs) so it can be deployed in multiple regions. Include guidance as template comments showing how to deploy the same template to two regions for interoperability tests (e.g., deploy to `eu-west-1` and `eu-central-1`), but do **not** modify or restate the PROVIDED DATA. Comments are allowed in YAML but must not alter the immutable section.

6. **Security & Best Practices:**
- Enforce **least-privilege IAM**scope policies to ARNs of resources created or referenced by the template.
- **S3 encryption:** enable default encryption at bucket-level and, if using SSE-KMS, tie the KMS key policy to the creating account and referenced roles only.
- **RDS logging:** ensure logs are exported to CloudWatch Logs or enabled via parameter/option groups.
- **No public DB access:** ensure RDS instances are not publicly accessible and reside in provided private subnets.
- **No IAM users** should be created. Only use IAM roles (for EC2 instance profiles, for services, etc.).
- Avoid inclusion of plaintext secrets in the template. Use `NoEcho` parameters for sensitive inputs.

7. **Template validation:**
- The generated template must be syntactically correct YAML and valid CloudFormation. It should pass `cfn-lint` checks in principle (you do not need to run them here).
- Ensure all required properties for each resource are present so that `aws cloudformation validate-template` would not fail due to missing required fields.

8. **Deliverables & Output format:**
- **Output only** the CloudFormation YAML content for `secure-infra.yaml` do not include any other files or prose outside inline YAML comments.
- The YAML must be complete and self-contained (aside from the existing VPC/subnet IDs supplied via Parameters).
- Do not include placeholder explanatory text outside YAML comments. Placeholders for values (like parameter defaults) are acceptable but must be clearly defined as CloudFormation `Parameters`.

9. **Testing requirements (to be used by the evaluator):**
- Evaluators will deploy `secure-infra.yaml` in **at least two different AWS regions** (e.g., `eu-west-1` and `eu-central-1`) using existing VPCs. The template must work in both regions without modification beyond parameter values.
- The template will be validated against the constraints listed in the PROVIDED DATA. All checks must pass.

10. **Final instruction:** 
Generate the `secure-infra.yaml` CloudFormation YAML template strictly following the rules above and the immutable PROVIDED DATA. Output **only** the YAML content (the template). Do not add extra commentary or modify the provided data.

---
