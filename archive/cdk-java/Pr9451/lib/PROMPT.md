I need to set up a basic AWS cloud environment using CDK Java for my development team. We're looking to deploy a web application infrastructure where EC2 instances serve HTTP traffic through a load balancer with health monitoring.

The setup should work like this:

1. Deploy everything in the us-east-1 region
2. Create a VPC with CIDR block 10.0.0.0/16 that connects to the internet via an internet gateway
3. Set up two public subnets with CIDR blocks 10.0.1.0/24 and 10.0.2.0/24 across different availability zones, each with route tables directing traffic to the internet gateway
4. Deploy one EC2 instance in each public subnet to serve web content
5. Create an Application Load Balancer that distributes HTTP traffic across both EC2 instances on port 80
6. Configure the load balancer with health checks to monitor EC2 instance availability
7. Set up security groups with specific rules: the load balancer security group permits inbound HTTP on port 80 from 0.0.0.0/0, and the EC2 security group permits inbound traffic on port 80 only from the load balancer security group
8. Configure CloudWatch alarms to alert when any EC2 instance becomes unhealthy or the load balancer error rate exceeds 5%
9. Use proper CDK Java constructs with resource references to establish these connections
10. Tag all resources with Environment=Production

The key integration points are:
- Internet Gateway must be attached to the VPC and referenced in subnet route tables
- Security groups enforce traffic flow: Internet on port 80 goes to Load Balancer, then to EC2 instances on port 80 only from LB
- Load balancer target group must include both EC2 instances with health checks
- CloudWatch alarms must monitor load balancer and target health metrics

I want to make sure the EC2 instances can only be accessed through the load balancer, not directly from the internet. Also, the setup should be production-ready with proper monitoring.

Could you help me generate the CDK Java infrastructure code? Please provide the complete code with one file per code block so I can easily copy and implement each part.
