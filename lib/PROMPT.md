Functional scope:

* Generate a single CloudFormation template named **TapStack.yml** that **creates** (does not reference) all infrastructure from scratch for a production-grade, highly available **Aurora MySQL 8.0** deployment in **us-east-1** spanning three AZs (**us-east-1a, us-east-1b, us-east-1c**).
* All logical/resource names, identifiers, and exported names MUST include **`-${EnvironmentSuffix}`** to prevent collisions across environments.
* The template MUST be **pure YAML** (no JSON), **no YAML anchors/aliases**, and use standard CloudFormation intrinsics (`!Ref`, `!Sub`, `!GetAtt`, etc.).
* Enforce safe parameterization and idempotent updates with explicit **DeletionPolicy**/**UpdateReplacePolicy** (e.g., `Snapshot` on stateful data).
* Include complete **Parameters**, **Conditions** (if any), **Metadata**, **Mappings** (only if truly needed), **Resources**, and **Outputs** sections.

Core services (mandatory):

1. **Amazon Aurora MySQL** (RDS/Aurora Cluster + Instances + Parameter Groups)
2. **Amazon CloudWatch** (Enhanced Monitoring + Alarms)
3. **Amazon Kinesis** (Database Activity Streams destination)

Mandatory requirements (implement all):

1. **Aurora HA topology**: Create an **Aurora MySQL 8.0 cluster** with **one writer** and **two initial reader instances**, distributed across **us-east-1a / us-east-1b / us-east-1c**.
2. **Automatic failover & promotion priorities**: Explicitly set **promotion tiers** so **writer = 0**, readers use **tiers 1–15** in ascending order for deterministic failover.
3. **Aurora Auto Scaling for read replicas**: Target **CPUUtilization = 70%**, **MinCapacity = 2**, **MaxCapacity = 5** instances. Ensure scaling policies attach correctly to the **DB cluster** and govern **reader** instance count.
4. **Backtrack**: Enable **BacktrackWindow = 72 hours** for near-instant rollback without downtime.
5. **Enhanced monitoring**: Enable **EnhancedMonitoringInterval = 10 seconds** with metrics streaming to CloudWatch (include correct IAM role and permissions for RDS to publish EM metrics).
6. **Database Activity Streams (DAS)**: Enable **synchronous** DAS on the cluster and stream to a **Kinesis Data Stream** created in this template (include all required roles/permissions, keys if needed).
7. **CloudWatch alarms**:

   * **Replica lag** alarm when **`AuroraReplicaLag` > 1000 ms** across readers (statistic and period configured appropriately).
   * **Writer CPU** alarm when **`CPUUtilization` > 80%** for the writer instance.

Optional enhancement (choose and implement exactly one):

* **Automated backups**: **35-day** retention and **preferred backup window** of **03:00–04:00 UTC**, plus **Performance Insights** enabled with **7-day** retention; or
* **SNS notifications**: An **SNS Topic** with an **email subscription** for automated failover/Alarm notifications.

Context and constraints:

* Production deployment in **us-east-1** across **three AZs** with **private DB subnets** and a **custom DB subnet group**.
* Security group(s) must restrict access to the **application tier only** (ingress parameterized via SG IDs or CIDRs as parameters; default to no 0.0.0.0/0).
* Prepare for **cross-region replication to us-west-2** by enabling **binary logging** via a **custom cluster parameter group** with `binlog_format=ROW` (parameter group created in-template and attached to the cluster). Full cross-region resources can be out of scope, but the cluster must be configured to allow it.
* **Enhanced Monitoring** streams to CloudWatch with 10-second granularity as above.
* **Zero-downtime tolerance** during **08:00–22:00 EST** business window drives the failover, scaling, and monitoring posture—ensure deterministic promotion priorities and healthy instance placement across all three AZs.

Template authoring rules & best practices:

* **All resource names include `-${EnvironmentSuffix}`** (example: `aurora-cluster-${EnvironmentSuffix}`, `db-sg-${EnvironmentSuffix}`, `kds-das-${EnvironmentSuffix}`).
* **No hard AllowedValues** for `EnvironmentSuffix`. Instead, validate with a **safe regex**:

  * `EnvironmentSuffix` **AllowedPattern**: `^[a-z0-9-]{3,20}$`
  * Helpful **ConstraintDescription** explaining allowed characters/length.
* Require explicit **Parameters** for VPC ID, **three** private **SubnetIds** (one per AZ), application-tier **SecurityGroupId(s)** permitted to access the DB, **MasterUsername**, **MasterPassword** (use `NoEcho: true`), KMS Key ARNs if encryption at rest is specified (OK to add sensible defaults/Condition).
* Use **DeletionPolicy: Snapshot** and **UpdateReplacePolicy: Snapshot** on the DB cluster and instances.
* Ensure **DependsOn** and ordering are correct (parameter groups, subnet group, roles/policies before cluster; cluster before instances; scaling and alarms after instances).
* Avoid circular dependencies; keep IAM policies least-privilege (RDS Enhanced Monitoring role, DAS/Kinesis permissions).
* No YAML anchors/aliases; keep the template **valid for cfn-lint** (no unsupported properties).

Inputs (parameters to include):

* `EnvironmentSuffix` (regex validated, included in every name)
* `VpcId`, `DbSubnetIds` (exactly 3, mapped to the target AZs), `AppSecurityGroupId` (or list)
* `DBEngineVersion` (default **8.0.mysql_aurora.3.x** family with sensible default), `DBInstanceClass` (e.g., `db.r6g.large`), `MasterUsername`, `MasterPassword` (`NoEcho`)
* Optional: `KmsKeyId` for storage encryption (if specified, enable storage encryption), `MonitoringRoleExistingArn` (if not provided, create a role)

Outputs (must provide):

* **ClusterEndpoint** (writer endpoint)
* **ReaderEndpoint** (read-only endpoint)
* **KinesisStreamArn** (for Database Activity Streams)

Acceptance criteria:

* The template creates a writer and two readers across **us-east-1a/b/c** with the specified **promotion priorities** and **Auto Scaling** policy (2–5 readers, CPU target 70%).
* **Backtrack** is enabled for **72 hours**.
* **Enhanced Monitoring** at **10s** is active and publishing.
* **DAS** is enabled in **synchronous mode** and producing to the provisioned **Kinesis stream**.
* **CloudWatch alarms** exist for **replica lag > 1000ms** and **writer CPU > 80%**.
* All stateful resources have **Snapshot** policies for delete/replace.
* All names include **`-${EnvironmentSuffix}`**; template passes `cfn-lint` property validation.

Deliverable:

* A single file **TapStack.yml** (YAML) containing **all** parameters, resources, policies, scaling configurations, monitoring, alarms, and outputs as specified above—ready to deploy in a new account with no external dependencies.
* The file must adhere strictly to CloudFormation YAML syntax and best practices, with clear in-line descriptions where helpful, and no usage of YAML anchors or JSON fragments.
