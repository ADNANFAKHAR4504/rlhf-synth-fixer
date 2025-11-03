[1] TASK_TYPE: Security Configuration as Code
[2] TOPIC: Design a solution that enforces encryption & compliance across the account
[3] MODEL_GOAL: accuracy
[4] PARAMS: temperature=0.5, max_tokens=5000000, top_p=1.0, frequency_penalty=0.0, presence_penalty=0.0
[5] AUDIENCE: principal engineers, platform security, compliance officers, **AWS CloudFormation (YAML) expert** building a **security-grade compliance template** for a **SaaS company with strict encryption mandates** and audit requirements.
[6] FORMAT: Numbered sections, crisp headings, code fences with filenames.
[7] CONTEXT: treat this prompt as a standalone; no chat history used
[8] VALIDATION: verify that all compliance and environment isolation requirements are respected
[9] ACCESSIBILITY: Use clear language, add inline comments to explain the code
[10] ESTIMATED_COST:
[11] SECURITY: no hardcoded credentials; all secrets stored and rotated via AWS Secrets Manager
[12] FALLBACK: if a resource fails to deploy, adjust dependency order and reapply
[13] FRAMEWORK: C.R.A.F.T.M.
[14] ITERATIVE_REFINEMENT:

### **C — CONSTRAINTS**

Create a **CloudFormation YAML template** that enforces encryption & compliance across the account and must satisfy ALL of:

1. **S3 encryption** — all provisioned buckets must enforce **default encryption (AES-256 or SSE-KMS)** and forbid unencrypted PUTs.
2. **EBS encryption** — enable **account-level default EBS encryption** with KMS.
3. **IAM MFA policy** — attach IAM inline / SCP-style control requiring **MFA for _all_ IAM users** for any privileged or risky operations.
4. **AWS Config** — deploy **Config Rules** that detect non-encrypted S3/EBS resources and surface them as **NON_COMPLIANT**.
5. Template must pass **cfn-nag** validation and be compatible with **AWS Config Conformance Packs**.
6. Resources must be tagged consistently, use intrinsic functions (`!Ref`, `!Sub`, `!GetAtt`), and avoid hard-coding ARNs or regions.

---

### **R — ROLES**

You are an **AWS CloudFormation (YAML) expert** building a **security-grade compliance template** for a **SaaS company with strict encryption mandates** and audit requirements.

---

### **A — ACTION**

Produce a **deployable CloudFormation YAML** that:

- Creates an **encrypted S3 bucket** with public access blocked + bucket policy rejecting unencrypted uploads.
- Enables **EBS default encryption** (via `AWS::EC2::EBSDefaultKmsKeyId` or related settings).
- Applies an **IAM policy requiring MFA** for IAM users (deny actions without `aws:MultiFactorAuthPresent`).
- Deploys **AWS Config rules** (managed or custom) validating encryption for S3 and EBS.
- Outputs key ARNs/names required for integration tests.

---

### **F — FORMAT**

Return answer in **5 sections, in this order**:

1. **Reference Architecture (ASCII)**
2. **Security / Compliance Mapping** — requirement ➜ resource ➜ enforcement mechanism
3. **Test Plan Mapping** — how to validate each of: S3 encryption, EBS encryption, MFA policy, Config compliance
4. **CloudFormation YAML** (full, deployable, conformance-friendly)
5. **Post-Deploy Validation Steps** — CLI/Console checks to confirm **COMPLIANT** state

---

### **T — TONE**

Authoritative, concise, audit-ready. Avoid tutorial prose. No placeholders — use production-style naming and tagging.

---

### **M — MODEL-SPECIFIC**

- Use **YAML CloudFormation only**
- Use managed Config Rules where possible
- Encrypt everything with **customer-managed or SSE-S3/KMS**
- Ensure the template is compatible with **cfn-nag** and **Config conformance packs**

---

# Inline Additions

- **Model Parameters**: `temperature=0.5` for high determinism
- **Context Handling**: Treat this as standalone input
- **Examples**:
- **Validation**: Confirm all constraints are met:
- **Accessibility**: Include clear comments and readable variable names
- **Performance Tips**:
- **Security**: Never hardcode credentials; always use secrets
- **Fallback**: If resource order causes failure, auto-correct and retry dependencies
