What’s wrong (and how to fix it)

AZ inputs vs. discovery

Issue: Uses Az1/Az2 params.

Fix: Use Fn::GetAZs + Fn::Select to auto-pick distinct AZs (no params).

SSH exposure

Issue: Management SG allows 22/tcp from 0.0.0.0/0.

Fix: Allow SSH only from OnPremCidr and terminate over IPSec VPN.

Missing IPSec VPN

Issue: No VPNGateway, VPCGatewayAttachment, CustomerGateway, VPNConnection, VPNConnectionRoute.

Fix: Add all of the above; route on-prem CIDR over the tunnel.

Weak S3 encryption & policy

Issue: Uses SSE-S3 (AES256); no secure-transport deny; no Organizations guard.

Fix: Use SSE-KMS with a dedicated CMK (rotation on). Add DenyInsecureTransport and optional DenyOutsideOrg when OrganizationId is provided. Ensure CloudTrail write permissions include bucket-owner-full-control.

Under-configured CloudTrail

Issue: Single-region, no log file validation, no CW Logs, no KMS key.

Fix: Configure multi-region, EnableLogFileValidation: true, KMSKeyId to CMK, and CW Logs integration (log group + IAM role with logs:CreateLogGroup on *, logs:Describe*, logs:CreateLogStream, logs:PutLogEvents).

ALB hardening

Issue: 80 and 443 open, no redirect; no WAF.

Fix: Keep HTTP (80) listener only to redirect → HTTPS (443); attach a WAFv2 WebACL (Common, IP Reputation, SQLi). (Cert/HTTPS listener can be added later out of scope.)

Cross-account role security

Issue: Trust policy missing MFA.

Fix: Require aws:MultiFactorAuthPresent: true in the assume-role condition; keep permissions least-privilege read-only.

Scope mismatch (RDS, multi-region peering, CloudFront/Shield on CF)

Issue: Adds RDS and peering plus CloudFront references not in the actual code/scope.

Fix: Remove RDS, VPC peering, and CloudFront. Keep optional Shield Advanced only for the ALB (toggled via parameter).

Outputs too thin

Issue: Missing IDs/ARNs.

Fix: Output VPC/Subnets, ALB ARN, WAF ARN, optional CloudTrail details, optional cross-account role ARN.

Acceptance checklist (pass when all true)

 AZs discovered via Fn::GetAZs; no AZ params.

 SSH allowed only from OnPremCidr; IPSec VPN fully provisioned.

 S3 Trail bucket uses SSE-KMS CMK (rotation on), DenyInsecureTransport, and optional DenyOutsideOrg.

 CloudTrail is multi-region, KMS-encrypted, log file validation enabled, CWL integrated with correct role.

 ALB has HTTP→HTTPS redirect and WAFv2 association.

 Cross-account read-only role requires MFA in trust policy.

 Optional Shield Advanced toggle for ALB is available.

 Outputs include IDs/ARNs for key resources.

 No RDS, no VPC peering, no CloudFront (out of scope for this stack/code).Insert here the model's failures