# Model Failures

Below are the failures identified from the model-generated CloudFormation template:

1. **Inconsistent Availability Zones**  
   - Hardcoded AZs instead of using dynamic selection with `!Select` and `!GetAZs`.

2. **Inconsistent Parameter Defaults and Types**  
   - Weak default for `DBPassword` (e.g., `changeme123`).

3. **Security Group Egress Rules**  
   - Uses unsupported `DestinationSecurityGroupId` for egress; should use `CidrIp`.

4. **Redundant or Unnecessary Tags**  
   - Tags are repeated on nearly every resource; consider stack-level tags or macros.

5. **Missing Public IP Mapping for Private Subnets**  
   - `MapPublicIpOnLaunch` not explicitly set to `false` for private subnets.

6. **No Explicit Deletion Policies**  
   - Critical resources like RDS and EIP lack `DeletionPolicy` attributes.

7. **No S3 Bucket or IAM Role for Application**  
   - Missing S3 bucket and IAM roles, which are often required.

8. **No HTTPS Listener on ALB**  
   - Only HTTP listener defined; HTTPS with ACM certificate is recommended.

9. **No Bastion Host or SSH Access**  
   - No secure administrative access (e.g., Bastion host) to private subnets.

10. **No CloudWatch Logs or Monitoring**  
    - Lacks CloudWatch log groups or alarms for monitoring.

11. **No Output for Database Name**  
    - Output section does not include the database name.

12. **No Multi-AZ or High Availability for RDS**  
    - RDS instance is set to `MultiAZ: false`.

13. **No Explicit Resource Dependencies**  
    - Some resources (e.g., NAT Gateways, EIPs) lack `DependsOn`.

14. **No Use of Secrets Manager for DB Password**  
    - DB password is stored as a plain parameter, not in AWS Secrets Manager.

15. **No WAF or Security Hardening**  
    - No AWS WAF or additional security for ALB or EC2 instances.

16. **No Application Code Deployment**  
    - EC2 user data only installs Apache and a static HTML page.

17. **No Auto Scaling Policies**  
    - Auto Scaling Group lacks scaling policies.

18. **No Private DNS or Route53 Hosted Zone**  
    - No Route53 hosted zone for DNS.

19. **No SSM Parameter Store Integration**  
    - No use of SSM Parameter Store for configuration management.

20. **No VPC Flow Logs**  
    - VPC Flow Logs not enabled for