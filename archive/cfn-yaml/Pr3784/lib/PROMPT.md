Prompt for the task
```
The goal of this project is to develop the Infrastructure as Code (IaC) for a new, secure production environment on AWS. Your task is to create a single, comprehensive CloudFormation template in YAML that provisions this infrastructure.

The environment will be primarily hosted in the us-west-2 (Oregon) region, with a design that facilitates failover to us-east-1 (N. Virginia). The entire architecture must be built on a foundation of security, compliance, and operational excellence, with a strong focus on centralized logging, proactive monitoring, and clear cost allocation.

Technical Specifications

The CloudFormation template must implement the following features and configurations:

IAM Roles & Least Privilege: Provision all necessary IAM roles following the principle of least privilege.
s
Roles for logging services must only have the minimum required permissions to write logs to their designated destinations (e.g., S3, CloudWatch Logs).

Resource Tagging: All resources must be consistently tagged with cost-center and project-id for accurate cost allocation and tracking.

Compliance Auditing with AWS Config: Implement AWS Config with rules to automatically audit IAM roles for compliance.

Include rules that specifically check for overly permissive policies, such as those with full administrative access (iam-policy-no-statements-with-full-access).

Centralized Account Auditing: Set up AWS CloudTrail to capture all API activity across the account.

The trail must be configured as a multi-region trail and must securely forward all logs to the central logging S3 bucket in our dedicated logging account.

VPC Network Monitoring: Enable VPC Flow Logs to capture IP traffic information for network auditing and security analysis.

Strict Security Groups: Define security groups with a default-deny policy. Inbound traffic from 0.0.0.0/0 should be blocked on all ports, except for ports 80 and 443 on resources specifically designated as web servers.

IAM Threat Detection: Configure Amazon CloudWatch alarms to provide immediate notifications for suspicious IAM activity.

These alarms should monitor for high-risk events like root account logins, unauthorized API calls, or critical IAM policy changes.

Data Encryption: Enforce encryption for all EBS volumes to protect data at rest.

Managed Database Configuration: Deploy all RDS instances within the VPC and configure automated backups.

Ensure backups have a minimum retention period of at least 7 days.

A proper DB Subnet Group must be defined and used for all RDS deployments.

High Availability and Failover: Architect the primary resources for deployment in us-west-2, but structure the template to support a failover deployment in us-east-1.

Acknowledge that a single template won't handle dynamic routing, but it should contain the necessary parameters and conditions to provision the stack in either region.

Application Layer Protection: Activate AWS Shield for DDoS mitigation and integrate AWS WAF to filter malicious traffic like SQL injection and XSS attacks.

S3 Bucket Security: Ensure all S3 buckets are created private by default. Access should be tightly controlled exclusively through specific bucket policies.

Centralized Logging Hub: Consolidate all logs (CloudTrail, VPC Flow Logs, etc.) into a single, dedicated S3 bucket located in our separate logging account.

This bucket must have a strict policy allowing write access only from the necessary AWS services and read access only for authorized security personnel. Enable versioning and a lifecycle policy.

Scalable Architecture: The overall design must be scalable, capable of securely handling traffic spikes and high loads without manual intervention.

Implementation Guidelines

Parameterize the Template: Use CloudFormation parameters for customizable values like CostCenterTag, ProjectIDTag, LoggingAccountId, and VPC CIDR blocks to make the template reusable.

Code Clarity: Please add comments to the YAML file to explain complex logic, security-critical configurations, or any non-obvious resource properties.

Validation: Before finalizing, ensure the template is syntactically correct and successfully passes the aws cloudformation validate-template check.

Deliverables

A single, complete, and well-structured CloudFormation YAML file that meets all the specifications outlined above.
```