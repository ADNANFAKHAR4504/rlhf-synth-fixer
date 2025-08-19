I need to create Terraform infrastructure code for a secure and scalable web application environment in AWS. The infrastructure should be deployed in the us-east-1 region and meet the following requirements:

1. Create a VPC with both public and private subnets spanning two availability zones
2. Deploy an Application Load Balancer that distributes traffic across EC2 instances in the private subnets
3. Set up an Auto Scaling group with a minimum of 2 and maximum of 5 EC2 instances
4. Include a NAT Gateway to provide outbound internet access from the private subnets
5. Configure AWS Systems Manager for EC2 instance management
6. Create IAM roles and policies to grant EC2 instances read-only access to S3 buckets
7. Tag all resources with Environment=Production
8. Set up CloudWatch monitoring with alarms for critical metrics like CPU usage
9. Configure Security Groups to allow HTTP and HTTPS traffic only from the internet
10. Include all necessary network components like Route Tables and Internet Gateway
11. Enable termination protection for all resources
12. Implement logging for all AWS services

Additionally, I want to incorporate these newer AWS features:
- Use CloudWatch Network Flow Monitor for enhanced network performance monitoring
- Configure IPv6 support where applicable for future-ready networking

Please provide the infrastructure code as separate Terraform files with one code block per file. Make sure the code is production-ready and follows Terraform best practices.