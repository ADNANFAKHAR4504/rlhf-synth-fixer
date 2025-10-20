### Model Failures

1. **Incomplete Implementation**  
   Several modules are truncated or missing (`logging_monitoring`, teardown logic, full VPC Flow Log role setup), preventing deployment completion.

2. **Undefined / Invalid References**  
   Calls like `ec2.create_flow_log_role()` and `pulumi.aws.ssm.Parameter` are undefined, causing runtime errors.

3. **Missing Recovery and Backup Mechanisms**  
   The recovery module lacks actual RDS snapshot creation, S3 lifecycle rules, or automated restoration workflows — violating the “failure recovery” requirement.

4. **IAM Policies Too Broad**  
   Multiple roles use `"Resource": "*"` instead of specific ARNs, failing the least-privilege security requirement.

5. **No Automated Validation or Rollback**  
   The solution omits Pulumi-based pre-deployment validation or rollback mechanisms required for resilient infrastructure changes.

6. **Flow Logs and NACLs Not Implemented**  
   VPC Flow Logs and Network ACLs are referenced but not created, leaving key audit and traffic isolation gaps.

7. **Tagging and Naming Inconsistency**  
   Tags are applied inconsistently across resources, breaking the requirement for a uniform tagging scheme for cost and ops tracking.

8. **Secrets Handling Incomplete**  
   Secrets are generated locally but not stored securely using Pulumi secrets, AWS Secrets Manager, or SSM `SecureString`.

9. **Region and Provider Scope Issues**  
   Region configurability exists but is not consistently applied to resources via providers, reducing multi-region reliability.

10. **No Real Testing or Validation for High Availability**  
    There are no Pulumi tests or checks verifying multi-AZ failover, NAT redundancy, or ASG self-recovery behavior.
