I need to set up a basic cloud environment in AWS using CDK TypeScript. I want to create a VPC with public and private subnets, deploy EC2 instances, and configure proper networking.

Here are my requirements:

1. Create a VPC with CIDR block 10.0.0.0/16
2. Add one public subnet (10.0.0.0/24) and one private subnet (10.0.1.0/24)
3. Set up an Internet Gateway attached to the VPC
4. Configure Public and Private Route Tables following AWS best practices
5. Deploy a NAT Gateway in the public subnet for outbound Internet access from the private subnet
6. Launch EC2 instances in each subnet with appropriate security configurations
7. Set up network ACLs and security groups with proper security constraints

Additional specifications:
- Target region: us-east-1
- Use t2.micro instance type for cost optimization
- Tag all resources with Environment: Development
- Configure security groups to allow SSH access (port 22) only from 198.51.100.0/24 IP range
- Follow naming convention: resourceTypePurpose
- Include IPv6 support for future scalability where applicable
- Consider using VPC Lattice for service connectivity if multiple services are involved

I want the infrastructure code with one code block per file. Please provide comprehensive CDK TypeScript code that deploys this basic cloud environment meeting all the requirements above.