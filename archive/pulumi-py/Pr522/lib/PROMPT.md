# Pulumi-291182-Medium-Single

Create a Pulumi Python program that sets up an AWS VPC with IPv6 dual-stack networking. Requirements:

1. VPC with both IPv4 and IPv6 CIDR blocks
2. One public subnet and one private subnet, both with IPv6 CIDR blocks
3. EC2 instances in public subnet with static IPv6 addresses
4. NAT gateway with IPv6 support for private subnet internet access
5. Security group allowing SSH access from specific IPv6 range
6. Auto-scaling group for public subnet instances
7. Tag all resources with Environment: Production and Project: IPv6StaticTest

Please provide complete working Pulumi Python code.
