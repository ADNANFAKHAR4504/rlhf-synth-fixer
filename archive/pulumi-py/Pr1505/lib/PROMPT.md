Using Pulumi's Python SDK, provision a secure, highly available, and cost-effective AWS environment for a web application with the following specification.  

The environment must:
- Ensure **least privilege IAM roles** and enforce **MFA** for all users.  
- Deploy **VPCs with public and private subnets** across at least two availability zones for high availability.  
- Enable **HTTPS** for all load balancers with a valid SSL certificate.  
- Configure **CloudWatch Logs** for auditing.  
- Ensure all **S3 buckets are private**, with **server-side encryption** and **versioning** enabled.  
- Handle **sensitive data** securely using **AWS Secrets Manager** or **SSM Parameter Store**.  
- Restrict **RDS access** by trusted IPs and configure **automated daily backups**.  
- Implement **AWS Budgets** for cost monitoring.  
- Deploy resources **across multiple AWS Regions** for fault tolerance.  
- Integrate **AWS WAF** with the application load balancer.  
- Use **EC2 metadata** for secure dynamic app configuration.

Complaince and Design:
 - The infrastructure must comply with **corporate IT governance policies**.  
 - **Modular approach required**: all AWS resources must be defined in reusable Python modules under a `components/` directory to ensure maintainability and scalability.