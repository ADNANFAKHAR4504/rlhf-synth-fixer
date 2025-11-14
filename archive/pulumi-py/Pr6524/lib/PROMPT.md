ROLE: You are a senior Terraform engineer.

CONTEXT:
We must migrate an AWS application from region us-west-1 to us-west-2 using Terraform HCL.

CONSTRAINTS:
- Preserve logical identity: keep the same names/tags/topology.
- Resource IDs are region-scoped; provide an old→new ID mapping plan using terraform import (do NOT recreate).
- Migrate Terraform state to the new region/workspace without data loss.
- Preserve all SG rules and network configuration semantics.
- Minimize downtime; propose DNS cutover steps and TTL strategy.

DELIVERABLES:
1) main.tf (providers, resources, modules as needed)
2) variables.tf
3) backend.tf (if required) with placeholders, not real secrets
4) state-migration.md (exact Terraform CLI commands: workspace create/select, import, and verification)
5) id-mapping.csv sample (headers: resource,address,old_id,new_id,notes)
6) runbook.md (cutover plan, roll-back, checks)

OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:
```hcl
# main.tf
...