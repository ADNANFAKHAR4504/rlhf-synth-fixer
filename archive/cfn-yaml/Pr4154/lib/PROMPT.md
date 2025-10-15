### Task Description:

You are required to generate a AWS CloudFormation template in YAML format that deploys a secure and compliant cloud infrastructure in the **us-east-1** region. This infrastructure must adhere to the organizational security policies and compliance constraints outlined below.

---

### Requirements:

#### RDS Configuration

- Enable encryption at rest for **all** RDS instances using AWS-managed or customer-managed KMS keys.

#### VPC Setup

- Configure Virtual Private Clouds (VPCs) with CIDR blocks that comply with the organization’s predefined IP addressing standards.
- Activate **VPC Flow Logs** to capture and log all traffic within each VPC.

#### IAM Roles & Access Management

- Create IAM Roles following the **least privilege principle**, restricting access precisely per service and function.
- Enforce **Multi-Factor Authentication (MFA)** for all IAM users.

#### Security Groups

- Define Security Groups that only allow required inbound and outbound traffic, minimizing open ports and CIDR ranges.

#### Lambda Functions

- Enable full **CloudWatch logging and monitoring** for all Lambda functions to capture invocation details and errors.

#### Compliance Enforcement

- Integrate **AWS Config** rules to continuously enforce compliance policies across all AWS resources.

#### Data Backup

- Schedule **daily automated backups** for all data storage resources, such as RDS, EBS volumes, and S3 buckets (where applicable).

#### S3 Bucket Policies

- Prohibit public access to S3 buckets unless explicitly necessary and justified.
- Enforce bucket-level policies and Block Public Access configurations.

#### Monitoring & Alerts

- Setup CloudWatch Alarms monitoring CPU and memory metrics on every EC2 instance, with clear threshold definitions.

#### Load Balancers

- Configure all Elastic Load Balancers (ELBs) or Application Load Balancers (ALBs) with **HTTPS listeners** using valid SSL/TLS certificates.

#### Resource Provisioning & Cost Control

- Implement constraints on maximum resource deployment counts or sizes to control potential cost overruns within the AWS account.

#### DDoS Protection

- Enable **AWS Shield** protections on all web-facing services to safeguard against Distributed Denial of Service (DDoS) attacks.

---

### Additional Instructions:

- Use CloudFormation parameters for customizable inputs (e.g., CIDR notation, instance sizes, alarm thresholds).
- Clearly define all necessary IAM policies and roles inline in the template.
- Include detailed resource definitions for:
  - RDS instances
  - VPCs and subnets
  - Security groups
  - Lambda functions
  - AWS Config rules
  - CloudWatch alarms
  - Backup plans (AWS Backup or native service backups)
  - ELB / ALB configurations with HTTPS
  - AWS Shield integrations

- Include an **Outputs** section with essential information such as VPC IDs, RDS endpoints, and IAM Role ARNs.
- Validate and ensure the YAML template conforms to AWS CloudFormation syntax standards and best practices.
- Reference official AWS documentation for advanced configurations:
  - [CloudFormation User Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)
  - [AWS Security & Compliance Architectures](https://aws.amazon.com/architecture/security-identity-compliance/)

---

### Deliverable:

Return a single, fully executable AWS CloudFormation YAML template that implements all the above requirements. The template must be production-ready, secure by design, and ready for deployment in the us-east-1 region.

---
