We need a comprehensive security audit and compliance check of all AWS Security Groups in the `us-east-1` region, spanning 12 VPCs, with focus on reducing risk and supporting PCI-DSS, HIPAA, and SOC2 compliance. Please create a Python 3.12 script named `analyze_security_groups.py` using **Boto3** and **networkx** for rule analysis.

**This script must analyze and report on the following issues:**

1. **Unrestricted Inbound:** Find security groups allowing inbound from `0.0.0.0/0` to any high-risk port: 22, 3389, 1433, 3306, 5432, 5984, 6379, 7001, 8020, 8888, 9042, 9200, 11211, 27017.
2. **Unrestricted Outbound:** Egress to `0.0.0.0/0` on all ports for any resource in sensitive tiers (database, cache).
3. **Unused Security Groups:** Not attached to any ENI, EC2, RDS, ELB, or Lambda for more than 90 days (list days unused).
4. **Default SG in Use:** EC2, RDS, or Lambda using the default VPC security group rather than a custom group.
5. **Overly Broad Source:** Rules allowing inbound from large CIDR ranges (`/8`, `/16`) rather than specific IPs.
6. **Duplicate Rules:** Security groups with identical or overlapping rules (use networkx to help identify consolidation opportunities).
7. **No Description:** Rules lacking descriptions.
8. **Cross-VPC References:** Security groups referencing groups from other VPCs without VPC peering.
9. **Deprecated Protocols:** Any allow rule for Telnet (port 23), FTP (21), or TFTP (69).
10. **IPv6 Exposure:** Inbound rules allowing from `::/0` (analyze for missing IPv4 restrictions as well).
11. **All Traffic Rules:** Protocol -1 rules (all protocols), not required by use case.
12. **Management Port Exposure:** Groups allowing SSH/RDP from Internet instead of using SSM Session Manager.
13. **Unnecessary ICMP:** Rules allowing all ICMP types when only echo/echo-reply are required.
14. **Load Balancer Security:** ALB/NLB groups not restricting backend access to just the LB SG.

**Analysis and exclusion rules:**
- **Audit only security groups in production and staging VPCs.**
- **Exclude any group tagged `ExcludeFromAudit: true` (case-insensitive).**
- **Ignore any with names starting with `temp-`.**
- **If a group/rule is tagged as a security exception (tag: `SecurityException: approved`), flag but allow; must print justification.**

**Output requirements:**

- **Console:** Display critical findings, ranked by calculated risk score.
    - Show all severe findings first, with a short risk summary per item.
- **JSON:** Save as `security_group_audit.json` with this structure:
    - `findings`: [
        {
          `finding_type`, `severity`, `security_group_id`, `security_group_name`, `vpc_id`,
          `rule_details`: {direction, protocol, port_range, source_destination, risk_description},
          `attached_resources`: [{resource_type, resource_id}],
          `remediation_steps`,
          `compliance_frameworks`: [PCI-DSS, HIPAA, SOC2]
        }
      ]
    - `unused_security_groups`: [{sg_id, sg_name, days_unused}]
    - `statistics`: {total_security_groups, groups_with_high_risk_rules, unused_groups, groups_in_use}
- **HTML dashboard:** Output a `security_posture_dashboard.html` that visualizes risk severity, heat map of rule exposures, and prioritizes remediations.
- **CSV:** Output `compliance_violations.csv` mapping findings to compliance requirements for PCI-DSS, HIPAA, SOC2.

**Further specifications:**
- Perform risk scoring per finding based on severity, exposure, and compliance implications.
- Validate every finding against PCI-DSS, HIPAA, and SOC2 controls and note which are impacted.
- For duplicate/overlapping rules, use **networkx** to build and analyze the rule graph.
- Provide actionable, concise remediation steps in all outputs.
- Clearly mark approved exceptions, separating them visually in the output with justification text.
- Only include in scope groups/rules per VPC filter, tags, and age requirements.
- Every output must be formatted and summarized per the specification above.

**Environment:**
- AWS us-east-1, EC2/VPC (Security Groups), RDS, Lambda, ELB
- Python 3.12, Boto3, networkx, pandas
- Must generate the above JSON, HTML, and CSV deliverables as described.

_Do not alter, omit, or reinterpret any requirement, exclusion, or output structure. Produce the script and output as specified above._