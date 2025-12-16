# model_failure

## What can still fail and why

* KMS key policy mismatches: If additional services or cross-account principals need access, encryption operations may fail at runtime. The template scopes principals for CloudWatch Logs, VPC Flow Logs, CloudTrail, and SNS; deviations require policy updates.
* Regional service limits: NAT Gateway, EIPs, RDS instance classes, or ALB target limits can block creation if quotas are exhausted.
* RDS subnet or security configuration: If private subnets lack route to the NAT Gateway or SG rules are altered, engine bootstrapping, patch downloads, or connectivity checks may fail.
* Email subscription confirmation: SNS email endpoints require manual confirmation; alarms and verification messages will not be delivered until confirmed.
* Health checks failing: If the example Nginx service is replaced or altered without ensuring the health check path and port remain valid, the Target Group will show unhealthy, causing verification to report failure.
* Name collisions: While names include `ENVIRONMENT_SUFFIX`, external constraints (like S3 global namespace) can still collide if the suffix and account combination isn’t unique.

## Recovery guidance

* For CMK-related failures: Verify key policies include the relevant service principals and, if required, the calling roles. Re-run after policy adjustment; dependent resources will proceed.
* For RDS readiness or version issues: Leave the engine version blank to allow regional default selection; ensure subnets are private with NAT egress and SGs allow application-to-database traffic on the selected engine port.
* For ALB/ASG health: Confirm instance user data starts the service and that security groups permit ALB-to-app traffic; ensure the health check path returns a healthy status code.
* For SNS delivery: Confirm the subscription email and complete the confirmation step; verify topic encryption permits SNS to use the CMK.

## Out-of-scope items

* Zero-downtime blue/green or canary deployment strategies beyond health-aware ALB + ASG rolling behavior.
* Cross-account or cross-region event routing and key usage outside the declared principals.
* Application-specific bootstrap or database schema migrations.

## Preventive practices

* Keep `EnvironmentSuffix` unique per environment and account to avoid S3 and name collisions.
* Retain `AutoMinorVersionUpgrade` for RDS unless a compliance policy mandates pinning; if pinning, verify supported versions in the target region prior to deployment.
* Align health check configuration with the deployed application’s real endpoints before switching traffic.
* Monitor CloudFormation events and SNS notifications for early signals; investigate verification Lambda messages promptly.
