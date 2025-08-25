I need to deploy a web application using AWS CDK with Python in the us-west-2 region. The deployment should include EC2 instances behind an Application Load Balancer with auto scaling capabilities.

Here are the requirements:

1. Use EC2 instances with the latest Amazon Linux 2 AMI (need to lookup the AMI ID dynamically)
2. Instance type should be t2.micro and deployed in us-west-2 region
3. Configure Security Groups to allow HTTP (port 80) and SSH (port 22) access only
4. Set up an Application Load Balancer to distribute traffic across instances
5. Implement Auto Scaling Group with minimum 2 instances and maximum 5 instances
6. Create IAM Role and Instance Profile for EC2 instances to access AWS services
7. Output the public DNS name of the ALB for external access
8. Tag all resources with 'Environment:Production' and 'Application:WebApp'
9. Follow AWS security best practices
10. Make sure all resources are properly connected to each other

Also, I'd like to leverage some of the newer AWS features if possible - I heard there are improvements with Application Load Balancer VPC IPAM integration and enhanced security features with ALB. Could you implement those if they make sense for this deployment?

Please provide the infrastructure code that I can deploy directly. I need one code block per file with clear file names.