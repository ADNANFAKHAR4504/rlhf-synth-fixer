I need to create a basic AWS VPC infrastructure in us-west-2 region using CDK Java. Here's what I need:

1. A VPC with CIDR 10.0.0.0/16
2. Two public subnets in different availability zones
3. An EC2 instance in one of the public subnets with SSH access restricted to 203.0.113.0/32
4. Internet Gateway attached to the VPC
5. Route table configuration for public subnets

I want to use some of the newer AWS features if possible. I've heard about CloudFront VPC Origins and EC2 Fleet capabilities that could be beneficial for future scaling. Also, could you leverage the latest EC2 instance types that support better performance and cost optimization?

Please provide the complete infrastructure code with proper security groups, route tables, and resource tagging. Make sure the SSH access is properly restricted and the EC2 instance can reach the internet through the Internet Gateway.

The code should be production-ready with good practices for security and resource management. I need one code block per file so I can easily copy and use them.