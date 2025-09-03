# AWS Infrastructure Setup Request

I need help creating AWS CDK JavaScript infrastructure code for a complex cloud environment setup. The infrastructure needs to be deployed in the us-east-1 region and must include the following components:

## Requirements

1. **VPC Setup**: Create a Virtual Private Cloud (VPC) with at least one public subnet and one private subnet. The subnets should be distributed across different availability zones for high availability.

2. **EC2 Instances**: Deploy four EC2 instances total - two in the public subnet and two in the private subnet, with each pair distributed across different availability zones for fault tolerance.

3. **Auto Scaling Configuration**: Set up Auto Scaling groups for the EC2 instances to ensure the specified number of instances is maintained at all times. I want to leverage the latest AWS Auto Scaling features, particularly the highly responsive scaling policies introduced in November 2024 that can automatically adapt to unique usage patterns.

4. **Security Groups**: Configure Security Groups to allow HTTP (port 80) and HTTPS (port 443) traffic to the public EC2 instances from the internet.

5. **Network ACLs**: Implement Network Access Control Lists (ACLs) to provide an additional layer of security specifically for the private subnet, controlling traffic at the subnet level.

6. **CloudWatch Monitoring**: Enable detailed monitoring and logging for all network traffic and instance-level metrics using AWS CloudWatch. I want to take advantage of the enhanced CloudWatch features from 2024, including extended metric evaluation duration and improved responsiveness monitoring.

## Additional Requirements

- Use t3.micro instance types to minimize costs while maintaining good performance
- Implement proper tagging for resource management
- Ensure all resources follow AWS security best practices
- Make the infrastructure scalable and production-ready

Please provide the complete AWS CDK JavaScript code with proper file structure. Each file should be provided in a separate code block with the filename clearly indicated.