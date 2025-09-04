Create a cloud environment setup using AWS CDK Java for a secure VPC infrastructure in the us-west-2 region with advanced networking capabilities.

Requirements:
- VPC with CIDR block 10.0.0.0/16
- Two public subnets in different availability zones (us-west-2a and us-west-2b)
- Internet Gateway attached to the VPC
- Route table configuration for both public subnets with routes to the Internet Gateway
- EC2 instance deployed in the first public subnet with SSH access restricted to a specific IP address (203.0.113.1/32)
- Security group allowing SSH (port 22) only from the specified IP address
- Use the latest Graviton4-powered EC2 instance type (m8g.medium) for cost optimization and performance
- CloudFront distribution with VPC origins pointing to the EC2 instance for enhanced security

Advanced Networking Requirements:
- Amazon VPC Lattice service network for microservices communication
- VPC Lattice service definition with target group pointing to the EC2 instance
- VPC Lattice service association with the VPC
- Service-to-service authentication and authorization policies for VPC Lattice
- AWS Network Manager Cloud WAN core network for multi-region connectivity
- Cloud WAN network segments for different traffic types (production and development)
- Intent-based networking policies for traffic routing and security
- Cloud WAN attachment to connect the VPC to the global network

Infrastructure Management:
- Proper resource tagging for environment management
- Output the VPC ID, subnet IDs, EC2 instance ID, VPC Lattice service network ARN, and Cloud WAN core network ARN

Please provide the complete infrastructure code with one code block per file that can be directly deployed.