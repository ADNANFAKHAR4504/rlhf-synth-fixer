# What I actually need built (CDK / Python)

Short version: Im trying to automate a few boring-but-important security things across multiple AWS accounts. I use CDK (Python). I dont want a one-off script; I want pieces I can reuse, drop into dev/stage/prod, and evolve without surprises.

If youre reading this while wiring it up: please favor clarity over cleverness. Comments welcome where something feels like a judgment call.

---

## Context and goals

Weve got several AWS accounts and a mix of teams creating buckets/roles/services at different times. I want guardrails, not handcuffs:

- New and existing S3 buckets should end up encrypted at rest (SSE-S3 or KMSsee below).
- IAM roles should be least privilege by default, not * first and fix later.
- Security-relevant config changes (think: bucket policies, IAM policy tweaks, etc.) should land in a place we can actually look atcentralized logs (CloudWatch Logs) that roll up to a security account.
- All of this should be deployable per environment (dev vs prod will differ), and the bits should be modular enough to reuse.

This is CDK in Python. Im expecting a small set of constructs/stacks I can compose.

---

## The moving parts (and what done looks like)

**S3 encryption**
- Enforce server-side encryption for uploads. Prefer a bucket policy that rejects unencrypted PUTs.
- Allow me to pick SSE-S3 or SSE-KMS at deploy time. If KMS, expose the key id/alias in config and wire permissions so writes dont fail.
- I care about both: newly created buckets and a sane path for existing ones (document the migration approach even if its a script or a note).

**IAM roles**
- Provide role constructs that start minimal on permissions. No `Action: "*"`. Use resource scoping where practical.
- Show at least one real example (e.g., a logs-writer role or read-only S3 role) that demonstrates how to attach a tight policy.
- If theres a tradeoff (e.g., needing `logs:CreateLogGroup` wide vs. precreating groups), call it out in comments.

**Centralized logging**
- Local accounts write security-ish events to their own CloudWatch Logs groups.
- Those flow into a central/security account (Log destination / subscription filter approach is fine). I mostly care that we end up with a single pane to query.
- Document the cross-account bits (principals, ARNs, where to run what). Dont assume Organization-wide access if we didnt explicitly wire it.

**Modularity**
- Break this into reusable CDK constructs/stacks (Python). Parameterize by env (account id, region, encryption mode, KMS key, log destination, etc.).
- I should be able to spin up dev without touching prod configs and vice‑versa.

**Docs & tests**
- Plain-English README: how to bootstrap, how to set params, how to deploy, how to verify it worked.
- Unit tests (pytest + CDK assertions) that check the important properties: S3 policies enforcing encryption, IAM policies are scoped (no wildcards on action+resource together), log subscription/destination wiring exists.

---

## How Ill try it

- `cdk synth` should not explode on a fresh repo.
- `cdk deploy` to a throwaway dev account with SSE-S3 first; then flip a flag to SSE-KMS and redeploy. I should see bucket policies rejecting unencrypted PUTs.
- Ill tweak an IAM policy and expect logs to show up in the central account within a couple of minutes (happy path).
- Tests: `pytest` should include assertions for the above. I dont need 100% coverage; I do need coverage for the guardrails.

---

## Notes / gotchas (please read)

- If you need to choose between perfect least privilege and works out of the box, pick works but leave a comment with what to tighten later.
- Multi-account logging: if you need an explicit destination in the security account, include a sample stack there (even if its minimal) and explain the order to deploy.
- KMS: dont silently create keys in every env unless we really need to. Prefer using an existing key via config, but allow creating one when asked.

---

## What I expect in the repo

- CDK app entry point (`app.py`), `cdk.json`.
- Python packages for constructs (split out S3, IAM, logging in separate modules/files).
- `tests/` with pytest-based assertions (CDK assertions).
- A README that a tired human can follow at 11pm: bootstrap, config, deploy, verify, rollback.

Thats it. If anything above is ambiguous, leave a note in the code/README with the assumption you made rather than over-engineering the unknowns.
