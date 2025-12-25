# Model Failures for TapStack CloudFormation Template

This document lists common model failures and misconfigurations observed in the TapStack CloudFormation template, based on the provided requirements for secure AWS infrastructure.

---

## 1. IAM Least Privilege

- **Failure:** IAM roles (e.g., `EC2Role`, `LambdaRole`) use AWS managed policies (`AmazonS3ReadOnlyAccess`, `logs:*`) that may grant broader permissions than necessary.
- **Impact:** Potential violation of least privilege principle.
- **Mitigation:** Scope policies to only required actions and resources.

## 2. Missing AWS Config Rules

- **Failure:** No `AWS::Config::ConfigRule` resources present.
- **Impact:** No automated compliance monitoring for security policies or configuration drift.
- **Mitigation:** Add AWS Config rules for MFA, public access, encryption, etc.

## 3. No MFA Enforcement for IAM Users

- **Failure:** Template does not enforce MFA for IAM users.
- **Impact:** Increased risk of credential compromise.
- **Mitigation:** Add IAM password policy and AWS Config rule for MFA.

## 4. No AWS WAF or AWS Shield

- **Failure:** No `AWS::WAFv2::WebACL` or AWS Shield resources.
- **Impact:** Web applications are not protected against common web exploits or DDoS attacks.
- **Mitigation:** Deploy AWS WAF and Shield for critical resources.

## 5. Security Group Over-Permission

- **Failure:** `WebSecurityGroup` allows HTTP (port 80) from `0.0.0.0/0` (anywhere).
- **Impact:** Application is exposed to the public internet without HTTPS.
- **Mitigation:** Restrict access to required IP ranges and enforce HTTPS.

## 6. No SSL/TLS Enforcement

- **Failure:** Application Load Balancer (`Listener`) only listens on HTTP (port 80), no HTTPS listener or ACM certificate.
- **Impact:** Data in transit is not encrypted.
- **Mitigation:** Add HTTPS listener with ACM certificate and redirect HTTP to HTTPS.

## 7. RDS Public Accessibility

- **Failure:** RDS instance does not explicitly set `PubliclyAccessible: false`.
- **Impact:** Risk of accidental public exposure.
- **Mitigation:** Set `PubliclyAccessible: false` for all RDS instances.

## 8. Incomplete Logging and Monitoring

- **Failure:** No CloudWatch log groups for Lambda or EC2, and no alarms for RDS or S3.
- **Impact:** Reduced visibility and delayed incident response.
- **Mitigation:** Add log groups, metrics, and alarms for all critical resources.

## 9. No SSH Access Restriction

- **Failure:** No security group or rule for SSH (port 22) access control.
- **Impact:** SSH access may be unrestricted if added later.
- **Mitigation:** If SSH is needed, restrict to specific IPs; otherwise, do not allow SSH.

## 10. EBS Encryption

- **Failure:** EBS volumes are encrypted, but only for root volume; additional volumes may not be covered.
- **Impact:** Data at rest may not be fully protected.
- **Mitigation:** Ensure all EBS volumes are encrypted.

## 11. Resource Tagging and Naming

- **Failure:** Some resources lack consistent tagging or naming conventions.
- **Impact:** Harder to manage and track resources.
- **Mitigation:** Apply tags and naming standards to all resources.

## 12. No AWS Config Change Tracking

- **Failure:** No AWS Config recorder or delivery channel.
- **Impact:** Configuration changes are not tracked.
- **Mitigation:** Add AWS Config recorder and delivery channel.

## 13. DynamoDB Backup and Encryption

- **Failure:** DynamoDB table does not specify point-in-time recovery or encryption.
- **Impact:** Risk of data loss or unencrypted data at rest.
- **Mitigation:** Enable point-in-time recovery and specify SSE.

## 14. CloudFront Security

- **Failure:** CloudFront distribution does not specify WAF, Shield, or custom error responses.
- **Impact:** Increased risk of web attacks and poor error handling.
- **Mitigation:** Attach WAF and Shield, and configure error responses.

## 15. Outputs

- **Failure:** Outputs do not include all critical endpoints (e.g., RDS endpoint).
- **Impact:** Harder to integrate and validate deployments.
- **Mitigation:** Add outputs for all key resources.

---

## Checklist for Secure CloudFormation Templates

- [ ] IAM roles and policies are least privilege
- [ ] AWS Config rules and recorder are present
- [ ] MFA is enforced for all IAM users
- [ ] AWS WAF and Shield are deployed
- [ ] Security groups restrict access appropriately
- [ ] HTTPS is enforced for all endpoints
- [ ] RDS is not publicly accessible
- [ ] Logging and monitoring are comprehensive
- [ ] SSH access is restricted or disabled
- [ ] All EBS volumes are encrypted
- [ ] Consistent tagging and naming conventions
- [ ] DynamoDB backup and encryption enabled
- [ ] CloudFront is protected and configured securely
- [ ] All critical outputs are defined

---

*Update this document as new model failure scenarios are discovered or requirements
