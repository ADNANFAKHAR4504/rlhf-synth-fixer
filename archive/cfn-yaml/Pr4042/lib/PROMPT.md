Currently I am tasked with designing a secure, production-grade AWS infrastructure for a financial services application that handles sensitive customer data. The infrastructure must comply with financial industry regulations and implement defense-in-depth security controls.

Your solution must address these 15 real-world operational and security requirements:

Unified Deployment Model: All infrastructure components must be deployable through a single, version-controlled CloudFormation stack with clear dependency relationships - for example, the VPC must be established before subnets can be created, and subnets must exist before launching EC2 instances.

EC2 Credential Management: Application instances must securely access AWS services using IAM instance profiles that assume roles with minimal permissions. These roles must be attached to EC2 instances at launch time.

Data Integrity Protection: All object storage must maintain version history, with S3 buckets configured to preserve multiple versions of objects, enabling point-in-time recovery.

Storage Encryption Compliance: EBS volumes attached to EC2 instances and RDS storage must be encrypted using AWS-managed KMS keys, with encryption relationships explicitly defined.

Database High Availability: RDS instances must deploy in Multi-AZ mode with synchronous replication between primary and standby instances in different availability zones.

Network Segmentation: Security groups must implement layered controls - bastion hosts can access application instances, application instances can access RDS, but no direct internet access for private resources.

Administrative Access Control: Bastion host in public subnet acts as controlled gateway, with security groups permitting SSH access only from bastion to application instances in private subnets.

Activity Monitoring: CloudTrail must be configured to monitor API activity across all regions, with logs stored in the centralized S3 bucket.

Function Privilege Management: Lambda functions must assume execution roles that grant permissions only to specific services they interact with, such as reading from S3 or writing to CloudWatch Logs.

Secret Management: RDS credentials stored in AWS Systems Manager Parameter Store must be retrieved by CloudFormation during stack creation and passed to the RDS instance.

Storage Access Controls: S3 buckets must have block public access enabled and must forward access logs to a dedicated logging bucket, creating a logging chain relationship.

Network Exposure Reduction: Application EC2 instances in private subnets rely on NAT Gateway in public subnet for outbound internet access, while bastion host maintains direct internet connectivity.

Network Traffic Visibility: VPC Flow Logs must capture IP traffic and deliver logs to CloudWatch Logs, with IAM roles enabling this delivery relationship.

Security Posture Management: Security Hub must aggregate findings from various AWS services like CloudTrail, GuardDuty, and Config.

Application Protection: WAF WebACL must be associated with Application Load Balancer, creating a security layer that inspects incoming web traffic before it reaches backend targets.

Infrastructure Component Relationships

Design a foundational network architecture where:

VPC contains public and private subnets across three AZs

Internet Gateway connects VPC to internet, used by public subnets

NAT Gateway in public subnet provides outbound internet for private subnets

Bastion host in public subnet serves as jump box to application instances

Application instances in private subnets connect to RDS in private subnets

ALB in public subnets distributes traffic to application instances in private subnets

S3 buckets store application data with logging enabled

Lambda functions interact with S3 buckets through IAM roles

CloudTrail delivers logs to centralized S3 bucket

WAF protects ALB from web exploits

Key Dependencies to Model:

VPC → Internet Gateway → Public Subnets → NAT Gateway → Private Subnets

Security Groups → EC2 Instances (bastion accesses applications, applications access RDS)

IAM Roles → EC2 Instances & Lambda Functions (assumed at runtime)

Parameter Store → RDS Instance (credentials injected at creation)

S3 Logging Bucket → Application Buckets (log delivery relationship)

WAF WebACL → ALB (protection association)

Security & Compliance Considerations

Implement encryption for data at rest and in transit

Adhere to AWS Well-Architected Framework security and reliability pillars

Design for multi-environment deployment (Development, Production)

Provide necessary endpoint information for operational access

Deliverable
Generate a production-ready CloudFormation template in YAML format that implements this design with clear resource relationships and dependencies. The template must pass CloudFormation validation and include appropriate documentation for security-critical configurations and component interactions.

File Name: enterprise-infrastructure.yaml