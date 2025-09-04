I need help creating AWS infrastructure code using CDK TypeScript for a secure VPC configuration. 

Create a production-ready VPC setup with the following requirements:

1. VPC with CIDR block 10.0.0.0/16
2. Two public subnets in different Availability Zones  
3. Two private subnets in different Availability Zones
4. Internet Gateway for public subnets
5. NAT Gateway for private subnet internet access
6. Enable VPC Flow Logs for monitoring network traffic
7. All resources tagged with 'Environment: Production'
8. Implement IAM roles with least privilege principles
9. No hardcoded credentials or sensitive information

Please include these latest AWS security features:
- AWS Network Firewall with managed rule groups for threat protection
- VPC Lattice service network for secure service-to-service communication

The infrastructure should follow AWS security best practices and be ready for production deployment.

Please provide the infrastructure code with one code block per file. Make sure each file can be created by copying and pasting the code directly.