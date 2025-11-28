Hey team,

We owe the trading analytics folks a cost-aware EMR environment in `us-east-1` so they can crank through daily Spark jobs against the S3 data lake. Think finance-grade guardrails, but keep it Terraform-friendly (v1.3+ with AWS provider 4.x).

Core services we’re anchoring on:
- Amazon EMR 6.9.0 running Spark 3.x with Hadoop and Hive, master on a public subnet, core/task nodes in private subnets.
- Amazon S3 buckets dedicated to raw input, curated output, and log archives, all with SSE-S3 encryption.

Mandatory to nail:
- Spot-enabled task fleet that scales 0-10 `m5.xlarge` instances off `YARNMemoryAvailablePercentage`, while master/core stay on-demand with core count never dropping below two nodes.
- Termination protection switched on plus automatic shutdown after eight idle hours (keep step concurrency capped at five).
- Bootstrap action that installs `numpy`, `pandas`, and `pyarrow` on every node before jobs start.
- Security groups locked down to corporate CIDR for SSH, with TLS in-transit and SSE-S3 at rest via the EMR security configuration.
- IAM instance profiles and service roles with least-privilege access to only the specified S3 buckets and prefixes.

Optional if time permits:
- CloudWatch alarms or dashboards so the ops crew can see scaling decisions in real time.

Deliverables expected (drop Terraform under `lib/`, provider config already exists):
- `lib/main.tf` — VPC wiring references, EMR cluster definition, step concurrency, termination settings.
- `lib/variables.tf` — AZs, CIDR blocks, bucket names, scaling thresholds, and idle timeout.
- `lib/iam.tf` — EMR roles, instance profiles, and inline policies restricting S3 access.
- `lib/autoscaling.tf` — Task node auto-scaling policy and CloudWatch metric wiring.
- `lib/bootstrap.sh` — Shell script that installs the Python analytics libraries via the EMR bootstrap action.

Ping me once you have a first draft so we can walk through scale testing and security review together.