You are an expert AWS CDK TypeScript engineer. create a production AWS CDK v2 stack (TypeScript) that implements the following requirements in region us-east-1:

- Create a VPC with CIDR 10.0.0.0/16 with public and private subnets across at least two AZs.
- Launch a t2.micro EC2 instance in a public subnet with a key pair and a public IP.
- Create a Security Group that allows inbound HTTP (80) and SSH (22), and allows all outbound traffic.
- Ensure EC2's security group and subnet settings permit HTTP/SSH from the internet to the instance.
- Tag all resources for environment identification (e.g., Environment=dev).
- Output the EC2 public IP and the VPC ID as stack Outputs.
