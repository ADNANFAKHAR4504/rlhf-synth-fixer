We need to build a complete Python-based AWS Multi-VPC Compliance & Connectivity Analysis Tool from scratch.
This tool must include:

A main analysis script (analysis.py)

A full Moto-based testing suite (test_analysis.py)

A compliance JSON output file

An HTML report

Strictly defined audit rules

A fully mocked environment for CI

This must be structured like an enterprise-grade audit tool, similar to professional compliance scanners.

Goal of the Tool

Build a Python 3.12 application that:

Deploys and analyzes a two-VPC architecture:

Payment VPC (10.1.0.0/16)

Analytics VPC (10.2.0.0/16)

Validates VPC peering, routing, DNS resolution, security groups, EC2 nodes, and VPC Flow Logs.

Produces:

A compliance report in JSON (vpc_connectivity_audit.json)

A full HTML report with charts (vpc_connectivity_audit.html)

The objective is to confirm whether the architecture meets SOC2, PCI-DSS, and GDPR connectivity and logging standards.

Deliverables Required
1. analysis.py

A complete CLI tool that:

Uses Boto3

Auto-discovers:

VPCs

Subnets

Route tables

VPC Peering

Security Groups

EC2 instances

VPC Flow Logs

Route 53 Private Hosted Zones

Runs a full compliance audit

Produces structured output

JSON output must include:

{
  "compliance_summary": {
    "total_checks": 0,
    "passed": 0,
    "failed": 0,
    "frameworks": {"SOC2": {...}, "PCI-DSS": {...}, "GDPR": {...}}
  },
  "findings": [
    {
      "resource_id": "",
      "resource_type": "",
      "issue_type": "",
      "severity": "",
      "frameworks": ["SOC2", "PCI-DSS", "GDPR"],
      "current_state": "",
      "required_state": "",
      "remediation_steps": ""
    }
  ]
}


HTML report must include:

Compliance score

Pie charts (Plotly)

Finding categories

Pass/Fail summaries

Tests Required (test_analysis.py)

Use Moto to mock:

VPCs

Subnets

Route tables

VPC peering

EC2 instances

Security groups

Flow logs

Route 53 private hosted zones

S3 bucket for flow log delivery

Tests must:

Deploy a fully compliant mock environment

Modify resources to create non-compliant scenarios

Validate findings detection

Validate JSON and HTML report generation

Include at least 20 individual test assertions

Audit Rules That Must Be Enforced

The tool must verify the following:

A) VPC Architecture Rules

Two VPCs must exist:

Payment VPC: 10.1.0.0/16

Analytics VPC: 10.2.0.0/16

CIDRs must not overlap.

Each VPC must have three private subnets, across different AZs.

B) VPC Peering Rules

VPC Peering connection must exist.

Peering must be in active state.

DNS resolution from remote VPC must be enabled both ways.

No missing or incorrect tags.

C) Routing Rules

All private subnets in Payment VPC must route to Analytics VPC via peering.

All private subnets in Analytics VPC must route to Payment VPC.

No routes must point to invalid targets.

D) Security Group Rules

Each VPC must have a security group allowing:

TCP 443 from peer VPC CIDR

TCP 5432 from peer VPC CIDR

No wide-open ingress (0.0.0.0/0)

No non-encrypted protocols allowed.

E) EC2 Instance Rules

One EC2 instance must exist in each VPC.

Instances must:

Be in private subnets

Not have public IPs

Have SSM enabled (tag-based simulation)

Instances must have correct SGs attached.

F) VPC Flow Logs Rules

Flow logs must exist for each VPC.

Must deliver to S3 bucket.

Must use 1-hour partitioning (enforced via S3 prefix format).

Must include ACCEPT/REJECT traffic.

G) Route 53 Private DNS Rules

Each VPC must have its own private hosted zone.

Each hosted zone must be associated with both VPCs.

DNS records must exist for EC2 instance names.

Cross-VPC DNS resolution must be validated.

Compliance Framework Mapping

Each rule must be evaluated against:

Rule Area	SOC2	PCI-DSS	GDPR
VPC Segmentation	Required	Required	Required
Logging (Flow Logs)	Required	Required	Partial
DNS Controls	Required	Required	Required
Access Control	Required	Required	Required
Encryption Enforcement	Required	Required	Required

Each violation must include the mapped frameworks in the finding.

Execution Requirements

The tool must:

Be runnable via CLI:

python analysis.py --output-json vpc_connectivity_audit.json --output-html vpc_connectivity_audit.html


Use only:

Python 3.12

boto3

moto

jinja2

plotly

standard library modules

No CDK, no Terraform, no AWS CLI usage.
Everything must be done via boto3 and Moto for tests.

End of Prompt

This prompt must generate:

analysis.py (full auditor)

test_analysis.py (full Moto tests)

embedded Jinja2 HTML template

a complete enterprise-style compliance scanner for multi-VPC connectivity