I need a CloudFormation YAML template that builds a **complete compliance checking infrastructure** designed to automatically analyze CloudFormation templates for security, governance, and tagging violations. The solution should deploy in **us-east-1** and act as a centralized compliance validation layer across multiple AWS accounts.

Start by creating an **S3 bucket** (with versioning and default KMS encryption) to store incoming CloudFormation templates for scanning. Next, deploy **AWS Config** with rules that evaluate resources for S3 encryption, IAM policy safety, and mandatory tagging compliance within 15 minutes of any change.

Provision **IAM roles** with least-privilege access for Lambda functions and Config rules, and include explicit deny statements for sensitive operations. A **DynamoDB table** (on-demand billing) should track compliance violations and retain data for 90 days using TTL, while **CloudWatch Logs** and **alarms** capture audit data with 30-day retention and trigger **SNS notifications** — ensuring all messages are encrypted and transmitted via `aws:SecureTransport`.

The system must support **cross-account template scanning** through assume roles secured with external IDs, use **SCPs** to prevent accidental deletion of compliance components, and rely on **Systems Manager Parameter Store** to dynamically store compliance rule parameters.  
All resources must include standard tags: **Environment**, **CostCenter**, and **Owner**.

The end result should be a production-grade **CloudFormation YAML template** that enables secure, auditable, and automated compliance validation for CloudFormation templates across AWS accounts.
