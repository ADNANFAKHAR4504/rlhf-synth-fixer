## 1) **Architect & Generate (Single‑Shot)**

**Role**: You are a senior AWS cloud architect and TypeScript CDK expert.

**Goal**: Produce a production‑ready AWS CDK v2 TypeScript project that provisions the resources described below.

**Scope**:

* Region **must** be `eu-central-1`.
* Two EC2 instances (latest Amazon Linux 2) in different subnets/AZs with **detailed monitoring** enabled.
* VPC with at least two subnets spread across AZs.
* Application Load Balancer with **access logging enabled** that targets both EC2 instances.
* Publicly accessible **RDS db.t3.micro**.
* S3 bucket with **SSE-S3 (AES-256)**.
* IAM roles granting EC2 and Lambda access to that S3 bucket.
* Tag **all** resources with `Environment=Production`.

**Constraints**: The infrastructure must be launched in the eu-central-1 region. | All resources should be tagged with 'Environment: Production'. | The EC2 instance should use the latest Amazon Linux 2 AMI. | Enable detailed CloudWatch monitoring for the EC2 instance. | The RDS instance should be of type db.t3.micro. | The RDS instance must be configured to be publicly accessible. | S3 bucket must have server-side encryption enabled with AES-256. | IAM roles should be defined for both EC2 and Lambda functions to access the S3 bucket. | Vpc must contain at least two subnets spread across different availability zones. | Configure an Application Load Balancer to distribute traffic to two EC2 instances in different subnets. | Ensure access logging is enabled for the Application Load Balancer.

**Artifacts**:

* Minimal CDK project with `bin/` and `lib/`.
* **All infrastructure in `lib/<project>-stack.ts`.**
* Clear comments, outputs, and README instructions.

**Quality Bar**:

* CDK compiles (tsc) and synthesizes (cdk synth) without errors.
* Security groups least‑privilege where possible; explain any exceptions (e.g., public RDS requirement).
* In‑code region guard to enforce `eu-central-1`.

**Deliver**: Full code + brief deployment instructions.

---

## 2) **Red‑Team Review (Critique)**

Given the produced CDK, audit it for:

* Implicit public exposure, mis‑scoped security groups, missing encryption, missing log delivery permissions.
* RDS networking correctness for `publiclyAccessible: true` (subnet type, SG rules).
* ALB access logging bucket policy.
* Tag coverage (`Environment=Production`) on all constructs.
  Return a concise punch‑list with code‑level fixes.

---

## 3) **Explain Trade‑offs**

Explain why EC2 is placed in private subnets behind an internet‑facing ALB; why RDS is public (per requirement) and the risks; and why S3 uses SSE‑S3 vs SSE‑KMS.

---

## 4) **Generate Tests / Validations**

Write minimal assertions (e.g., using `assert` on synthesized template) that validate: region guard, tags present, ALB logging enabled, EC2 detailed monitoring, RDS instance type and `PubliclyAccessible` true.
