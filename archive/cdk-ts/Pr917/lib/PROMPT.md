I need to create AWS infrastructure code using CDK TypeScript for a simple cloud environment with the following requirements:

1. A VPC with CIDR block 10.0.0.0/16
2. Two public subnets and two private subnets across different AZs
3. A NAT Gateway in one public subnet for private subnet internet access
4. An Internet Gateway attached to the VPC
5. A Security Group allowing HTTP (80) and HTTPS (443) inbound traffic
6. CloudWatch monitoring for EC2 instances
7. VPC Flow Logs for traffic monitoring
8. VPC Lattice service network for modern service connectivity
9. All resources tagged as Environment: production
10. Infrastructure should support easy stack deletion

Please provide the infrastructure code in separate files. The target region is us-east-1.