You are an expert cloud infrastructure engineer. Create a secure, scalable, and cost-effective web application environment on AWS using a CloudFormation template in YAML format. Deploy everything in the us-east-1 region.

Requirements:

Security & Networking:
- Create a VPC for the environment
- Only allow HTTPS traffic (port 443) to EC2 instances
- RDS instances must not be publicly accessible
- Encrypt all sensitive data in S3 and RDS using KMS
- Use IAM Roles with granular policies for S3 access, following least privilege
- Set up VPC Peering to connect with an existing VPC (CIDR: 10.0.0.0/16)

Scalability & Performance:
- Implement Auto Scaling Group for EC2 instances
- Use CloudFront as CDN with S3 bucket as origin for static content

Monitoring & Management:
- Set up CloudWatch alarms for:
  - EC2 CPU usage
  - RDS burst balance
- Tag all resources with Environment and Owner keys for cost tracking

Output requirements:
- Generate a complete, deployable CloudFormation YAML template
- Include all necessary AWS resources for the above requirements
- Use clear resource names and add comments where helpful
- Provide only the YAML template without additional explanation