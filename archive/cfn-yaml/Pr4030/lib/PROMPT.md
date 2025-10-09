Create a CloudFormation YAML template that can be deployed in a single AWS region and reused across multiple regions by changing the deployment region. The template must include:

S3 bucket in the current region with versioning enabled and encryption using AWS-managad KMS keys.

Take as input the ARNs of other S3 buckets in different regions for cross-region replication.

Create an IAM replication role with least-privilege policies to allow replication.

VPC with non-overlapping CIDR (parameterised or mapped per region), multi-az public and private subnets, NAT gateways, and route tables.

EC2 Auto Scaling Group using the latest Ubuntu 20.04 LTS AMI (via SSM Parameter Store), with detailed monitoring enabled, CPU-based scaling policies, and minimal IAM instance profile.

Security Groups that deny all traffic by default and open only necessary inbound/outbound ports.

RDS instance with encryption, automated backups (≥7 days retention), and credentials stored in AWS Secrets Manager with rotation enabled.

AWS Lambda functions for dynamic web application requests.

AWS Config rules for enforce tagging compliance.

AWS WAF for web application protection.

Route 53 DNS with health checks for failover.

ACM certificates for HTTPS on all application layers.

CloudTrail enabled for auditing and CloudWatch Logs for centralized logging.

IAM roles and policies strictly following least privilege for all resources.

CloudFormation Outputs for all important resources (bucket names, VPC IDs, ASG names, RDS instances, IAM roles, KMS keys, etc.).