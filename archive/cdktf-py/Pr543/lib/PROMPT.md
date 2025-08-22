```markdown
# Prompt: Generate CDKTF (Python) IaC for EC2 + S3 + IAM + CloudWatch

You are an expert **CDKTF (Cloud Development Kit for Terraform) Python** engineer. 
Your task: **generate CDKTF Python Infrastructure-as-Code** that implements the exact requirements below. **Do not change, omit, or reinterpret any of the provided data** keep every value and sentence intact as given.

---

## **Provided Data (must remain unchanged)**

**Contraints:**

Ensure the infrastructure is created in the us-west-2 region. | Use the latest Amazon Linux 2 AMI for EC2 instances. | Implement an S3 bucket with versioning enabled for backup purposes. | Secure the application using an IAM role with least-privilege permissions. | Configure CloudWatch to monitor EC2 instance CPU usage and create an alert if usage exceeds 80%.

**Environment:**

Design a CDKTF PYTHON configuration to set up a cloud environment that meets the following requirements: 1. Deploy an EC2 instance in the AWS us-west-2 region using the latest Amazon Linux 2 AMI. 2. Create an S3 bucket with versioning enabled to store backup files securely. 3. Assign an IAM role to the EC2 instance that enforces least-privilege permissions necessary for accessing the S3 bucket. 4. Integrate CloudWatch monitoring for the EC2 instance, specifically for CPU usage, and configure alerts if usage exceeds 80%. 5. Maintain high security by following AWS best practices for IAM roles. Expected output: Provide a complete HCL Terraform configuration file that implements the above requirements. The solution will be validated by deploying the infrastructure and ensuring compliance with each constraint and requirement.

**Proposed Statement:**

The infrastructure should be set up in AWS us-west-2 region. It requires an EC2 instance using the latest Amazon Linux 2 AMI, an IAM role with restricted permissions, and an S3 bucket with versioning. CloudWatch must be configured for monitoring EC2 CPU usage with alert criteria.

---

## **Generation Instructions for the AI**

1. **Accept and use all text above verbatim.** Do **not** alter wording, numbers, names, or phrasing in the provided data sections. Treat them as immutable requirements.

2. **Primary goal:** Produce **CDKTF Python** code that implements the infrastructure described in the **Environment** and **Constraints** sections.

3. **Key implementation details to include in the generated CDKTF Python:**
- Explicitly set provider region to **`us-west-2`**.
- Resolve **the latest Amazon Linux 2 AMI** dynamically (use the appropriate Terraform data source lookup in CDKTF).
- Create an **EC2 instance** using that AMI.
- Create an **S3 bucket** with **versioning enabled** (for backups).
- Create an **IAM role** and attach an IAM policy that follows **least-privilege** (grant only the permissions required for the EC2 instance to access the specific S3 bucket e.g., `s3:GetObject`, `s3:PutObject`, `s3:ListBucket` scoped to the bucket ARN). **Do not** give broad `*` actions.
- Attach the IAM role to the EC2 instance (via instance profile).
- Configure **CloudWatch**:
- Create a metric alarm monitoring **EC2 CPUUtilization**.
- Alarm triggers when **CPU usage exceeds 80%**.
- Provide an SNS topic (or other reasonable alarm action) to receive alarm notifications.
- Follow **AWS best practices for IAM and security** (least privilege, resource scoping, no wildcard actions).
- Include reasonable **tags** on resources (e.g., Name, Environment) if helpful but **do not** change the required fields above.

4. **Code quality & structure:**
- Output must be **CDKTF Python source code** (a stack file or single module suitable for CDKTF use).
- Use `cdktf` constructs and the official AWS Terraform provider constructs for Python.
- Use a clear, maintainable structure with comments where appropriate.
- Use data source to find the latest Amazon Linux 2 AMI rather than hardcoding AMI IDs.
- Ensure the IAM policy is narrowly scoped to the created S3 bucket.
- Include CloudWatch alarm configuration and alarm action target (SNS topic subscription is acceptable).

5. **Output format & content rules:**
- Produce **only the CDKTF Python code** do not include explanatory prose or extra markdown.
- The produced code must be **self-contained** (imports, class/stack definition, and resource constructs) so it can be dropped into a CDKTF project and synthesized.
- Keep the **provided data intact** in the prompt (do not echo it into the code as comments that modify wording). The infrastructure behavior must strictly follow the constraints and environment above.
- Even though the **Provided Data** mentions Expected output: Provide a complete HCL Terraform configuration file, your deliverable for this prompt must be **CDKTF Python code** that, when synthesized, produces the equivalent Terraform. **Do not modify the original provided text** include it only above (immutable), but generate CDKTF Python code as requested by the outer instruction.

6. **Validation expectations:**
- The generated CDKTF Python code should synthesize successfully (i.e., `cdktf synth` should produce Terraform JSON/HCL).
- The resulting Terraform plan (after synth) should be able to create the resources required to satisfy the constraints (region, AMI resolution, S3 versioning, IAM least-privilege, CloudWatch alarm with >80% CPU threshold).
- Avoid constructs that would prevent deployment (e.g., missing required fields, invalid references).

7. **Security & best practices:**
- Do not use wildcard actions in IAM policies (`"Action": "*"`) or wildcard resources unless absolutely necessary scope policies to the S3 bucket and required CloudWatch/SNS actions.
- Ensure the EC2 instance is launched with an IAM instance profile rather than embedding long-lived credentials.
- Ensure the CloudWatch alarm has an action target (SNS or other) so it is actionable.

---

## **Deliverable**

- A single CDKTF Python stack/module file that implements the described infrastructure.
- **Output ONLY the CDKTF Python code** no extra commentary.

---

### IMPORTANT

- **Do not change any of the provided data** in the Provided Data section above. They are the canonical constraints and environment and must remain exactly as written.
```
