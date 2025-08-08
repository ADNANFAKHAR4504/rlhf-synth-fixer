## Problem

Implement the requested AWS infrastructure using **CDK for Terraform (CDKTF) with TypeScript**.  
Your solution must follow **DRY principles**, be production-ready, and strictly meet the requirements defined in `IDEAL_RESPONSE.md` and `verifier.json`.

---

## Requirements

1. **Language & Platform**
   - Use **TypeScript** with **CDKTF** (`cdktf` package).
   - Do **not** use Terraform HCL directly.

2. **Structure**
   - Create separate stack files in `lib/` for:
     - `secure-vpc-stack.ts`
     - `security-stack.ts`
     - `compute-stack.ts`
     - `database-stack.ts`
     - `storage-stack.ts`
     - `tap-stack.ts` (or equivalent orchestrator)
   - Each stack should:
     - Take inputs via constructor props.
     - Export outputs via `TerraformOutput` for cross-stack usage.

3. **Best Practices**
   - No hard-coded secrets or credentials.
   - No hard-coded region or AZs — must be configurable.
   - Implement least-privilege IAM policies.
   - Use KMS encryption for S3, RDS, and other applicable services.
   - Apply environment and project name tags to all resources.

4. **Networking**
   - VPC with public and private subnets across at least **2 AZs**.
   - NAT gateways for private subnets.
   - Internet gateway for public subnets.
   - Proper route table associations.
   - Security groups with minimum required ingress/egress.

5. **Compute**
   - EC2 instances in public subnets.
   - Instance count and type configurable.
   - Key pair handling must be dynamic (no hard-coded names).

6. **Database**
   - RDS instance in private subnets.
   - DB password provided via:
     - Secrets Manager **or**
     - Environment variable
   - Validation: reject passwords >41 characters or containing invalid characters.

7. **Storage**
   - S3 bucket with:
     - KMS encryption
     - Versioning
     - Lifecycle policy for cost optimization.

8. **Outputs**
   - Output IDs, ARNs, and endpoints required by `verifier.json`.

9. **Testing**
   - Maintain and update Jest unit & integration tests under `test/`.
   - Snapshots must be updated if code changes resource definitions.

10. **CI/CD**
    - The code must:
      - Pass `npm run lint`
      - Pass `npm run build`
      - Pass `npm run synth` (or `npx cdktf synth`)
      - Pass all unit & integration tests

---

## Deliverables

- Updated files in:
  - `lib/`
  - `bin/`
  - `test/`
  - `metadata.json`
- No unrelated file changes.
- Snapshots updated if necessary.

---

## Notes

- Avoid committing `.d.ts`, `.js`, `node_modules`, or other generated files.
- Use environment variables or context for values required by tests.
- All resource names must be dynamically generated from project/environment props.
