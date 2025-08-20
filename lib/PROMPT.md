I need to create a comprehensive AWS CloudFormation infrastructure template for a production web application that will be deployed across two regions (us-east-1 and us-west-2). 

The infrastructure should include:

1. **Networking**: VPC with CIDR 10.0.0.0/16, including both public and private subnets across multiple availability zones
2. **Load Balancing**: Application Load Balancer with HTTPS support and SSL certificate management
3. **Compute**: Auto Scaling Group using t3.micro instances with a minimum of 2 and maximum of 6 instances
4. **Database**: RDS MySQL database with Multi-AZ deployment for high availability
5. **Monitoring**: CloudWatch alarms for monitoring key infrastructure metrics
6. **Storage**: S3 buckets with AES-256 encryption enabled
7. **Security**: IAM roles following least-privilege access principles
8. **Compliance**: All resources must be tagged with 'environment:production'

The solution needs to leverage AWS CloudFormation's new optimistic stabilization feature for faster deployment times and should be structured to support potential future stack refactoring. Please ensure the template includes proper error handling, follows AWS Well-Architected Framework principles, and can be deployed in both target regions.

Please provide the complete CloudFormation YAML template with one code block per file. Minimize the number of files while ensuring all requirements are met and the solution is production-ready.