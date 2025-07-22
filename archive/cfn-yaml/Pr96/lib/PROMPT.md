Create a comprehensive AWS CloudFormation YAML template to deploy a secure, highly available web application infrastructure. Your template must meet the following requirements:

1. **Networking:**
   - Provision a VPC spanning two Availability Zones.
   - Create both public and private subnets in each AZ, with appropriate routing for internet access and isolation.

2. **Compute & Load Balancing:**
   - Deploy EC2 instances in an Auto Scaling Group across the private subnets.
   - Place the instances behind an Application Load Balancer (ALB) with SSL/TLS (HTTPS) termination using an ACM certificate.

3. **Database:**
   - Launch a MySQL Amazon RDS instance in Multi-AZ mode for high availability.
   - Ensure the database is not publicly accessible and is deployed in private subnets.

4. **Security:**
   - Define IAM roles and policies to grant least-privilege access between resources (EC2, RDS, CloudWatch, etc.).
   - Use security groups and NACLs to restrict network access appropriately.

5. **Monitoring & Logging:**
   - Enable CloudWatch monitoring and logging for all major components (EC2, ALB, RDS).
   - Include alarms for CPU, memory, and database health.

6. **Backup & Recovery:**
   - Implement automated RDS backups and snapshot retention.
   - Ensure the solution supports restoring the application within 4 hours (RTO < 4h) after a failure.

7. **Outputs:**
   - Output the ALB DNS name (application URL) and RDS endpoint.

The template should be production-ready, parameterized for reusability, and follow AWS best practices for security, availability, and cost optimization. The output must be a single, valid CloudFormation YAML file that fully provisions and configures all required AWS resources.