Hey team,

We need to automate our infrastructure deployment using Terraform for a new production environment. The goal is to get everything set up in AWS us-west-1 with proper security controls and high availability.

So what are we building:

EC2 Instance
- Launch an EC2 instance using AMI ID ami-12345678
- Attach an IAM role with minimal permissions (least privilege)
- Put it in a private subnet with tight security group rules
- Don't enable deletion protection

S3 Buckets
- Create S3 buckets with SSE-KMS encryption using AWS-managed keys (aws/s3)
- Block all public access on the buckets

RDS Instance
- Deploy RDS in a secure VPC setup
- VPC needs 2 public subnets (for ALB and NAT gateways) and 2 private subnets (for EC2 and RDS)
- Put NAT gateways in the public subnets so private resources can reach the internet
- RDS goes in private subnets with proper security groups, no deletion protection

VPC and Networking
- Set up a VPC with 10.0.0.0/16 CIDR or similar
- Configure internet gateway, route tables, and NAT gateways correctly
- Tag everything with our standard tags: Environment = "Production" and Team = "DevOps"

CloudWatch Monitoring
- Set up alarms to watch EC2 CPU usage
- Trigger alert when CPU goes over 70%
- Send notifications through SNS

AWS Backup
- Configure backup plans and vaults for RDS and EC2 volumes
- Make sure we have automated backups running

Application Load Balancer and WAF
- Create an ALB in the public subnets
- Attach a WAF WebACL to protect against SQL injection, XSS, and other common attacks

Security Requirements
- Keep security groups locked down to minimum required access
- Use IAM roles and policies with least privilege
- Enable MFA requirement for root account (using aws_iam_account_password_policy)
- Don't enable deletion protection anywhere

Key constraints to remember:
- Everything deploys to us-west-1
- No deletion protection on anything
- Follow least privilege everywhere
- SSE-KMS encryption on all S3 buckets
- VPC spans two availability zones with public and private subnets
- CloudWatch watches CPU and alerts at 70%
- AWS Backup handles our data resilience
- WAF protects the load balancer
- Standard tags on all resources (Environment = "Production", Team = "DevOps")

What we need:
Put together a single Terraform file that covers all this. Make sure it's clean, well-structured code with comments explaining the important parts. Add in all the provider configs, resource definitions, and anything else needed to deploy this from scratch.