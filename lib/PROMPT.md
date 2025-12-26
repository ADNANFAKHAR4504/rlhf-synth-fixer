TASK_TYPE: Security Configuration as Code
TOPIC: Design a **east-privilege IAM design**
MODEL_GOAL: accuracy
PARAMS: temperature=0.5, max_tokens=5000000, top_p=1.0, frequency_penalty=0.0, presence_penalty=0.0
AUDIENCE: principal engineers, platform security, compliance officers,a **CloudFormation YAML template** that enforces **least-privilege IAM design**.
FORMAT: Numbered sections, crisp headings, code fences with filenames.
CONTEXT: treat this prompt as a standalone; no chat history used
VALIDATION: verify that all compliance and environment isolation requirements are respected
ACCESSIBILITY: Use clear language, add inline comments to explain the code
ESTIMATED_COST:
SECURITY: no hardcoded credentials; all secrets stored and rotated via AWS Secrets Manager
FALLBACK: if a resource fails to deploy, adjust dependency order and reapply
FRAMEWORK: C.R.A.F.T.M.
ITERATIVE_REFINEMENT:

### **C - CONSTRAINTS**

Design a **CloudFormation YAML template** that enforces **least-privilege IAM design** and must satisfy ALL of:

1. **IAM Roles**
   - Create two roles:
     - One for **EC2** instances that connects to S3 to read configuration data, writes application logs to CloudWatch Logs, queries DynamoDB tables, and retrieves secrets from SSM Parameter Store
     - One for **Lambda** functions that publishes execution logs to CloudWatch Logs, reads and writes data to DynamoDB tables, and stores processed results in S3 buckets
   - Each must have **inline policies** granting only the **minimum required permissions**.
   - Explicitly **deny any wildcard actions** - no asterisk wildcards allowed.

2. **Permission Boundaries**
   - Apply a **permissions boundary policy** that restricts privilege escalation by denying all IAM, STS, and Organizations actions.
   - All roles created by the stack must reference this boundary.

3. **Validation**
   - Template must pass **cfn-nag** scan with **no findings**.
   - Explicit deny statements or boundaries must prevent policy escalation.
   - Intrinsic functions like !Ref, !Sub, and !GetAtt must be used instead of hard-coded ARNs.

---

### **R - ROLES**

You are an **AWS CloudFormation YAML expert** focused on **IAM security and least-privilege enforcement**, ensuring no over-permissive policies and full compliance with **cfn-nag** static analysis.

---

### **A - ACTION**

Produce a **deployable CloudFormation YAML template** that:

- Defines an **IAM Permissions Boundary** restricting administrative or escalatory actions.
- Creates two **IAM Roles**:
  - `EC2ApplicationRole` that connects to S3 for reading application configuration files, writes logs to CloudWatch Logs, reads from DynamoDB tables, and retrieves parameters from SSM Parameter Store
  - `LambdaExecutionRole` that writes execution logs to CloudWatch Logs, performs read and write operations on DynamoDB tables, and uploads processed data to S3 buckets
- Attaches **inline policies** with least privilege without wildcards.
- Applies the **permissions boundary** to both roles.
- Includes tagging for audit visibility and environment tracking.
- Outputs both role ARNs for downstream use.

---

### **F - FORMAT**

Return the solution in **4 sections**, in this order:

1. **Security Architecture in ASCII** - visualize IAM roles, boundaries, inline policies, and their relationships.
2. **Policy Design Rationale** - justify principle of least privilege for each service.
3. **CloudFormation YAML Template** - fully functional, validated with `cfn-nag`.
4. **Validation Guidance** - commands and expected results for confirming compliance, checking for wildcard actions and cfn-nag-scan output.

---

### **T - TONE**

Authoritative, compliance-focused, concise, implementation-grade.  
No placeholders - use production-safe resource naming with `!Sub` and tagging.

---

### **M - MODEL-SPECIFIC**

- Use **CloudFormation YAML**, not JSON.
- Follow AWS IAM best practices without wildcard actions or resources.
- Include **explicit denies**, **permission boundaries**, and **inline policy scoping**.
- Ensure **cfn-nag** passes with 0 warnings/errors.

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
