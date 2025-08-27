# TapStack Infrastructure Prompt

We need a CloudFormation template (`TapStack.yml`) that builds a secure, compliant baseline for a FinTech app.  
The template should create a new environment from scratch — no references to existing resources.  

### Goals
- Multi-region deployment (primary: `us-east-1`, with global logging and monitoring).
- Security and compliance are top priorities (PCI DSS, SOC2, CIS controls).
- Everything should be tagged with **Environment** and **CostCenter**.

### Requirements
- **Networking**:  
  - New VPC with public + private subnets in multiple AZs.  
  - NAT + Internet Gateway configured properly.  
  - VPC Flow Logs sent to CloudWatch.  

- **Storage**:  
  - S3 buckets (data, logs, CloudTrail) must be private, versioned, encrypted (KMS).  
  - Lifecycle rules for cost control (move to Glacier, expire after 365 days).  

- **Databases**:  
  - DynamoDB (on-demand, KMS encrypted).  
  - RDS (Postgres, Multi-AZ, encrypted, deployed in private subnets).  

- **IAM**:  
  - Roles and users with least privilege.  
  - MFA enforced for all users.  
  - Separate admin vs developer roles.  

- **Monitoring & Logging**:  
  - CloudTrail enabled for all regions.  
  - CloudTrail logs go to an encrypted S3 bucket with access logging.  
  - Config rules to check S3, RDS, DynamoDB encryption, and restricted ports.  

- **Security Groups**:  
  - Only allow inbound 80/443 where required.  
  - Everything else locked down.  

- **Automation**:  
  - Lambda function for auto-remediation (e.g., enforce S3 versioning, block public access).  

### Outputs
Export useful identifiers: VPC ID, bucket names, RDS endpoint, DynamoDB table, Lambda ARN, etc.

We’ll expect a complete `TapStack.yml` in YAML, with comments where necessary, but no explanatory text outside the template.
