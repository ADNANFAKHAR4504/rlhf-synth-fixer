I need to deploy a scalable web application on AWS using Infrastructure as Code. Please create CDK JavaScript code for the us-west-2 region with the following requirements:

1. Deploy EC2 instances using Amazon Linux 2023 AMI for us-west-2 region
2. Use t2.micro instance type for cost optimization
3. Create security groups that allow HTTP (port 80) and SSH (port 22) access
4. Set up an Application Load Balancer to distribute traffic across instances
5. Implement Auto Scaling with minimum 2 instances and maximum 5 instances
6. Create an IAM role and instance profile for EC2 instances to access AWS services
7. Output the public DNS name of the load balancer
8. Tag all resources with Environment:Production and Application:WebApp
9. Use IPv6 support for the load balancer configuration where applicable
10. Implement instance refresh capability for rolling updates

The infrastructure should follow AWS best practices for high availability, security, and cost optimization. Please provide the complete CDK JavaScript implementation with proper resource interconnections.