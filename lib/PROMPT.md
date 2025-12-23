Prompt:
You are acting as a Cloud Engineer responsible for designing a secure production environment on AWS. This must be implemented using CloudFormation in YAML, adhering to AWS best practices for security, scalability, and compliance.

The deployment region is us-west-2.

Requirements
Your CloudFormation template must meet the following specifications:

S3 Security
All S3 buckets must be private by default.
Enable server-side encryption with AWS KMS (SSE-KMS) for all data at rest.
IAM Roles
Define IAM roles following the principle of least privilege for all AWS services.
EC2 & Auto Scaling
All EC2 instances must be launched as part of an Auto Scaling Group (ASG).
Minimum ASG capacity: 2 instances.
Elastic Load Balancer (ELB)
Integrate an ELB to distribute incoming traffic across the ASG.
CloudTrail
Enable CloudTrail to log all API calls.
Deliver logs to a secure, encrypted S3 bucket.
VPC
Deploy all resources within a single, isolated VPC.
AWS Config
Enable AWS Config to track resource changes and generate compliance reports.
Resource Tagging
Apply the following tags to all resources:
Environment: Production
Project: IaC - AWS Nova Model Breaking
Naming Conventions
Follow AWS naming best practices.
Append a prod suffix to all resource names.
Expected Output
A single YAML CloudFormation template named: secure_infrastructure.yaml
The template must be:
Complete
Validated (passes cfn-lint / AWS validation)
Deployable in us-west-2
