I need to create a basic AWS VPC setup in the us-west-1 region using CDK Java. Here’s what I need:

1. A VPC with CIDR 10.0.0.0/16
2. Two public subnets in different availability zones
3. An EC2 instance in one of the public subnets with SSH access limited to 203.0.113.0/32
4. An Internet Gateway attached to the VPC
5. Route table settings for public subnets

I want to use some of the newer AWS features if possible. I've heard about CloudFront VPC Origins and EC2 Fleet features, which could help with future scaling. Also, could you use the latest EC2 instance types for better performance and cost savings?

Please provide the complete infrastructure code with the correct security groups, route tables, and resource tags. Make sure the SSH access is properly limited and the EC2 instance can access the internet through the Internet Gateway.

The code should be ready for production with good practices for security and resource management. I need one code block per file so I can easily copy and use them.