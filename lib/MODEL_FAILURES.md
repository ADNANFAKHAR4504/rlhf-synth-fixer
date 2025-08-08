# MODEL_FAILURES.md
This document briefly notes minor gaps between **MODEL_RESPONSE.md** and **PROMPT.md**, using the current TypeScript implementation as the reference. The solution is largely aligned; the items below are improvement opportunities rather than blockers.

---

## Summary
The architecture is modular (VPC, Security, Compute, Database, Storage) and follows good practices (S3 backend, secrets via Secrets Manager/env vars, tagging). To fully match the PROMPT’s “multi-environment + DRY” intent, a few parameters and docs can be tightened.

---

## Minor Deviations vs PROMPT

1) **Parameterization Scope (VPC & RDS)**
- *Observation:* Some values are still fixed in code (e.g., VPC CIDR/subnet CIDRs; RDS engine/version/instance class).
- *Why it matters:* PROMPT requests environment-reusable modules.
- *Light fix:* Expose these as props with sensible defaults.

2) **Environment Threading**
- *Observation:* `environment`/`projectName` are set internally in stacks.
- *Why it matters:* PROMPT asks for no-code changes across `dev/staging/prod`.
- *Light fix:* Pass them from `TapStack` into each stack (keep current defaults).

3) **Remote State Note**
- *Observation:* S3 backend is configured; DynamoDB locking table isn’t documented.
- *Why it matters:* PROMPT mentions “S3+DynamoDB backend for state isolation.”
- *Light fix:* Add a short note or optional toggle for DynamoDB locking.

4) **DRY Call-outs in Documentation**
- *Observation:* MODEL_RESPONSE.md describes modularity but doesn’t list specific DRY wins.
- *Why it matters:* Reviewer clarity.
- *Light fix:* Add a short bullet list (shared tags, AZ discovery with `Fn.element`, reusable subnet/route patterns).

5) **Version Pinning & Repo Handoff**
- *Observation:* Pinning and a minimal deploy snippet aren’t spelled out in MODEL_RESPONSE.md.
- *Why it matters:* PROMPT requests best practices & handoff clarity.
- *Light fix:* Mention provider/npm pins and include short synth/test/deploy commands.

---

## Conclusion
The current implementation already meets the spirit of the PROMPT. Applying the light touches above (parameter props, env threading, brief state-locking note, DRY bullets, and a minimal runbook section) will make **MODEL_RESPONSE.md** fully aligned without any structural rewrites.