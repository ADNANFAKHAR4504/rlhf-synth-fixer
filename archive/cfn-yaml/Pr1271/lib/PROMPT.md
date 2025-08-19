## Prompt

Need a AWS code for Infrastructure as Cde (IaC) using CloudFormation.

Objective: 
Generate a comprehensive, secure, and reusable CloudFormation template in YAML to establish a baseline of security best practices. This template will be deployed across a multi-account (Development, Testing, Production) and multi-region (us-west-2 and us-east-1) AWS environment.

Core Requirements:
You must create a single CloudFormation template that programmatically enforces the following 15 security controls. The template should be parameterized where necessary to support different environments.
IAM Least Privilege: All IAM Roles and Policies defined in the template must strictly adhere to the principle of least privilege, granting only the permissions necessary to perform their intended functions.
Root User MFA: Include a resource (such as an AWS Config Rule) to check and flag if Multi-Factor Authentication (MFA) is not enabled for the root user account.
Prohibit Public S3 Buckets: Implement an account-level S3 Block Public Access configuration to prevent any S3 bucket from being made public.

Enable VPC Flow Logs: For any VPC created or referenced, ensure that VPC Flow Logs are enabled and configured to publish logs to CloudWatch Logs for comprehensive traffic monitoring.

Decouple IAM Policies: Design IAM policies to be separate from IAM users. Policies should be attached to roles, and users should assume roles, ensuring maximum separation between permissions and identities.

Mandatory EBS Encryption: Enforce encryption by default for all new EBS volumes and Snapshots by enabling the account-level EBS encryption setting. Use a customer-managed AWS KMS key for this purpose.

Centralized CloudTrail Logging: Configure an organization-wide AWS CloudTrail trail that logs all management events and data events. Ensure these logs are securely stored and integrated with CloudWatch Logs for real-time monitoring and alerting.
Restrict Volume Creation via Encrypted AMIs: Implement a Service Control Policy (SCP) or an IAM policy that denies the ec2:RunInstances action if the specified AMI is not encrypted.

Enforce CloudFront Encryption: All CloudFront distributions must be configured with a Viewer Protocol Policy of redirect-to-https or https-only and have a default SSL/TLS certificate attached as much as needed
Secure RDS Deployments: Ensure that any RDS Database Instances are deployed within a VPC, are not publicly accessible (PubliclyAccessible: false), and have encryption at rest enabled.

Eliminate Direct SSH Access: Configure EC2 instances to be inaccessible directly via SSH (Port 22). Instead, set up the necessary IAM roles and policies to allow access exclusively through AWS Systems Manager (SSM) Session Manager.

Web Application Firewall (WAF): Integrate AWS WAF with any Application Load Balancer (ALB) or API Gateway to protect against common web exploits like SQL injection and cross-site scripting.Strict Security Group Rules: Define security group ingress rules to be highly restrictive, allowing access only from specific, parameterized IP address ranges. Avoid using 0.0.0.0/0 for any port unless absolutely necessary for a public-facing service.

Enable ALB Session Stickiness: For any Application Load Balancer target group, enable session stickiness (affinity) to ensure that requests from a user are consistently sent to the same target.
Centralized Secret Management: Utilize AWS Secrets Manager to create and manage secrets (e.g., database credentials, API keys). Implement a secret rotation policy for all managed secrets.

Expected Output:
A single, well-commented, and valid YAML CloudFormation template. The template must be structured logically and be ready for deployment. The resulting infrastructure, when deployed, should pass all AWS Config Rules and security checks related to the 15 requirements specified above without generating policy violations.