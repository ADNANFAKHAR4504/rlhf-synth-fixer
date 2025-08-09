````markdown
# DRY Multi-Environment AWS Infrastructure (CDKTF / Terraform)

This repo implements a DRY, modular AWS infrastructure using **Terraform CDK (CDKTF) in TypeScript**:
- VPC with public/private subnets, IGW, NAT, routes
- Tiered Security Groups (web/app/db)
- EC2 (parametrized AMI/type/count)
- RDS MySQL with secure password resolution (Secrets Manager or ENV)
- S3 with versioning + server-side encryption
- Remote state via S3 (DynamoDB lock recommended)
- Multi-environment via `ENVIRONMENT_SUFFIX` (e.g., `dev`, `staging`, `prod`)

---

## Prerequisites

- **Node.js** ≥ 18.x and **npm**
- **Terraform** ≥ 1.5
- **CDKTF CLI** (installed locally or use `npx`):
  ```bash
  npm i -g cdktf@^0.20.x # optional; you can also use npx
````

* **AWS credentials** exported/configured (e.g. `AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, etc.)
* **Remote state S3 bucket** exists (and optional **DynamoDB** lock table)

> Versions are pinned in `package.json` and `cdktf.json`. Provider pinned in `cdktf.json` (e.g., `aws@~> 6.0`).

---

## Environments

Choose an environment suffix without changing code:

```bash
export ENVIRONMENT_SUFFIX=dev     # or staging / prod
```

The Terraform state key will be `${ENVIRONMENT_SUFFIX}/TapStack${ENVIRONMENT_SUFFIX}.tfstate`.

---

## Secrets

RDS password is resolved in this order:

1. **Secrets Manager**: pass `passwordSecretArn` into `DatabaseStack` (preferred for prod)
2. **Explicit prop**: `password` (useful in tests)
3. **Environment variable**: `DB_PASSWORD` (default) at synth time
4. **CI fallback**: if `CI=true` and none provided

For local/CI:

```bash
export DB_PASSWORD='StrongPassw0rd!'
```

For prod, create a Secrets Manager secret and wire its ARN to the stack props.

---

## Remote State (S3 + DynamoDB)

Set these (or rely on defaults):

```bash
export TERRAFORM_STATE_BUCKET=<your-state-bucket>
export TERRAFORM_STATE_BUCKET_REGION=us-west-2
```

> This project enables the S3 backend lock file. For full lock safety in multi-user scenarios, add a **DynamoDB** table for state locking and set it in your backend configuration (recommended in production).

---

## Quick Start (CDKTF Native)

### 1) Install & Build

```bash
npm ci
npm run build
```

### 2) Synth

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-west-2
export TERRAFORM_STATE_BUCKET=<your-state-bucket>
export TERRAFORM_STATE_BUCKET_REGION=us-west-2
export DB_PASSWORD='StrongPassw0rd!'    # or use Secrets Manager path
npx cdktf synth
```

### 3) Deploy

```bash
# Stack name is TapStack<ENVIRONMENT_SUFFIX>; e.g., TapStackdev
npx cdktf deploy TapStackdev --auto-approve
```

### 4) Destroy

```bash
npx cdktf destroy TapStackdev --auto-approve
```

---

## Alternative: Terraform CLI (`terraform init`, `plan`, `apply`)

You can deploy using **pure Terraform** after synthesizing:

1. **Synthesize** with CDKTF:

```bash
npm ci && npm run build
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-west-2
export TERRAFORM_STATE_BUCKET=<your-state-bucket>
export TERRAFORM_STATE_BUCKET_REGION=us-west-2
export DB_PASSWORD='StrongPassw0rd!'
npx cdktf synth
```

2. **Change into the synthesized stack directory**:

```bash
cd cdktf.out/stacks/TapStackdev
```

3. **Initialize Terraform**:

```bash
terraform init
```

4. **Review the plan**:

```bash
terraform plan \
  -var="aws_region=$AWS_REGION" \
  -var="environment_suffix=$ENVIRONMENT_SUFFIX"
```

> If your backend is not already bootstrapped by CDKTF, provide the backend config via `-backend-config=` flags or a backend file.

5. **Apply**:

```bash
terraform apply -auto-approve
```

6. **Destroy (when done)**:

```bash
terraform destroy -auto-approve
```

> **Note:** When using Terraform directly, ensure your backend and variables align with the synthesized `cdk.tf.json`. CDKTF embeds backend settings from `tap-stack.ts`; you may override during `terraform init` as needed.

---

## Tests

Run unit + integration tests:

```bash
npm test
```

* **Unit**: Synth stacks and verify resources/snapshots.
* **Integration**: Synth full `TapStack` and assert presence of VPC, subnets, NAT/IGW, routes, SGs, EC2, RDS, S3.

---

## Troubleshooting

* **BucketAlreadyOwnedByYou**: Adjust `StorageStack` suffix (`bucketSuffixOverride`) or clear previous buckets.
* **Invalid AZ/Subnet**: Region/AZ mismatch—export `AWS_REGION` and let `SecureVpcStack` pick available AZs.
* **RDS Password Errors**: Use `DB_PASSWORD` with compliant chars and length (8–41); avoid `/`, `@`, `"`, spaces.
* **Backend/State Issues**: Verify S3 bucket and (optionally) DynamoDB table exist; ensure correct IAM permissions.

---

## Cleanup

Destroy the stack and remove any leftover state/artifacts:

```bash
npx cdktf destroy TapStackdev --auto-approve
# If you used raw Terraform:
cd cdktf.out/stacks/TapStackdev && terraform destroy -auto-approve
```

---

## Notes

* NAT per AZ increases cost; for cost-optimized setups, consider a single-NAT design.
* Secrets Manager is recommended for production; env vars are suitable for CI/local dev.
* Keep versions pinned in `package.json` and `cdktf.json` to avoid drift.

```

