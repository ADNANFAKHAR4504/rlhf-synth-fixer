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

8) CloudTrail retention protection missing
- Problem: Trail lacked protection on replacement, risking audit log loss during updates.
- Solution: Added `UpdateReplacePolicy: Retain` (and continued secure S3 config) for audit durability.
- Affects: compliance, auditability

9) Unsupported MySQL engine version
- Problem: Specified MySQL version was not valid in the target region, causing stack failures.
- Solution: Set engine to a supported version `8.0.43`.
- Affects: availability, deployment

10) S3 bucket naming issues
- Problem: Bucket names could violate lowercase/character constraints depending on substitutions.
- Solution: Simplified naming to deterministic lowercase-safe patterns.
- Affects: operability, deployment

11) SSM parameter type mismatch
- Problem: Used `SecureString` where not supported by the resource flow, causing failures.
- Solution: Switched affected parameters to `String` type.
- Affects: reliability, deployment

Severity summary
- Total issues: 11
- Critical: 4 (1, 3, 7, 11)
- High: 2 (2, 5)
- Medium: 4 (4, 6, 8, 10)
- Low: 1 (10)