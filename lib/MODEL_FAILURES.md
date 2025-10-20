1) Circular dependency between IAM role and S3 bucket
- Problem: EC2 role referenced `S3Bucket.Arn` before the bucket existed, causing deployment ordering issues.
- Solution: Moved S3 access to a separate `AWS::IAM::Policy` attached after bucket creation.
- Affects: reliability, deployment

2) Missing private subnet routing
- Problem: Private subnets had no route tables with a default route, breaking egress from private resources.
- Solution: Added `PrivateRouteTable1/2`, associations, and default routes via NAT Gateways.
- Affects: availability, networking

3) ALB listener `DefaultActions` structure invalid
- Problem: Listener action used the wrong schema for forwarding to the target group, preventing traffic routing.
- Solution: Switched to `ForwardConfig` with `TargetGroups` and weight.
- Affects: availability, traffic routing

4) Lambda runtime deprecated
- Problem: Function used a deprecated Python runtime, risking security and support issues.
- Solution: Upgraded to `python3.11`.
- Affects: security, operability

5) No NAT Gateway for private subnets
- Problem: Instances in private subnets could not reach the internet for patches and dependencies.
- Solution: Added two NAT Gateways with EIPs and default routes.
- Affects: availability, networking

6) Hardcoded AMI IDs
- Problem: Static AMI references can go stale or be unavailable in some regions.
- Solution: Use SSM public parameters for the latest Amazon Linux 2 AMI.
- Affects: security, maintainability

7) Database credentials handled insecurely
- Problem: DB password managed via parameters and used directly, increasing exposure risk.
- Solution: Moved to AWS Secrets Manager with dynamic references in RDS properties.
- Affects: security, compliance

8) Cost optimization not addressed
- Problem: No controls to reduce cost during off-hours or diversify instance purchasing.
- Solution: Added mixed instances policy, Spot usage where applicable, and instance scheduling Lambdas.
- Affects: cost optimization

9) Multi-AZ configuration inconsistent
- Problem: Only production benefited from Multi-AZ; other environments risked single-AZ failures.
- Solution: Enabled Multi-AZ across environments via mappings/conditions.
- Affects: availability, resilience

10) CloudTrail retention protection missing
- Problem: Trail lacked protection on replacement, risking audit log loss during updates.
- Solution: Added `UpdateReplacePolicy: Retain` (and continued secure S3 config) for audit durability.
- Affects: compliance, auditability

11) Unsupported MySQL engine version
- Problem: Specified MySQL version was not valid in the target region, causing stack failures.
- Solution: Set engine to a supported version `8.0.43`.
- Affects: availability, deployment

12) Secrets should use dynamic references
- Problem: Credentials were not retrieved via dynamic references, weakening secret hygiene.
- Solution: Use `{{resolve:secretsmanager:...}}` for username/password in RDS.
- Affects: security, compliance

13) S3 bucket naming issues
- Problem: Bucket names could violate lowercase/character constraints depending on substitutions.
- Solution: Simplified naming to deterministic lowercase-safe patterns.
- Affects: operability, deployment

14) SSM parameter type mismatch
- Problem: Used `SecureString` where not supported by the resource flow, causing failures.
- Solution: Switched affected parameters to `String` type.
- Affects: reliability, deployment

15) RDS replacement protection missing
- Problem: Database lacked update/replace protection to preserve data on structural changes.
- Solution: Added `UpdateReplacePolicy: Snapshot` to retain a snapshot on replacements.
- Affects: resilience, compliance

Severity summary
- Total issues: 15
- Critical: 6 (1, 3, 7, 11, 12, 14)
- High: 4 (2, 5, 9, 15)
- Medium: 4 (4, 6, 8, 10)
- Low: 1 (13)
1. Circular dependency: EC2Role references S3Bucket.Arn before S3Bucket is created [FIXED: Moved S3 policy to separate AWS::IAM::Policy after S3 bucket creation]
2. Missing route table for private subnets - no routing configured [FIXED: Added PrivateRouteTable1/2 with associations]
4. ALB Listener DefaultActions structure incorrect for TargetGroupArn reference [FIXED: Updated to use ForwardConfig structure]
5. Lambda uses deprecated python3.9 runtime instead of python3.11/3.12 [FIXED: Updated to python3.11]
6. No NAT Gateway for private subnet internet access [FIXED: Added 2 NAT Gateways with EIPs and routes]
7. Hardcoded AMI IDs may become outdated or unavailable in regions [FIXED: Using dynamic SSM parameter lookup for latest AMIs]
10. Database password stored in Parameter Store after already being used [FIXED: Using Secrets Manager with dynamic references]
13. No Reserved Instance configurations for cost optimization [FIXED: Added Spot instances, instance scheduling, and mixed instance policies]
14. Inconsistent Multi-AZ settings across environments (only Production enabled) [FIXED: Enabled Multi-AZ for all environments]
15. CloudTrail missing UpdateReplacePolicy for deletion protection [FIXED: Added UpdateReplacePolicy: Retain]
16. MySQL engine version 8.0.35 not supported - needs valid version [FIXED: Updated to 8.0.43]
17. DB password should use dynamic references instead of parameters [FIXED: Now using Secrets Manager dynamic references]
18. S3 bucket names don't match lowercase pattern when resolved [FIXED: Removed ProjectName from bucket names]
19. SSM parameter type SecureString not supported - use String type [FIXED: Changed to String type]
20. RDS Database missing UpdateReplacePolicy for deletion protection [FIXED: Added UpdateReplacePolicy: Snapshot]