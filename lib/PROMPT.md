**Functional scope**

* Build a **single, production-ready AWS CloudFormation template written entirely in YAML** to provision a secure, fully serverless data-processing and logging environment **from scratch** in **`us-east-1`**.
* The template must **create every resource** independently — nothing should refer to any pre-existing infrastructure.
* All resource names must follow the pattern `<team>-<service>-<use-case>-<resource>-<EnvironmentSuffix>` and all resources must reside in `us-east-1`.

### **Networking**

* Provision a new VPC named `<team>-<service>-<use-case>-vpc-<EnvironmentSuffix>` with:

  * CIDR range passed as a parameter.
  * Two public and two private subnets across distinct Availability Zones.
  * Internet Gateway, NAT Gateways (one per AZ), and properly associated route tables.
  * Lambda functions run **only in private subnets**; NAT used for egress.
  * S3 and DynamoDB **gateway endpoints** plus **interface endpoints** for SQS, CloudWatch Logs, and optional CloudTrail, configured with a dedicated security group.

### **Storage & Logging**

* Create an **S3 bucket for logs**:

  * Server-side encryption using **KMS CMK** (created in this stack).
  * **Versioning enabled**, **public access fully blocked**, and **enforced TLS-only access**.
  * No static `BucketName`; CloudFormation should generate one automatically to prevent name collisions.
  * Used as the **destination for CloudTrail** and application logs.

### **Security & Encryption**

* Create a **KMS CMK** with key rotation enabled, key policy granting:

  * Lambda permission to encrypt/decrypt data.
  * CloudTrail permission to use the key for log file encryption.
  * CloudWatch Logs permission for encrypted log storage.
* Create a **KMS Alias** referencing the CMK.
* Define an **IAM Role** for the Lambda function (no explicit `RoleName` to avoid duplication conflicts).

  * Attach the managed AWS policy `AWSLambdaVPCAccessExecutionRole`.
  * Include a custom inline policy that allows:

    * Writing encrypted logs to CloudWatch.
    * Reading from SQS and DynamoDB Streams.
    * Writing encrypted objects to the log bucket.
    * Encrypt/decrypt operations with the CMK.

### **Compute & Event Processing**

* Deploy a **Lambda function** (runtime configurable via parameter):

  * Deployed inside private subnets with the Lambda security group.
  * Reads messages from **SQS** and records from **DynamoDB Streams**.
  * Logs all processed events to the encrypted S3 log bucket.
  * Inline Python handler code (ZipFile) included directly in YAML.
  * Environment variables for `TABLE_NAME`, `BUCKET_NAME`, `KMS_KEY_ARN`, and `LOG_LEVEL`.
  * Timeout, memory size, and batch parameters tuned for production.
* Create **two Event Source Mappings**:

  * SQS → Lambda.
  * DynamoDB Stream → Lambda (with retry and bisect configurations).

### **Data Layer**

* Create a **DynamoDB table**:

  * On-demand billing mode (`PAY_PER_REQUEST`).
  * Primary key `pk` (string).
  * DynamoDB Stream enabled (`NEW_IMAGE`).
* Create an **SQS queue** with a corresponding **dead-letter queue (DLQ)** and redrive policy.

### **Observability & Monitoring**

* Create an **SNS Topic** `<team>-<service>-<use-case>-alerts-<EnvironmentSuffix>` with an **email subscription** parameter for alerting.
* Create a **CloudWatch Alarm** monitoring the Lambda `Errors` metric:

  * Threshold ≥ 1 error in a 5-minute period.
  * Sends notifications to the SNS topic.
* Define a **CloudWatch Log Group** for Lambda with **30-day retention**.

### **Audit & Governance**

* Deploy a **regional CloudTrail** configured to:

  * Log all management and data events for IAM, S3, Lambda, DynamoDB, SQS, and SNS.
  * Deliver logs to the encrypted S3 log bucket with KMS encryption enabled.
  * Enable log file validation and global service events.

### **Regional & Naming Requirements**

* All resources must be created in `us-east-1`.
* Every resource name must end with `<EnvironmentSuffix>` to support multiple environments.
* Ensure all parameters, conditions, and outputs follow AWS YAML syntax and CloudFormation schema validation.

---

**Deliverable:**
Produce **one YAML file named `TapStack.yml`** containing the complete CloudFormation template.
The file must:

1. Include **Description**, **Parameters**, optional **Mappings/Conditions**, **Resources**, and **Outputs**.
2. Be **fully deployable** in a new AWS account without referencing external resources.
3. Pass `cfn-lint` validation with zero errors or warnings.
4. Avoid static resource names that cause “already exists” errors (especially S3 buckets and IAM roles).
5. Include all encryption, least-privilege IAM policies, subnet associations, and event mappings.
6. Include inline Lambda function code using YAML’s `|` block scalar syntax.
7. Provide clear and descriptive outputs for all major resources (VPC ID, Subnets, Lambda ARN, SQS ARN, DynamoDB Stream ARN, SNS Topic ARN, CloudTrail ARN, etc.).

---

**Acceptance criteria:**

* Template validates successfully via `cfn-lint`.
* Deploys cleanly on first run.
* S3 bucket, KMS, IAM, VPC, Lambda, and CloudTrail conform to AWS security and compliance best practices.
* No naming collisions (S3 bucket and IAM role auto-generated).
* All resources include `EnvironmentSuffix` and follow the naming pattern.
* The final YAML file must be clearly formatted, with proper indentation and structure suitable for direct use in deployment pipelines.

