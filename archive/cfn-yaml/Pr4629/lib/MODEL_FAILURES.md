— Failure 1
Problem: WAF rules (SQLi/XSS) had conflicting Action vs OverrideAction, causing ambiguous behavior.
Solution: In `WebACL`, kept `RateLimitRule` with `Action: Block`; set `SQLInjectionRule` and `XSSProtectionRule` to `OverrideAction: None` (no mixed fields).
Affected area: Security (web application protection)

— Failure 2
Problem: Python runtime pinned to deprecated python3.9 for Lambda.
Solution: `SecurityMonitoringFunction` uses `Runtime: python3.11` in `TapStack.yml`.
Affected area: Security, reliability, maintainability

— Failure 3
Problem: ASG instances in private subnets lacked NAT, blocking internet egress for package installs/updates.
Solution: Added `NATGateway1/2` with EIPs and default routes via `PrivateRoute1/2` to NAT; private subnets now egress through NAT.
Affected area: Availability, scaling, operations, cost (NAT)

— Failure 4
Problem: Target Group and ALB not properly wired to route traffic to EC2 instances.
Solution: Created `TargetGroup`, attached to `AutoScalingGroup.TargetGroupARNs`; `HTTPListener`/`HTTPSListener` forward to `TargetGroup`.
Affected area: Availability, traffic routing

— Failure 5
Problem: Launch Template only booted EC2; no application/service process started.
Solution: `EC2LaunchTemplate.UserData` installs deps, writes `server.py`, and starts HTTP/HTTPS via `nohup` on ports 80/443.
Affected area: Availability, operability

— Failure 6
Problem: Target Group health check path (/health) not guaranteed to exist.
Solution: Implemented `/health` in `server.py`; set `TargetGroup.HealthCheckPath: /health` and `HealthCheckProtocol: HTTP`.
Affected area: Availability, scaling signals

— Failure 7
Problem: Application data S3 bucket missing lifecycle policies (unlike logs bucket).
Solution: `ApplicationDataBucket` now has lifecycle rules: transition to `STANDARD_IA` (30d), `GLACIER` (90d), `DEEP_ARCHIVE` (180d), noncurrent version expiry, and abort incomplete uploads.
Affected area: Cost optimization

— Failure 8
Problem: Missing DependsOn on some resources caused nondeterministic creation ordering.
Solution: Added `DependsOn: AttachGateway` for `NATGateway{1,2}EIP`; `CloudTrail` depends on `CentralizedLogsBucketPolicy` to ensure policy exists first.
Affected area: Reliability, deployment stability

— Failure 9
Problem: Database credentials handled insecurely (DB username as parameter rather than secret).
Solution: Created `DbSecret` (Secrets Manager) with generated password; `DbInstance` credentials use `{{resolve:secretsmanager:...}}` dynamic references. (Fixed)
Affected area: Security, compliance

— Failure 10
Problem: AMI IDs hardcoded; breaks portability across regions and image updates. (Partially noted to fail outside specific regions)
Solution: Switched `EC2LaunchTemplate.LaunchTemplateData.ImageId` to `{{resolve:ssm:/aws/service/ami-amazon-linux-latest/...}}`. (Fixed)
Affected area: Reliability, portability, maintainability

— Failure 11
Problem: KMS key policy omitted permissions for Auto Scaling service-linked roles to create encrypted EBS volumes.
Solution: Updated `MasterKMSKey.KeyPolicy` with `StringLike aws:PrincipalArn` patterns for Auto Scaling/EC2 service-linked roles; includes `GenerateDataKeyWithoutPlaintext` and `ReEncrypt*`. (Fixed)
Affected area: Security, encryption at rest, autoscaling operations

Summary
- Total issues: 11
- Severity breakdown (qualitative):
  - Critical: 4 (Failures 3, 4, 5, 9)
  - High: 3 (Failures 1, 6, 11)
  - Medium: 3 (Failures 2, 8, 10)
  - Low: 1 (Failure 7)
- All Fixed