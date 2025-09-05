Generate **production-ready code** for a secure **e-commerce infrastructure** in **us-east-1**.  

### here is my Constraints
- Output **exactly 2 files**:  
  - `lib/tap-stack.ts` → main stack wiring modules  
  - `lib/modules.ts` → reusable constructs  
- Code must run with `cdktf synth` (no edits).  
- No hardcoded secrets, least-privilege IAM, enforce TLS, deny public S3.  
- Naming: `tap-<component>-prod-*`.  
- Tag all resources: `Project=ecommerce, Env=prod, Owner=platform`.  
- Use **KMS CMK with rotation** for S3, EBS, RDS, Redshift, CloudWatch.  
- Logging + monitoring everywhere (CloudWatch Logs/metrics/alarms).  

### Requirements
- **IAM**: AdminRole (MFA required), EC2 roles least privilege, boundaries.  
- **KMS**: CMK `tap-kms-data` with rotation; used for S3, EBS, RDS, Redshift.  
- **S3**: Private, versioned, block public access, enforce TLS, deny unencrypted, access logs → log bucket.  
- **Network**: VPC with public/private subnets (2+ AZs), NAT in public, NACLs default deny.  
- **SGs**: ALB :80/:443 from 0.0.0.0/0 → App SG; App → RDS (5432) + Redshift (5439); DB SGs allow only from App SG.  
- **Flow Logs**: VPC → CloudWatch (encrypted).  
- **EC2/ASG**: Private, IMDSv2, EBS encrypted, Session Manager (no SSH), CloudWatch Agent.  
- **ALB**: Internet-facing HTTPS (TLS1.2+), logs → S3.  
- **RDS**: PostgreSQL/MySQL, Multi-AZ, encrypted, backups, TLS enforced, deletion protection.  
- **Redshift**: RA3/single-node, encrypted, no public access, logs → S3.  
- **CloudWatch**: Central log groups (encrypted), alarms (ALB 5XX, ASG CPU, console login anomalies).  
- **AWS Config**: Recorder + encrypted S3; enable rules (s3 encryption, rds encrypted, redshift encrypted, restricted ssh, log group encrypted, MFA).  

### Outputs
- VPC ID, ALB DNS, ASG name, RDS endpoint, Redshift endpoint, Log bucket, KMS key ARN.  
