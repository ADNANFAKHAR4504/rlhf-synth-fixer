--

#### **Prompt:**

> You are a senior AWS CDK engineer specializing in **highly secure, compliance-driven data processing architectures** using **TypeScript (CDK v2)**.
> Analyze the input and produce a **complete CDK application** that deploys a fully private, encrypted, audited data pipeline for sensitive financial records — with **no internet access**, strict IAM, and detailed monitoring.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full stack implementing VPC, Lambda, S3, DynamoDB, KMS, IAM, VPC endpoints, security groups, logs, and alarms — all wired together securely.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK TypeScript program to deploy a secure data processing infrastructure for handling sensitive financial records. The configuration must: 1. Create a VPC with 3 private subnets across different AZs with no internet access. 2. Deploy S3 buckets for input and output data with KMS encryption using customer-managed keys. 3. Implement Lambda functions that process data from the input bucket to the output bucket. 4. Configure VPC endpoints for S3 and DynamoDB to avoid internet traffic. 5. Create IAM roles with minimal permissions and explicit deny statements for unauthorized actions. 6. Set up DynamoDB table for transaction metadata with encryption at rest. 7. Configure CloudWatch Logs for Lambda function logs with 7-year retention. 8. Implement security groups that only allow traffic between Lambda and VPC endpoints. 9. Enable S3 bucket versioning and lifecycle policies for compliance. 10. Create CloudWatch alarms for failed Lambda invocations and unauthorized access attempts. Expected output: A complete CDK TypeScript application that deploys all resources with proper security configurations, including KMS keys, IAM policies with explicit denies, VPC with endpoints, and monitoring setup.",
>   "background": "A financial services company needs to implement a secure data processing pipeline that meets strict compliance requirements. The infrastructure must enforce encryption at every layer and maintain detailed audit trails for regulatory purposes.",
>   "environment": "Secure multi-AZ deployment in us-east-1 for financial data processing. Uses Lambda functions in private subnets, S3 with KMS encryption, DynamoDB with encryption at rest, and CloudWatch Logs for audit trails. VPC with 3 private subnets across availability zones, VPC endpoints for S3 and DynamoDB. No NAT Gateway or Internet Gateway. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured with appropriate IAM permissions.",
>   "constraints": [
>     "All S3 buckets must use KMS encryption with customer-managed keys",
>     "IAM roles must follow the principle of least privilege with explicit deny statements",
>     "VPC endpoints must be used for all AWS service communications",
>     "Security groups must only allow traffic from specific CIDR blocks",
>     "All Lambda functions must run inside VPC with no internet access",
>     "CloudWatch Logs must retain audit logs for exactly 7 years"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 (TypeScript)** with modules:
>
>    * `aws-ec2`, `aws-lambda`, `aws-s3`, `aws-dynamodb`, `aws-kms`, `aws-iam`,
>    * `aws-logs`, `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-s3-deployment` (optional), `aws-ssm` (optional for config).
> 2. Implement and correctly **wire** all components:
>
>    * **VPC & Networking**
>
>      * VPC in `us-east-1` with **3 private subnets across 3 AZs**.
>      * **No Internet Gateway, no NAT Gateway** — completely private.
>      * VPC **Gateway/Interface Endpoints** for **S3** and **DynamoDB** (and optionally Logs/STS if needed) so all traffic stays inside AWS network.
>      * Security groups allowing traffic **only between Lambda ENIs and VPC endpoints / internal CIDR blocks**, nothing from 0.0.0.0/0.
>    * **KMS & Encryption**
>
>      * Customer-managed **KMS keys** for:
>
>        * Input S3 bucket
>        * Output S3 bucket
>        * DynamoDB table (if using KMS CMK instead of AWS-managed)
>      * Key policies restricted to this account and specific IAM roles/Lambdas.
>    * **S3 Buckets (Input & Output)**
>
>      * Two buckets: `input` and `output`, both using **SSE-KMS** with CMKs.
>      * **Versioning enabled** and lifecycle policies (e.g., transition/archive/expiration) to satisfy compliance.
>      * Bucket policies enforcing TLS-only access and denying unencrypted operations.
>    * **Lambda Functions (Data Processing)**
>
>      * Run **inside the VPC** in private subnets, no public IPs, no internet access.
>      * Trigger: S3 event on input bucket object create → Lambda processes and writes to output bucket.
>      * Use least-privilege IAM roles with **explicit deny statements** for disallowed services/actions.
>      * CloudWatch Logs configured with **exactly 7-year retention** for audit trails.
>    * **DynamoDB (Transaction Metadata)**
>
>      * Table for transaction metadata (e.g., PK `transactionId`, SK `timestamp` or similar).
>      * **Encryption at rest** (prefer CMK if desired) and point-in-time recovery optional for audit.
>      * Access via VPC endpoint only.
>    * **IAM Hardening**
>
>      * Roles for Lambda and any helper components:
>
>        * Grant **only** needed actions on KMS, S3, DynamoDB, Logs, etc.
>        * Include **explicit `Deny`** statements for risky operations (e.g., `s3:PutBucketAcl`, `kms:DisableKey`, `dynamodb:DeleteTable`) to enforce controls even if attached elsewhere.
>    * **Logging & Monitoring**
>
>      * CloudWatch Log Groups for each Lambda with **7-year retention**.
>      * CloudWatch **alarms** for:
>
>        * Failed Lambda invocations (Errors > 0).
>        * Optional: high throttles or timeouts.
>        * “Unauthorized access attempts” derived from metric filters on CloudTrail/CloudWatch Logs patterns (e.g., `AccessDenied`).
>      * Optionally route alarms to SNS for security team alerts.
> 3. **Security Groups & CIDR Rules**
>
>    * SGs that:
>
>      * Allow **only** necessary traffic from internal CIDR ranges (e.g., VPC CIDR) and between Lambda ENIs and VPC endpoints.
>      * No wide-open ingress or egress to 0.0.0.0/0.
> 4. **Tagging & Metadata**
>
>    * Apply consistent tags: `Environment=Production`, `Project=SecureFinancialProcessing`, `ManagedBy=CDK`, `DataClassification=Sensitive`.
> 5. **Code Layout & Style**
>
>    * Clear, modular sections with comments:
>
>      * `// 🔹 VPC & Endpoints`
>      * `// 🔹 KMS Keys`
>      * `// 🔹 S3 Buckets`
>      * `// 🔹 DynamoDB Table`
>      * `// 🔹 Lambda Functions`
>      * `// 🔹 IAM Policies (Least Privilege + Deny)`
>      * `// 🔹 Logs & Alarms`
> 6. Output **only two files** — in fenced code blocks:
>
>    * `main.ts`
>    * `tapstack.ts`
>      No extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **locked-down, compliant data processing pipeline** that:
>
> * Runs **entirely inside private subnets** with **VPC endpoints only**
> * Uses **CMK-backed KMS encryption** for S3 and DynamoDB
> * Enforces **least-privilege IAM with explicit denies**
> * Keeps **7 years of detailed audit logs**
> * Monitors for failures and suspicious access patterns via **CloudWatch alarms**

---