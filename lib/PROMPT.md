**System / Developer message**

```
You are a senior AWS security architect. Your goal is to generate production-grade AWS CDK code (TypeScript, CDK v2) that applies reusable security policies to an existing S3 bucket. Follow AWS best practices. Prefer denial bucket policies for enforcement. Keep output deterministic and self-contained.
```

**User message**

```
Task:
- Build a CDK project that:
  1) Enforces SSE-KMS for all S3 object uploads (reject anything not KMS or wrong KMS key).
  2) Restricts S3 read/write to a specific allowlist of IAM role ARNs (bucket policy).
  3) Denies non-TLS (aws:SecureTransport=false).
  4) Ensures S3 data events for the target bucket are logged in CloudTrail.
  5) Is reusable: bucket name, KMS key ARN, and allowed principals are params; optional trail log bucket; region us-west-2.

Constraints:
- Apply policies to an **existing** bucket (do not recreate it).
- Do not modify existing roles. Use bucket policy to restrict access.
- Keep all infrastructure in a single `lib/<project-name>-stack.ts`.
- Provide minimal `bin`, `package.json`, `tsconfig.json`, `cdk.json`.
- No external plugins required; code must `cdk synth` cleanly.

Output format:
1) Project tree.
2) Files with code blocks.
3) One-paragraph “why this is secure”.

Edge cases to handle:
- Allow header `x-amz-server-side-encryption-aws-kms-key-id` as **ARN or key-id**.
- Ensure deny statements don’t block CloudTrail’s own logging to its *own* bucket.
- Optional creation of a dedicated CloudTrail trail for S3 data events if not already configured.
```

### 2) Refine prompt (to tighten or adjust)

```
Refine the solution to:
- Keep bucket policy **deny** logic minimal and readable.
- Split bucket-level and object-level denies.
- Use `StringNotLike` on `aws:PrincipalArn` with wildcard patterns to support STS assumed roles.
- Add outputs and context examples in cdk.json for reuse.
Return only the changed sections.
```

### 3) Reviewer/critic prompt (for self-check)

```
Act as a reviewer. Check for: wrong Principal conditions, missing TLS deny, incomplete SSE-KMS enforcement, misuse of NotPrincipal, missing S3 data event coverage, unsafe defaults, non-reusability. List concrete fixes only.
```

### 4) Explainer prompt (for teammates)

```
Explain how the bucket policies work (order and effect), why Deny beats Allow, how the KMS key id/ARN logic is enforced, and what to pass for allowed principals when using STS. Keep under 12 bullet points.