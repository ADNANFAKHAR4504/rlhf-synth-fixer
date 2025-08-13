You are an expert AWS CloudFormation engineer. Your task is to design and implement a secure production infrastructure for an application named SecureApp, deployed in the us-east-1 region.

Your CloudFormation template must strictly follow the specifications below to achieve maximum security and compliance:

Security & Compliance Requirements IAM Roles & Policies

Must follow the principle of least privilege with permissions scoped only to what is strictly required.

Network Restrictions

Security Groups: Restrict inbound access to specific IP ranges only.

Network ACLs: Implement to secure VPC subnets with explicit inbound/outbound rules.

EC2 Instances: Must not have a public IP address directly attached.

Storage & Data Protection

S3 Buckets: Default encryption enabled (AES-256 or AWS KMS).

RDS Databases: Encryption at rest enabled using AWS KMS.

Logging & Monitoring

CloudTrail: Enabled for all regions, logs encrypted with a KMS CMK.

VPC Flow Logs: Enabled for all VPCs.

AWS Config Rules: Ensure compliance monitoring for key security configurations.

AWS Security Hub: Enabled for continuous monitoring and threat analysis.

Encryption in Transit

All communications must use SSL/TLS (HTTPS for web endpoints, TLS for database connections).

Password & Secrets Management

Enforce strong password policies using AWS::IAM::AccountPasswordPolicy.

Store sensitive passwords/secrets in AWS Secrets Manager.

DDoS Protection

Enable AWS Shield for relevant resources.

Tagging & Naming Conventions

All resources must follow the naming format:

Apply tags for:

Project: SecureApp

Environment: production

Expected Output Produce a valid CloudFormation YAML template named secure-infra.yaml that:

Fully implements the above requirements.

Deploys without any errors or warnings from cfn-lint.

Passes all logical and security best-practice checks.

Groups resources logically and uses descriptive comments.