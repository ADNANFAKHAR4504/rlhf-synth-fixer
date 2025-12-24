Build me a secure AWS infrastructure using CloudFormation YAML that connects services with proper security controls.

I need an internet-facing ALB that receives HTTP and HTTPS traffic from the internet and routes it to an Auto Scaling group of web servers running in private subnets. The ALB security group allows only ports 80 and 443 from 0.0.0.0/0, and the web server security group accepts traffic only from the ALB security group.

The web servers connect to an encrypted RDS MySQL database through a database security group that allows port 3306 only from the web server security group. The RDS instance uses a KMS key for encryption at rest and stores credentials in Secrets Manager. Automated backups are enabled with 7-day retention.

Create an S3 bucket for static content with AES256 encryption and public access blocked. An IAM role attached to the EC2 instances grants read-only access to this specific S3 bucket using s3:GetObject and s3:ListBucket actions on the bucket ARN only.

The EC2 instances stream logs to CloudWatch Logs groups using the CloudWatch agent configured in the launch template user data. AWS Config monitors all resources and reports compliance violations for S3 public access, RDS encryption, and IAM password policies.

SSH access to EC2 instances is restricted to a specific CIDR block defined as a parameter. All IAM users must have MFA enabled, enforced through an IAM policy that denies actions when aws:MultiFactorAuthPresent is false.

The VPC has public subnets for the ALB and private subnets for the web servers and RDS. Route tables connect public subnets to an Internet Gateway and private subnets have outbound internet access.

Output a valid CloudFormation YAML template using only native CloudFormation resource types.
