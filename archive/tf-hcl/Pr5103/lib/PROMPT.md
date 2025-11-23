# ROLE
You’re a senior AWS/Terraform engineer. Write clear, production-grade IaC with least-privilege IAM, encryption, and concise comments.

# GOAL
Create **one file: `tap_stack.tf`** that provisions a **new per-region stack** for a multiplayer player-state pipeline. **No external modules. No provider blocks.** I already have `provider.tf`. You **must declare** `variable "aws_region"` and use it, but don’t configure providers here.

# ARCHITECTURE (feasible)
- **Ingest:** Kinesis (On-Demand or computed shards) → Lambda (provisioned concurrency) → **DynamoDB** (PK `player_id`, SK `state_key`) with **conditional writes** using a **`version_vector`** map.
- **Replication:** DynamoDB **Global Tables** (eventual). Optional replicas via `replica_regions`.
- **Hot reads:** DynamoDB Streams → Lambda → **ElastiCache/Redis** (Lua atomic updates; `{playerId}` key-tag).
- **Fan-out & graph:** **SNS** → regional **SQS** → Lambda → **Amazon Neptune** (social graph).
- **Consistency checks:** **Step Functions Express** that loops internally with 5-second `Wait` to sample/compare DDB vs Redis; kicked off by **EventBridge every 1 minute**.
- **Conflicts:** CRDT resolver Lambda via SQS (merge + retry).
- **Audit:** **Timestream** for full state transition history.
- **Network/Sec:** Minimal VPC (private subnets, SGs, NAT as needed), VPC endpoints, KMS CMKs with rotation, TLS everywhere, tags on all.

# INPUTS (declare as variables with defaults)
- `project_name="player-consistency"`, `environment="prod"`, **`aws_region` (no default)**
- `owner="platform-team"`, `cost_center="gaming-core"`
- `use_kinesis_on_demand=true`, `use_shards=false`, `updates_per_second=2550`, `avg_item_size_bytes=1024`
- `replica_regions=[]`, `consumer_groups=["graph-updater"]`, `verification_sample_size=100`

# REQUIREMENTS
- Include: `terraform` block (required_version + provider **version constraints only**), `variables`, `locals` (naming + capacity math), **all resources**, IAM (least privilege), **outputs** (Kinesis, DDB, Redis endpoint, SNS, SQS, Neptune, Step Functions, Timestream, VPC/subnets, KMS).
- Encryption at rest for Kinesis/DDB/SQS/SNS/Redis/Neptune/Timestream via KMS.
- Kinesis ESM → Lambda with sensible batching/parallelization.
- DDB Streams enabled (NEW_AND_OLD_IMAGES).
- Redis cluster-mode, Lua/EVALSHA noted in comments.
- EventBridge(1m) → Start Express SFN that self-loops at 5s.
- CloudWatch metrics/alarms for hot path (at least basic).

# DELIVERABLE
Return **exactly one** fenced code block labeled `hcl`, first line comment `// tap_stack.tf`. No text outside the block.

# ACCEPTANCE
Single file; no provider blocks; variables + outputs present; resources created (no external modules); Kinesis→Lambda→DDB, DDB Streams→Lambda→Redis, SNS→SQS→Lambda→Neptune wired; Express SFN + EventBridge(1m) with internal 5s loop; CRDT resolver path; Timestream logging; least-privilege IAM; encrypted & tagged resources.
