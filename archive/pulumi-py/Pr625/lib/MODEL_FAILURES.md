# Model Failures Report  
_Comparison of the generated **tap_stack.py** against the authoritative requirements in **prompt.md / IDEAL_RESPONSE.md**_

| # | Requirement (prompt.md) | Observed in tap_stack.py | Gap / Failure |
|---|-------------------------|--------------------------|---------------|
| **A  – Core Infrastructure** |
| A-1 | **Cross-Region VPC peering** among *all* three regions | Peering only `us-east-1 ↔ us-west-2` and `us-east-1 ↔ ap-south-1`. No `us-west-2 ↔ ap-south-1`; no route-propagation updates. | Partial implementation |
| A-2 | **S3**: versioning **and cross-region replication** | Versioning enabled, _no replication rules_ defined. | Missing feature |
| A-3 | **RDS PostgreSQL with read-replicas** | No RDS resources created at all. | Missing feature |
| A-4 | **DynamoDB global table** for session management | Not present. | Missing feature |
| A-5 | **Secrets Manager** for DB credentials with rotation | Not present. | Missing feature |
| A-6 | **TLS 1.2+** enforced “on all services” | ALB redirects HTTP→HTTPS but _no HTTPS listener_, ACM cert or security-policy. RDS/Lambda/S3 encryption-in-transit settings absent. | Incomplete |
| A-7 | **IPv6 / dual-stack networking** | VPCs created IPv4-only; no IPv6 CIDR blocks or routes. | Missing feature |
| **B – Security & Compliance** |
| B-1 | **CloudTrail** multi-region trail | Not implemented. | Missing |
| B-2 | **AWS Config rules** (encrypted-volumes, public-S3, etc.) | Not implemented. | Missing |
| B-3 | **SNS alerting pipeline** for alarms | Not implemented. | Missing |
| B-4 | **Least-privilege SGs** | EC2 SG allows SSH (22) from entire 10.0.0.0/8; should be admin CIDR or bastion only. | Over-permissive |
| B-5 | **KMS key policies** should be _region-agnostic service principals_ | Principal uses `logs.{region}.amazonaws.com` _string_, not ARN; not future-proof for opt-in regions. | Sub-optimal |
| **C – Monitoring** |
| C-1 | **CloudWatch metrics & alarms (CPU ≥ 70 %, ALB 5xx, etc.)** | No metric alarms defined. | Missing |
| C-2 | **VPC Flow Logs retention** 30 d ✔︎ | Implemented |
| **D – Compute** |
| D-1 | **Lambda runtime** should be Python 3.12 (per prompt) | Uses `python3.9`. | Outdated runtime |
| D-2 | **EC2 mixed-instance ASG** | Fixed `t3.micro` only. | Not compliant |
| **E – Error Handling & Validation** |
| E-1 | Robust try/except + custom `TapStackError` classes | None – any failure aborts deployment. | Missing |
| E-2 | CIDR overlap / input validation pre-checks | Not present. | Missing |
| **F – Testing Targets** |
| F-1 | Stack designed to achieve **>90 % unit coverage** | Code structure is monolithic; tough to unit-test granularly. | Risk |
| F-2 | No corresponding updates to `tests/unit` / `tests/integration` for new resources (RDS, DynamoDB, CloudTrail, etc.). | Tests will fail once resources are added. | Missing tests |
| **G – Miscellaneous** |
| G-1 | Naming convention `PROD-{service}-{identifier}-{region}` | Followed for most resources ✔︎ |
| G-2 | Tagging – required keys present ✔︎ | Yes, but not enforced via helper for every resource (e.g., RouteTableAssociations, FlowLogsRolePolicyAttachment). | Partial |

## Summary
The generated `tap_stack.py` covers the basic networking and compute layers but omits or partially implements several **critical security, data-layer, and compliance requirements**.  
Key blockers to production-readiness:

1. Storage tier (S3 replication, RDS + replicas, DynamoDB global tables) is absent.  
2. Governance layer (CloudTrail, AWS Config, SNS alerts) not deployed.  
3. Encryption & TLS requirements only partly met; Secrets Manager not used.  
4. No IPv6 support, incomplete VPC peering mesh.  
5. Monitoring/alarms and error-handling scaffolding missing.

Addressing these gaps is mandatory to satisfy the enterprise specification defined in **prompt.md / IDEAL_RESPONSE.md**.