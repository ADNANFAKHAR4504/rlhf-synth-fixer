# Model Failures

Common mistakes the model may make when generating the CloudFormation template:

1. **IAM Over-permissioning**
   - Granting `AdministratorAccess` or `*` wildcard permissions instead of least privilege.
   
2. **Unencrypted Storage**
   - Forgetting to enforce **EBS encryption** or **S3 server-side encryption**.

3. **Public Access Risks**
   - Assigning public IPs to EC2 instances.
   - Allowing `0.0.0.0/0` in Security Groups for SSH or database ports.

4. **RDS Misconfiguration**
   - Deploying outside the provided VPC/subnets.
   - Leaving RDS publicly accessible.
   - Not enforcing encryption at rest.

5. **Lambda Misconfiguration**
   - Setting memory lower than 128MB.
   - Omitting VPC configuration.

6. **CloudTrail**
   - Not enabling **multi-region logging** or log file validation.
   - Storing logs in unencrypted or publicly accessible buckets.

7. **Missing Tags**
   - Failing to apply `Environment: Production` tags consistently.

8. **Hardcoding Secrets**
   - Embedding DB passwords directly in the template without using `NoEcho` parameters or Secrets Manager.
