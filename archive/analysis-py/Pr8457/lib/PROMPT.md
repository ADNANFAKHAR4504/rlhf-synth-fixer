Our security team is prepping for a major HIPAA audit, and our network is a mess. We have 8 VPCs in us-east-1 (prod and staging environments) with hundreds of security groups, and we're blind to our own risks. We need a "VPC Auditor" script in Python (Boto3) to find all our compliance gaps.

This script must be smart.

1. It can't just find 0.0.0.0/0. It needs to perform a deep analysis:

2. Find Critical Security Holes: Identify any security group exposing high-risk ports (like 22, 3389, 3306, 5432) to the internet.

3. Find Public Data: This is a top priority. Find any RDS or Redshift instance deployed in a public subnet (one that has a route to an Internet Gateway).

4. Find Data Exfiltration Risks: This is the other big one. Find any resource tagged with DataTier: database or DataTier: cache that is in a security group allowing unrestricted egress (0.0.0.0/0) on all ports.

5. Find Network Blind Spots: List all VPCs that are missing VPC Flow Logs.

6. Find Missing Defense-in-Depth: Identify any subnet that is only using the default NACL instead of a custom, locked-down one.

7. Find Wasted Resources: List all "zombie" resources, like unused security groups (not attached to any ENI) and stale ENIs.

The script needs to be aware of our environment. It must only scan VPCs tagged with Environment: production or Environment: staging. It must skip any VPC tagged ExcludeFromAudit: true and also ignore our shared-services VPC. If it finds a resource with a SecurityException: approved tag, it should flag it but not fail the audit.

A critical_findings.csv for the ops team's immediate action.

A detailed vpc_security_audit.json. This file must list every finding with its severity, resource ID, VPC, a description, and which compliance frameworks (HIPAA, PCI-DSS) it violates.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`
