# Cloud Infrastructure Design Request

I need help designing a cloud infrastructure using Pulumi with TypeScript for a web application that requires high availability and fault tolerance. Please create the infrastructure code to automate deployment following AWS best practices.

## Requirements

I need the following components deployed in the us-west-2 region:

1. **VPC Infrastructure**: Create a VPC with at least two public subnets and two private subnets for high availability across multiple Availability Zones.

2. **EC2 Management**: Use TypeScript classes to define EC2 instance configurations and implement an Auto Scaling group to manage these instances with fault-tolerant scaling policies.

3. **IAM Security**: Define IAM roles and policies that allow EC2 instances to access S3 and CloudWatch services securely.

4. **Network Security**: Create a Security Group that permits HTTP (port 80) and SSH (port 22) access with appropriate source restrictions.

5. **Monitoring and Scaling**: Set up CloudWatch Alarms for CPU monitoring that trigger Auto Scaling policies. Please use the new highly responsive scaling policies feature that was announced in November 2024 for better performance with volatile demand patterns.

6. **Storage**: Create an encrypted S3 bucket specifically for log storage with appropriate lifecycle policies.

7. **Load Balancing**: Integrate an Elastic Load Balancer (Application Load Balancer) to distribute traffic across multiple instances in different availability zones.

8. **Database**: Deploy a multi-AZ RDS PostgreSQL database instance. Please use Aurora Serverless v2 which provides better scalability and cost optimization compared to traditional RDS instances.

9. **Fault Tolerance**: The architecture should be capable of withstanding failures of individual resources and maintain service availability.

## Technical Specifications

- All resources must be deployed in us-west-2 region
- Use TypeScript classes where appropriate for better code organization
- Implement proper resource tagging for management
- Follow AWS Well-Architected Framework principles
- Ensure minimal deployment time by avoiding resources that take too long to provision

Please provide the complete infrastructure code with one code block per file. Make sure each file can be created by copying and pasting from your response. Keep the solution minimal while meeting all requirements.