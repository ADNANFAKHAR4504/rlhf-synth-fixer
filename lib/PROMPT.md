Act as an AWS Solution Architect and write a complete AWS CDK project in Python to deploy a scalable web application in the us-west-2 region, following AWS best practices and company naming conventions (<project>-<environment>.<resource>). The infrastructure must meet these requirements:

1. VPC & Networking
   - Create a VPC
   - Configure both public and private subnets according to security policies
   - Apply proper security groups for the ELB, EC2 instances, and RDS to allow only necessary traffic

2. Application Layer
   - Deploy EC2 instances in an Auto Scaling Group (ASG) to run the web application
   - Attach the ASG to an Application Load Balancer (ALB) configured with an HTTP listener

3. Database Layer
   - Deploy Amazon RDS for the database layer (MySQL or PostgreSQL)
   - Ensure the RDS instance is in private subnets, with encryption enabled
   - Store DB credentials in AWS Secrets Manager

4. Scaling & Resilience
   - Configure Auto Scaling policies based on CPU utilization
   - Apply environment-specific tags and resource names using <project>-<environment>.<resource> format

Output Requirements: give AWS CDK Python code in app.py file