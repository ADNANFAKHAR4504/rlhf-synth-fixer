I need to build a Pulumi program in Java that creates a basic AWS network setup in us-east-1. This should be straightforward - just a VPC with public subnets and internet connectivity.

The requirements are:
- Deploy everything in us-east-1 region
- Create a VPC using 10.0.0.0/16 CIDR block
- Add two public subnets in different availability zones
- Make sure instances in the subnets get public IPs automatically  
- Attach an Internet Gateway to the VPC
- Set up a route table with default route 0.0.0.0/0 pointing to the IGW, and connect both subnets to it
- Output the VPC ID and subnet IDs so I can reference them later

The deliverable should be a Main.java file that works with standard Pulumi commands like pulumi preview and pulumi up. I'll use us-east-1a and us-east-1b for the availability zones and make sure both subnets have mapPublicIpOnLaunch set to true.

This should be a minimal implementation without any unnecessary complexity - just the core networking components needed to get instances online.  
