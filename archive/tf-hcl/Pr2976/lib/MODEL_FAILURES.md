# MODEL FAILURES AND ISSUES

## SECURITY VULNERABILITIES

1. Hard-coded database password in variables - should use AWS Secrets Manager
2. CloudFront uses default certificate instead of custom domain certificate
3. RDS password stored in Terraform state file (sensitive but still visible)
4. Lambda function has overly broad KMS permissions
5. S3 bucket policy allows CloudFront logging without proper origin validation
6. No MFA requirement for sensitive operations
7. Config service role has overly broad permissions
8. No encryption in transit validation for RDS connections

## OPERATIONAL ISSUES

1. No automated backup verification for RDS
2. CloudTrail logs to same S3 bucket as application logs (compliance issue)
3. No disaster recovery plan or cross-region replication
4. Single region deployment - no geographic redundancy
5. No automated certificate renewal process
6. ALB certificate uses wildcard for LB DNS name (not practical)
7. Lambda function zip file created locally - not CI/CD friendly
8. No health checks for NAT Gateways
9. Config recorder depends on delivery channel incorrectly

## COST OPTIMIZATION FAILURES

1. NAT Gateways in every AZ (expensive) - could use NAT instances for dev
2. RDS Multi-AZ enabled by default without environment consideration
3. No reserved instance planning
4. CloudWatch log retention periods not optimized by log type
5. No S3 Intelligent Tiering enabled
6. RDS read replica always running regardless of need

## MONITORING AND ALERTING GAPS

1. No custom metrics for application-specific monitoring
2. CloudWatch alarms have static thresholds - no dynamic scaling
3. No anomaly detection setup
4. Limited WAF rule coverage - only basic AWS managed rules
5. No synthetic monitoring/canary checks
6. Missing disk space monitoring for EC2 instances
7. No database connection pooling monitoring

## INFRASTRUCTURE RELIABILITY ISSUES

1. Auto Scaling Group has no connection draining configuration
2. No blue/green deployment strategy
3. Launch template doesn't specify EBS encryption
4. No automated AMI patching strategy
5. RDS parameter group uses generic settings
6. No circuit breaker pattern implementation
7. Target group health checks use default settings

## COMPLIANCE AND GOVERNANCE

1. No AWS Organizations SCPs implemented
2. Missing resource-based policies for fine-grained access
3. No automated compliance scanning
4. Config rules limited to basic set
5. No data classification tags
6. Missing audit trail for infrastructure changes
7. No automated security scanning of AMIs

## NETWORKING ISSUES

1. Security groups allow broad egress (0.0.0.0/0)
2. No Network ACLs for additional security layer
3. VPC Flow Logs only capture metadata, not packet inspection
4. No VPN or Direct Connect setup for hybrid connectivity
5. DNS resolution relies on default AWS settings

## DEPLOYMENT AND MAINTENANCE

1. Terraform state not configured for team collaboration
2. No modules used - monolithic configuration
3. Hard-coded values instead of data sources where applicable
4. No environment parameterization
5. Resource naming could cause conflicts across environments
6. No automated testing of infrastructure changes
