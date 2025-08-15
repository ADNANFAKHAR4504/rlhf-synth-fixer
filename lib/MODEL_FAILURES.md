
---

## Model Failures

1. **Region Misconfiguration**  
   Resources are not provisioned in `us-west-2` as required.

2. **VPC CIDR Block Incorrect**  
   VPC is not created with the CIDR block `10.0.0.0/16`.

3. **EC2 Instance Type Mismatch**  
   EC2 instances are not of type `t3.micro`.

4. **IAM Role Policy Attachments**  
   IAM roles do not have policy attachments defined in CDKTF code, or are attached manually outside the code.

5. **CloudWatch Monitoring Disabled**  
   EC2 instances do not have detailed CloudWatch monitoring enabled.

6. **S3 Encryption Not Enforced**  
   S3 buckets do not enforce AES-256 encryption.

7. **Insufficient EC2 Instances**  
   Auto Scaling Group provisions fewer than 3 EC2 instances.

8. **Network ACLs Too Permissive**  
   Network ACLs allow ports other than 443 and 22.

9. **Multi-AZ RDS Not Configured**  
   RDS instance is not set up for Multi-AZ deployment.

10. **User Data Logging Missing**  
    EC2 user data scripts do not log actions to CloudWatch.

11. **DynamoDB Auto-Scaling Not Enabled**  
    DynamoDB tables do not have auto-scaling enabled for both read and write capacity units.

12. **Elastic Load Balancer Missing**  
    No Elastic Load Balancer is provisioned in front of the Auto Scaling Group.

13. **Resource Placement Outside Production Account**  
    Resources are provisioned in accounts other than the dedicated production AWS account.

14. **Missing Security Best Practices**  
    Resources lack production tags, proper access controls, or other security best practices.

15. **Code Organization Issues**  
    Constructs and stacks are not organized for reusability or maintainability.

---