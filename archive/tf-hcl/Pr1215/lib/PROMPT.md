I need to create a secure AWS cloud infrastructure using Terraform for a new web application. The environment should be production-ready and follow security best practices.

Requirements:
- Deploy all resources in the us-west-2 region
- Tag all resources with 'Environment=Production' for cost tracking
- Create a VPC with public and private subnets across multiple AZs
- Set up internet gateway and NAT gateways for proper connectivity
- Configure security groups allowing HTTP/HTTPS traffic to web servers
- Allow SSH access only from trusted IP ranges (use 10.0.0.0/8 as example)
- Implement proper routing between public and private subnets

I'd like to incorporate some of the latest AWS security features if possible, such as CloudFront VPC Origins for enhanced security or VPC Lattice for service networking. Also consider using AWS Network Firewall for additional protection.

The infrastructure should be scalable and ready to host web applications with database backends in private subnets.

Please provide the complete Terraform configuration with proper file organization.