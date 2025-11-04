[1] TASK_TYPE: Serverless Application
[2] TOPIC: Design a **production-grade serverless payment workflow**
[3] MODEL_GOAL: accuracy
[4] PARAMS: temperature=0.5, max_tokens=5000000, top_p=1.0, frequency_penalty=0.0, presence_penalty=0.0
[5] AUDIENCE: principal engineers, platform security, compliance officers, \*CloudFormation YAML expert** designing a **production-grade serverless payment workflow\*\* with strict transactional integrity, monitoring, and compliance controls.
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

Build a **single CloudFormation YAML template** that deploys a complete **serverless transaction pipeline** and satisfies ALL of the following:

1. **API Gateway (REST)**
   - Request validation + API key authentication
   - Throttling limit = **10,000 RPS**
   - X-Ray tracing enabled

2. **Lambda (Python 3.12, 512MB)**
   - Functions: `validator`, `fraud-detector`, `settlement`, `notification`
   - Reserved concurrency = **100 (validator)**, **50 (others)**
   - 30-day CW Logs retention, X-Ray enabled
   - Env vars loaded from **SSM Parameter Store**

3. **Step Functions (transaction workflow)**
   - Parallel branch for validation + fraud detection
   - Retry 3x with exponential backoff
   - Must finish ≤ **60 seconds**
   - Integrated with Lambda tasks & error handling

4. **DynamoDB**
   - Table: `transactions` (on-demand, **GSI on merchant_id**, PITR on)
   - Table: `audit_logs` (on-demand, PITR on, TTL = 90 days)

5. **S3**
   - `transaction-archives` bucket with **SSE-S3**
   - Lifecycle: **Glacier @ 30 days**

6. **SNS**
   - Topics for alerts + failed transactions
   - Email subscription(s)

7. **Monitoring & Alarms**
   - CW alarms: Lambda errors >1%, API 4xx >5%
   - All components with X-Ray tracing

8. **General Requirements**
   - Use intrinsic functions only (`!Ref`, `!GetAtt`, `!Sub`)
   - Parameterize environment values
   - Export key outputs (API endpoint, StateMachine ARN, Table ARNs)

---

### **R — ROLES**

You are a **CloudFormation YAML expert** designing a **production-grade serverless payment workflow** with strict transactional integrity, monitoring, and compliance controls.

---

### **A — ACTION**

Generate a **deployable CloudFormation YAML template** that defines and wires together:

- API Gateway (REST + key auth + throttling + X-Ray)
- Four Lambdas (runtime/memory/concurrency/logs/SSM env)
- Step Functions workflow with parallel + retries + timeout
- Two DynamoDB tables + GSI + PITR + TTL
- Encrypted S3 archive bucket with lifecycle rules
- SNS topics + subscriptions
- CW alarms + metrics + tracing
- Exports for downstream stacks

---

### **F — FORMAT**

Return the solution in **5 sections, in this exact order**:

1. **Reference Architecture (ASCII)**
2. **Resource Wiring Narrative** (how API→Lambda→SFN→DDB→SNS flows)
3. **Resilience & Performance Controls** (backoff, TTL, PITR, throttling, timeouts)
4. **Security & Compliance Controls** (encryption, SSM params, X-Ray, API key auth)
5. **CloudFormation YAML** (complete, deployable, with Parameters & Outputs)

---

### **T — TONE**

Authoritative, concise, implementation-grade. No tutorial language.

---

### **M — MODEL-SPECIFIC**

- Use **CloudFormation YAML**, not CDK
- Use **Python 3.12** Lambdas, **SSE-S3**, **on-demand DDB**, **intrinsics only**
- No placeholders — provide realistic resource names with `!Sub` + parameters
- Produce a **single template** that can be deployed as-is

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
