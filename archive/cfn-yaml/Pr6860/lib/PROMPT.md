Create an AWS CloudFormation template in YAML that will sets up a secure and compliant e-commerce cloud environment. The templte must include the following:

Encyrption & Security:

Use AWS KMS for encrypting all storage and data transmission (EBS, S3, RDS, etc.).

Enforce HTTPS-SSL for web traffic.

Ensure S3 buckets have encryption, versioning, and restrictive bucket policies.

Enable AWS WAF to protect web applications from common attacks.

Auditing & Compliance:

Enable AWS CloudTrail to log all API requests.

Enable AWS Config to track configuration changes.

Ensure CloudWatch monitoring and logging are enabled for all major components (EC2, Lambda, ELB, RDS).

Network Design:

Create a VPC with both public and private subnets across availablity zones.

Use NAT Gateways to allow outbound internet access from private subnets.

Include Security Groups with least privilege rules — only necessary inbound/outbound traffic allowed.

Identity & Access:

Define IAM roles and policies following the principle of least privilege.

Enforce MFA for IAM users.

Use SSM Parameter Store for sensitive configuration data.

Compute & Scaling:

Launch EC2 instances using a specific AMI ID.

Configure Auto Scaling Groups for EC2 instances to handle variable workloads.

Use an Application Load Balancer (ALB) with access logging enabled and integrated with AWS WAF.

Data & Application Layer:

Deploy RDS (PostgreSQL) instances in private subnets (not publicy accesible).

Include AWS Lambda functions with logging enabled.

Tagging:

Tag all resources with environment, owner, and purpose.

The final YAML file must be valid CloudFormation syntax and pass AWS validation with no errors.
Make sure that there is only a single file and everything is in that file