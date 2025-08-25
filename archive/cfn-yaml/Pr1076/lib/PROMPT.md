# Web App Infra CloudFormation Requirements (Shreyas, Aug 2025)

```yaml
This is the working brief for building out a CloudFormation template to spin up a secure web app stack in AWS. 
Im writing this for myself and anyone else who needs to understand **what** were doing and **why**.

---

## Region & Scope
- Were locking this whole thing to **us-east-1**. No point trying to make it work multi-region right now we dont need it and itll just complicate everything.
- Infrastructure will be a **VPC with public and private subnets** across at least 2 AZs.
- Public layer: ALB. Private layer: EC2 instances (via Auto Scaling).
- Database layer: RDS, encrypted at rest with KMS.

---

## Must-haves
1. **S3 Access Logging via CloudTrail** 
I want *all* S3 bucket access and relevant API calls in CloudTrail so we can prove compliance later.
2. **Least Privilege IAM** 
No `*:*` nonsense. Roles and policies scoped to exactly what they need.
3. **Tagging** 
Every EC2 instance should carry `Environment: Production` automatically.
4. **RDS encryption** 
At rest using AWS KMS (AWS managed key is fine unless we decide on a CMK later).
5. **ALB for traffic** 
Health checks in place, spread across AZs.

---

## Security Expectations
- Security Groups locked down to only whats needed (ALB <-> EC2, EC2 <-> RDS).
- No secrets baked into the template if user data needs them, well use SSM Parameter Store or Secrets Manager.
- Default deny where possible.

---

## Nice-to-haves (but not blocking)
- ALB access logs to S3.
- SSM Agent preinstalled on EC2 instances.
- CloudWatch alarms on key metrics (CPU, disk, DB connections).

---

## Done When
- Stack deploys cleanly in us-east-1.
- Linter (`cfn-lint`) passes without errors.
- CloudTrail is actually logging S3 data events.
- EC2 tags show up as expected.
- RDS reports as encrypted with KMS.
- ALB is routing traffic and reporting healthy targets.
```
