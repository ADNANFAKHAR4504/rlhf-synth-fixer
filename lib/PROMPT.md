Act as a **Principal AWS Security Architect** tasked with defining a non-negotiable, enterprise-wide security baseline for the organization's core AWS infrastructure. Your medium is a single, complete **AWS CDK Stack defined in TypeScript**. Your primary objective is to provision a diverse set of services—IAM, S3, CloudFront, API Gateway, CloudTrail, RDS, and VPC—ensuring **zero security misconfigurations** and **maximum adherence to best practices**.

The resulting CDK code must leverage high-level constructs and security properties to **explicitly enforce every security constraint** listed below. Focus on resource interconnection (e.g., granting the Lambda access to the RDS Security Group) and explicit policy definition.

-----

### **Core Infrastructure Requirements & Component Interconnections (CDK Constructs):**

1.  **IAM & Identity:** Define a minimum of one `aws-iam.Role` (for Lambda), one `aws-iam.Policy`, and an `aws-iam.User` (placeholder).
2.  **Network & Access:** Define a complete `aws-ec2.Vpc` with subnets. Implement a `aws-ec2.FlowLog` and a restrictive `aws-ec2.NetworkAcl`.
3.  **Data & Content Delivery:** Define an `aws-s3.Bucket` and a `aws-cloudfront.Distribution`.
4.  **Application Tier:** Define an `aws-apigateway.RestApi` and a `aws-lambda.Function` (Node.js 18.x) as its integration.
5.  **Audit & Compliance:** Define an `aws-cloudtrail.Trail` and a KMS Key (`aws-kms.Key`) to encrypt the logs.
6.  **Database:** Define an `aws-rds.DatabaseInstance` (e.g., PostgreSQL or MySQL).

-----

### **Strict Security & Configuration Constraints (CDK Implementation):**

The resulting CDK TypeScript code must utilize construct properties and methods to implement the following security measures. Add comments in the code to highlight where each constraint is enforced.

| Constraint Category | Security Requirement (CDK Implementation Focus) |
| :--- | :--- |
| **IAM** | **Enforce MFA** requirement for all IAM users via a custom, attached `aws-iam.Policy`. |
| | All IAM roles **must have a Trust Relationship defined** (inherent in the CDK Role construct, but ensure the right service principals). |
| | **Restrict resource access** to specific (placeholder) IAM users and roles using the `grant*` methods or IAM Policy statements. |
| **S3 & Data** | **Enable default server-side encryption** (e.g., SSE-S3 or KMS) on the S3 bucket. |
| | **Block all public access** on the S3 bucket (using `blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL`). |
| **CloudFront & WAF** | **Attach an AWS WAF Web ACL** (`aws-wafv2`) to the CloudFront distribution. Define a simple, placeholder Web ACL. |
| **API Gateway** | **Ensure HTTPS is used** (default for `aws-apigateway.RestApi`, but confirm). |
| | **Enforce the use of request signing (SigV4)** for API Gateway integrations. |
| **Audit & Governance**| **Encrypt CloudTrail logs** using the provisioned **KMS Key** (passed to the `aws-cloudtrail.Trail` properties). |
| | **Enable AWS Config** to track configuration changes across resources using `aws-config.CfnConfigurationRecorder`. |
| | **Enable Security Hub** in the current region using the appropriate CDK construct or custom resource. |
| **Network & VPC** | **Create VPC flow logs** and send them to a **CloudWatch Log Group** (using `vpc.addFlowLog`). |
| | **Network ACLs should explicitly block inbound traffic** from IPs not on an allowlist (by defining `NetworkAclEntry` with `traffic: DENY`). |
| | Ensure the Lambda's **Security Group explicitly denies ingress on port 22 from the internet** (`0.0.0.0/0`). |
| | **Use VPC Endpoints** (e.g., S3, CloudWatch Logs) for connecting to AWS services from within the VPC. |
| **Compute & DB** | Ensure the Lambda function uses the **latest stable Node.js runtime** (`NODEJS_18_X`). |
| | **Enable RDS logging** (e.g., `audit` and `error`) by configuring a `ParameterGroup` and associating it with the `DatabaseInstance`. |
| **Tagging** | **Apply the Tag `Environment: Production` globally** to all resources in the stack using `Tags.of(this).add()`. |

-----

### **Expected Output Format:**

Provide the entire output as a single, complete, and syntactically correct TypeScript file (`secure-baseline-stack.ts`) containing the full CDK stack definition and initialisation file (main.ts)