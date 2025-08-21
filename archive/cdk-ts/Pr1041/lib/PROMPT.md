# AWS Secure Cloud Infrastructure Deployment

I need to set up a secure cloud environment for infrastructure automation that follows security best practices and organizational policies. The deployment should include all necessary security controls and monitoring capabilities.

## Requirements

Deploy resources in the us-west-2 region with a dedicated VPC using CIDR block 10.0.0.0/16. Use subnet 10.0.1.0/24 for public resources and 10.0.2.0/24 for private resources.

### Core Security Requirements

1. **Identity and Access Management**
   - Create IAM roles and policies following least privilege principle
   - Require Multi-Factor Authentication for all IAM users
   - Use AWS Security Hub for centralized security monitoring

2. **Network Security**
   - Implement VPC with proper subnet isolation (public/private)
   - Configure Security Groups with minimal necessary access
   - Restrict SSH access through Security Groups
   - Deploy AWS WAF with automatic DDoS protection for web applications
   - Use AWS Shield for DDoS protection on critical resources

3. **Compliance and Governance**
   - Set up AWS Config rules to ensure security policy compliance
   - Track all configuration changes with AWS Config
   - Apply consistent tag policies and naming conventions for resource management

4. **Data Protection**
   - Enable encryption for all EBS volumes attached to EC2 instances
   - Ensure RDS databases are deployed in private subnets only
   - Encrypt all data in transit using SSL/TLS

5. **Monitoring and Logging**
   - Enable comprehensive logging with Amazon CloudWatch
   - Set up AWS CloudTrail for API activity tracking
   - Configure monitoring dashboards for security events

6. **Network Firewall**
   - Deploy AWS Network Firewall with threat intelligence integration
   - Configure protection against malware hosting URLs and botnet command control servers

## Latest AWS Security Features to Include

- Use AWS Security Hub Enhanced capabilities for critical security issue identification
- Implement GuardDuty Extended Threat Detection for sophisticated attack correlation
- Configure AWS WAF console with simplified protection packs
- Enable AWS Certificate Manager exportable SSL/TLS certificates for hybrid workloads

## Infrastructure Code Requirements

Generate infrastructure code with clear separation of concerns. Create one code block per file, ensuring each file can be directly copied and pasted. Keep the solution minimal while meeting all security requirements. Avoid resources that take excessive time to deploy.

The solution should be production-ready with proper error handling, follow infrastructure as code best practices, and include appropriate resource tagging.