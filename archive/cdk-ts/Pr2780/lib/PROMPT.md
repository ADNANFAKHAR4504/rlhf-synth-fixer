Write a single TypeScript file using AWS CDK (v2) file that implements your requested multi-region setup. It creates two stacks (one for us-east-1, one for us-west-2) in one file, each stack:

• Creates a VPC spanning 2 AZs (2 public + 2 private subnets).
• Launches an EC2 instance (with public IP) in each public subnet (so 2 EC2s per region).
• Uses a Security Group that allows SSH (22) and HTTP (80) from anywhere.
• Reads the EC2 AMI ID from SSM Parameter Store (you provide the SSM parameter name per region; defaults point to Amazon Linux 2 public SSM parameter).
• Ensures EC2 instances use a least-privilege IAM role (only ssm:GetParameter/ssm:GetParameters on the AMI parameter).
• Tags everything with Project=MultiRegionWebApp.
• Outputs the public DNS name for each EC2 instance.
