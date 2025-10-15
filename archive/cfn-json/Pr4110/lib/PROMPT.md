Create an AWS CloudFormation template in JSON to set up a secure, multi-region environment.

The template should be designed to deploy infrastructure across the us-east-1 and eu-central-1 regions.

Please focus on these core security requirements:

1. Networking:
Make the template flexible: it should accept an optional VpcId parameter. If a VPC ID is not provided, the template should automatically use the default VPC for the region.
Configure secure Security Groups within that VPC. Please add a description to every security group rule.
Ensure critical databases are not publicly accessible.

2. Data Protection:
Enable server-side encryption for all S3 buckets.
Ensure all RDS database instances are encrypted at rest.
Use AWS Parameter Store for managing secrets like database passwords.

3. Access & Hardening:
Define IAM roles that follow the principle of least privilege.
Harden any EC2 instances by disabling password-based logins.

4. Monitoring & Logging:
Set up CloudTrail to log all API activity.
Configure a CloudWatch alarm to send a notification for unauthorized access attempts.

5. Threat Protection:
Implement AWS WAF to protect web applications.
Use AWS Shield for DDoS protection.

Finally, please ensure that:
All resources created have appropriate tags for cost management.
The template follows AWS security best practices.
The output file is a valid JSON that can be deployed successfully.