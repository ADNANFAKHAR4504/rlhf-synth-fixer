# Terraform Config Issues Found

Hey, reviewed the tap_stack.tf file and found several issues that'll probably cause deployment failures or runtime problems.

## Critical Issues

### 1. Secrets Manager naming conflict
**Line 114:** The secret name "proj-webapp-db-password" is hardcoded. If you run this twice or the secret already exists from a previous run, it'll fail.

**Problem:** AWS Secrets Manager keeps deleted secrets for 7-30 days. Can't recreate with same name immediately.

**Fix needed:** Either add a random suffix or use `name_prefix` instead of `name`.

### 2. Missing S3 bucket
**Line 339:** IAM policy references bucket "webapp-assets" but there's no S3 bucket resource defined.

**Problem:** EC2 instances get permissions to a non-existent bucket. If app tries to access it, will fail.

**Fix needed:** Create the S3 bucket or remove the policy if not needed.

### 3. Hardcoded region in user data
**Line 430:** User data script has hardcoded region "us-east-1" but using var.aws_region elsewhere.

**Problem:** If you deploy to different region, the Flask app won't find the secret.

**Fix needed:** Pass the region as a variable to the user data template.

### 4. ACM certificate broken
**Line 759-761:** ACM certificate has count=0 and empty domain_name="".

**Problem:** This resource will never be created but HTTPS listener logic depends on domain_name variable.

**Fix needed:** Should use conditional based on var.domain_name being set.

### 5. Missing egress rule for RDS
**Line 284-303:** RDS security group has no egress rules.

**Problem:** Database might not be able to communicate out if needed for updates or monitoring.

**Fix needed:** Add egress rule for RDS security group.

## Potential Runtime Issues

### 6. Launch template references
**Line 543:** Using deprecated vpc_security_group_ids in launch template.

**Problem:** Should use network_interfaces block for better control.

### 7. Missing monitoring role
**Line 712:** Aurora instances have monitoring_interval=60 but no monitoring role defined.

**Problem:** Enhanced monitoring won't work without proper IAM role.

**Fix needed:** Create and attach monitoring role for RDS.

### 8. No NAT Gateway for private subnets
**Lines 164-175:** Private subnets created but no NAT Gateway or route.

**Problem:** Database instances can't reach internet for updates if needed.

**Fix needed:** Add NAT Gateway if internet access required, or document that it's air-gapped by design.

### 9. Target group health check timing
**Line 745:** Health check path is /health with 5 second timeout.

**Problem:** On cold start, Flask app might not respond in 5 seconds, causing false unhealthy status.

**Fix needed:** Increase timeout or add warm-up time.

### 10. Missing CloudWatch Logs config
**No CloudWatch Logs setup**

**Problem:** No centralized logging for debugging issues.

**Fix needed:** Add CloudWatch Logs agent config and IAM permissions.

## Minor Issues

### 11. Tags inconsistency
**Line 101:** Environment hardcoded as "prod" in locals but using var.environment elsewhere.

### 12. DB password in state
**Line 680:** Even though marked sensitive, DB password stored in state file.

**Consider:** Using AWS SSM Parameter Store with SecureString instead.

### 13. No budget alerts
**No cost controls defined**

**Risk:** Could accidentally rack up charges with auto-scaling.

**Consider:** Add budget alerts or scaling schedule.

## Things that'll work but aren't ideal

- ALB and EC2 security groups allowing different ports (80 vs 5000) but nginx proxies between them - confusing setup
- Using name_prefix for security groups might hit AWS naming limits
- Auto-scaling cooldown of 300 seconds might be too long for quick scaling needs
- No SSL redirect when domain not provided - HTTP only is insecure

## What to fix first

1. The Secrets Manager naming issue - deployment will fail on second run
2. Hardcoded region in user data - breaks multi-region deploys  
3. Missing S3 bucket - runtime errors
4. ACM certificate count issue - confusing and might cause terraform plan issues

The rest can wait but should be addressed before production use.