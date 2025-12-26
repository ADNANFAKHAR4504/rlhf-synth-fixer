I need to set up a basic AWS cloud environment using CDK Java for my development team. We're looking to deploy a simple web application infrastructure that meets these requirements:

1. Deploy everything in the us-east-1 region
2. Create a VPC with CIDR block 10.0.0.0/16
3. Set up two public subnets with CIDR blocks 10.0.1.0/24 and 10.0.2.0/24
4. Add an internet gateway to the VPC 
5. Deploy one EC2 instance in each public subnet
6. Create a security group allowing inbound HTTP traffic on port 80 for the EC2 instances
7. Use proper CDK Java constructs and resource references
8. Tag all resources with Environment=Production

I'd like to use some of the newer AWS VPC features where possible, like VPC Route Server enhancements for better monitoring, and ensure the EC2 instances can handle jumbo frames for improved performance. Also, I want to make sure the setup is minimal but production-ready.

Could you help me generate the CDK Java infrastructure code? Please provide the complete code with one file per code block so I can easily copy and implement each part.