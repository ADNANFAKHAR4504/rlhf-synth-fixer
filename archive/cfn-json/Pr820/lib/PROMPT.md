You are tasked with creating a CloudFormation template to set up a secure web application infrastructure on AWS.
The infrastructure should include a VPC, EC2 instances, an RDS database, and a load balancer. The security of user
data is paramount, and the setup must adhere to the security best practices as outlined in the AWS Well-Architected
Framework.

### Problem Statement

Create a comprehensive AWS CloudFormation **YAML** template that deploys a secure web application infrastructure in
the **us-east-1** region for handling sensitive user data. The solution must implement defense-in-depth security
principles and follow AWS Well-Architected Framework security pillar best practices.

### Requirements

1. **Network Architecture:**
   - Create a VPC with public and private subnets spread across **multiple Availability Zones** (minimum 2 AZs)
   - Implement proper network segmentation with public subnets for internet-facing resources and private subnets for
     application and database tiers
   - Configure NAT Gateways for outbound internet access from private subnets
   - Set up Internet Gateway for public subnet connectivity

2. **Compute Resources:**
   - Deploy EC2 instance(s) in the **private subnet** to host the application server
   - Ensure instances have no direct internet access and communicate through NAT Gateway
   - Configure appropriate instance types and AMI selection
   - Implement systems manager access for secure administration without SSH

3. **Database Security:**
   - Deploy RDS instance in the **private subnet** for database functionality
   - Configure **encryption at rest** using AWS KMS with customer-managed keys
   - Enable **encryption in transit** with SSL/TLS connections
   - Implement automated backups with encryption
   - Configure Multi-AZ deployment for high availability
   - Ensure database is not publicly accessible

4. **Load Balancing:**
   - Deploy Application Load Balancer (ALB) in the **public subnet** to handle incoming traffic
   - Configure HTTPS termination with SSL/TLS certificates (ACM)
   - Implement security headers and secure listener configurations
   - Configure health checks and target group settings

5. **Security Groups & Network ACLs:**
   - Create restrictive Security Groups following **least privilege principle**
   - Allow only necessary ports and protocols (HTTPS/443, HTTP/80 for ALB, database port for RDS)
   - Restrict source IPs where possible
   - Implement Network ACLs as additional layer of security
   - Ensure no overly permissive rules (0.0.0.0/0 access where not required)

6. **Data Encryption & Protection:**
   - Ensure **all data flows are encrypted** in transit and at rest
   - Use HTTPS/TLS for web traffic
   - Configure RDS with encryption and SSL enforcement
   - Implement EBS volume encryption for EC2 instances
   - Use AWS KMS for key management

7. **IAM & Access Control:**
   - Create IAM roles with **least privilege access** for EC2 instances
   - Implement proper service roles for RDS, ALB, and other services
   - Use instance profiles for EC2 access to AWS services
   - Avoid hardcoded credentials or overly broad permissions

8. **Monitoring & Logging:**
   - Enable VPC Flow Logs for network monitoring
   - Configure CloudTrail for API logging
   - Set up CloudWatch monitoring for all resources
   - Implement appropriate log retention policies

9. **Additional Security Measures:**
   - Configure AWS Config for compliance monitoring
   - Implement proper tagging strategy for resource management
   - Consider backup and disaster recovery requirements
   - Note: GuardDuty is not included as it's a regional service that may conflict with existing deployments

### Technical Constraints

- **Platform:** AWS CloudFormation
- **Format:** YAML template
- **Region:** us-east-1
- **Security Framework:** AWS Well-Architected Framework Security Pillar
- Must handle sensitive user data securely

### Expected Output

Your solution must be a **single, valid YAML-formatted CloudFormation template** that:

- Successfully deploys the described infrastructure
- Passes validation against AWS Well-Architected Framework security best practices
- Implements defense-in-depth security architecture
- Follows the principle of least privilege throughout
- Encrypts all data in transit and at rest
- Provides secure, scalable, and maintainable infrastructure

The template should be production-ready, include appropriate parameters for flexibility, and contain comprehensive
outputs for key resource identifiers and endpoints. All security configurations must be explicitly defined and
documented within the template.
