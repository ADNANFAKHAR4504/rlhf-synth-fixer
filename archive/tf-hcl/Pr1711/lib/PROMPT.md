I need to create secure AWS infrastructure with security groups that meet specific traffic control requirements. The infrastructure should block all traffic from 0.0.0.0/0 while allowing controlled access for HTTP and SSH from specific CIDR blocks.

Requirements:
- Block all ingress traffic from 0.0.0.0/0 (completely prohibit any traffic from this CIDR)
- Allow HTTP access (port 80) only from 192.168.1.0/24 CIDR block
- Allow SSH access (port 22) exclusively from 203.0.113.0/24 CIDR block
- Use Security Group VPC Associations feature (new AWS feature from 2024) to enable cross-VPC security group usage if applicable
- Implement VPC Block Public Access feature to prevent accidental public exposure of resources

The solution should include:
- VPC with appropriate subnets
- Security groups with the specified ingress rules
- EC2 instance or similar resource to demonstrate the security group application
- All egress traffic should be properly configured

Please provide the complete infrastructure code using Terraform HCL syntax. Each file should be in a separate code block with the filename clearly indicated.