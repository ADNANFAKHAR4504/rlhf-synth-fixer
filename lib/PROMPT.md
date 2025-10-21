Please design a secure, scalable cloud environment using Pulumi with Python that fulfills the following real-world requirements, replacing bastion host requirements with AWS Systems Manager (SSM) for secure access:

- Create a VPC spanning two availability zones with properly configured public and private subnets. The public subnet enables external communication, while the private subnet routes outbound traffic through a NAT Gateway in the public subnet.
- Deploy an EC2 instance in the public subnet configured as a secure jump host using AWS SSM instead of traditional bastion host SSH access, with security groups restricting access to authorized IP ranges.
- Configure routing tables attached to the VPC and subnets: the public subnet routes traffic to the Internet Gateway; the private subnet routes outbound traffic through the NAT Gateway.
- Architect the infrastructure to support auto-scaling based on CPU utilization metrics to handle varying workloads.
- Include AWS Lambda functions for automated monitoring of EC2 instance health and implement automatic replacement of unhealthy instances to increase resilience.
- Provide outputs for critical resource information including the VPC ID, subnet IDs, and the public IP of the EC2 instance.
- The Pulumi Python code should be modular, maintainable, and fully automated to pass AWS CloudFormation validation standards and deploy without manual intervention.
- Adhere to AWS best practices in subnet CIDR allocation, security group configuration, and scaling policy design.

Remember, this evaluates our ability to define and deploy robust multi-AZ VPC architectures using Pulumi Python, leveraging AWS native security tools like SSM, networking and Lambda for operational efficiency and resilience.
