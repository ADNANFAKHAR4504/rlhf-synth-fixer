# Environment Migration - On-Premises to AWS Cloud Migration

## Task Requirements

Design a comprehensive CDK TypeScript infrastructure migration plan to migrate an existing on-premises application to the AWS cloud in the us-east-1 region. The migration should adhere to the following requirements:

### **Core Infrastructure Requirements**

1. **VPC Configuration**: Create a new VPC with the CIDR block 10.0.0.0/16

2. **Multi-AZ Subnet Setup**: Deploy multiple subnets across at least two availability zones, ensuring the presence of both public and private subnets in each zone

3. **NAT Gateway**: Implement a NAT gateway in one of the public subnets to facilitate outbound internet traffic from private subnets

4. **Security Groups**: Configure security groups to permit HTTP and HTTPS traffic to a newly launched EC2 instance

5. **EC2 Instance**: Ensure the EC2 instance runs the latest Amazon Linux 2 AMI

6. **RDS Database**: Set up a new RDS instance in a private subnet, and enable automated backups

7. **IAM Roles**: Assign IAM roles to the EC2 instance allowing full access to S3 services

8. **S3 Storage**: Configure S3 buckets for the application's log storage with public access blocked

9. **AWS Systems Manager Session Manager**: Configure Session Manager for secure shell access to EC2 instances without SSH keys or bastion hosts during migration activities

10. **AWS CloudWatch Application Insights**: Set up Application Insights for enhanced monitoring and automated problem detection of the migrated application components

### **Deployment Constraints**

- Use AWS CDK with TypeScript
- Deploy in the us-east-1 region
- Multi-availability zone deployment for high availability
- Private subnets for database and sensitive resources
- Public subnets for internet-facing resources
- Security groups following least privilege principles
- Automated RDS backups for data protection
- S3 buckets with blocked public access for security

### **Expected Environment**

The target environment involves migrating infrastructure to AWS using CDK TypeScript, focusing on the us-east-1 region, while creating a secure and scalable network architecture using best practices. The solution should include modern AWS services for secure access management and comprehensive application monitoring during the migration process.

### **Technical Context**

This problem involves complex infrastructure planning requiring knowledge of AWS infrastructure design and security configurations. The task demands attention to constraints for security, scalability, and availability in a migration scenario from on-premises to cloud. The solution should leverage recent AWS features like Systems Manager Session Manager for secure access and CloudWatch Application Insights for intelligent application monitoring.

### **Validation Requirements**

Create a CDK TypeScript implementation that defines this entire setup:
- All resources correctly configured for migration scenario
- Template passes CDK synthesis validation
- Secure network architecture with proper isolation
- High availability across multiple AZs
- Appropriate resource sizing for migration workloads
- Systems Manager Session Manager configured for secure EC2 access
- CloudWatch Application Insights setup for application monitoring
- Compliance with AWS Well-Architected Framework principles

Please provide infrastructure code in CDK TypeScript format. One code block per file.