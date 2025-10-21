We are a rapidly growing FinSecure Bank, a leading financial services company undergoing a digital transformation. Our team is responsible for deploying a new, highly secure application infrastructure on AWS to handle sensitive financial data. The project, codenamed "Project Nova," requires full automation using AWS CloudFormation to ensure repeatability, compliance, and resilience. The infrastructure must meet rigorous security standards aligned with financial regulations (e.g., PCI DSS, SOX).

Your primary objective is to design and implement a comprehensive CloudFormation YAML template that automates the deployment of a secure, resilient, and compliant infrastructure in the us-east-1 region. The template should serve as the foundation for the application, enabling easy validation through integration tests and continuous monitoring.

Key Infrastructure Objectives:

Secure Network Foundation:

Deploy a VPC with CIDR 10.0.0.0/16 in us-east-1, and ensure all compute resources (e.g., EC2 instances) operate within this VPC.

Implement auto-scaling for EC2 instances to handle load fluctuations while maintaining cost efficiency.

Remove default VPCs from all AWS regions except us-east-1 to minimize security risks.

Identity and Access Management (IAM):

Create IAM roles with policies adhering to the principle of least privilege for all services.

Enforce multi-factor authentication (MFA) for any direct IAM user access to AWS services.

Data Protection and Storage:

Configure S3 buckets with versioning enabled, encryption at rest using AWS-managed keys (SSE-S3), and block public access by default.

Set up DynamoDB tables with point-in-time recovery for data resilience.

Ensure all Lambda functions use encrypted environment variables.

High Availability and Resilience:

Deploy RDS instances in Multi-AZ configuration for fault tolerance, with enabled logging and daily automated backups.

Use Elastic Load Balancers (ELBs) with HTTPS listeners only to secure inbound traffic.

Implement CloudFront distributions for any static S3 websites, enforcing HTTPS.

Security and Compliance Monitoring:

Configure security groups to allow inbound traffic only from specific IP ranges (e.g., 203.0.113.0/24 for corporate networks).

Enable AWS Config to monitor and record IAM configuration changes.

Set up CloudTrail with encrypted logs delivered to a secure S3 bucket for audit trails.

Operational Excellence:

Ensure all resources use AWS-managed keys for encryption at rest where applicable.

Include log retention policies for RDS and other services as per compliance requirements.

Expected Deliverables:

A Single CloudFormation YAML template named finsecure_infrastructure.yaml that passes AWS CloudFormation validation (aws cloudformation validate-template).
The template must produce stack outputs that expose critical resource identifiers and endpoints.