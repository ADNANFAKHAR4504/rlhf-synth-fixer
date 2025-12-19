# Functional scope (build everything new):

Produce a **single CloudFormation YAML template** named **TapStack.yml** that provisions a brand-new, production-grade **Amazon Aurora MySQL** cluster and all supporting resources from scratch. No references to pre-existing subnets, security groups, parameter groups, or topics—declare and create everything required inside this one template (parameters + resources + outputs). The template must be directly deployable with AWS CLI 2.x.

# Technical requirements

1. **Aurora MySQL cluster & topology**

* Engine: Aurora MySQL compatible with the organization’s current 5.7 family (Aurora MySQL v2.x); set `EngineMode: provisioned`.
* Topology: **1 writer + 2 readers** using **db.r5.2xlarge**.
* Spread instances across **3 AZs** in **us-east-1** (create SubnetGroup with three private subnets in three distinct AZs).
* Create a dedicated **Security Group** that allows inbound MySQL only from an “application tier” SG the template also creates (no 0.0.0.0/0).
* Enable **Performance Insights** with **7-day** retention.
* Enable **Aurora Backtrack** with **72-hour** retention; enable automated backups with **7-day** retention.
* Provide **reader endpoint** configuration: expose the **Aurora-specific reader endpoint** output for read traffic distribution.

2. **Parameter tuning (cluster-level)**

* Create an **AWS::RDS::DBClusterParameterGroup** for Aurora MySQL with:

  * `max_connections = 16000`
  * `innodb_buffer_pool_size = 75%` of instance memory
  * `query_cache_size = 268435456` (256MB, use bytes)
* Include any supporting parameters needed to make the above valid for the specified Aurora MySQL version; **do not apply parameters that are unsupported**—instead, document fallbacks inline with YAML comments and pick the nearest valid equivalents.

3. **Secrets & rotation**

* Store the master user password in **AWS Secrets Manager** (randomly generated).
* Enable **automatic rotation every 30 days** using a rotation Lambda and appropriate IAM roles/policies (all created in this template).
* Wire the secret into the cluster via `MasterUsername` and `MasterUserPassword` using `{{resolve:secretsmanager:...}}` syntax.

4. **Monitoring and alerting**

* Create **5 CloudWatch Alarms** with proactive thresholds:

  * **CPUUtilization > 80%** (over 5 minutes) for each DB instance.
  * **DatabaseConnections > 14000** (over 5 minutes) at the cluster level.
  * **ReadLatency > 0.2** seconds (200ms) at the instance level.
  * **WriteLatency > 0.2** seconds (200ms) at the instance level.
  * **AuroraReplicaLagMaximum > 1** second (1000ms) at the cluster level.
* Create an **SNS Topic** for notifications and an **email subscription** (parameterize the email). Point all alarms to this topic.

5. **Tagging and naming**

* Apply these **mandatory cost allocation tags** to **all** resources:

  * `Environment=Production`, `Team=Platform`, `Service=Trading`
* **All logical names and physical identifiers** (where allowed) must **suffix** with the **`EnvironmentSuffix`** parameter value (see “Constraints & conventions”).

6. **Resiliency, blue/green friendliness, and safe updates**

* Use **`DeletionPolicy: Snapshot`** and **`UpdateReplacePolicy: Snapshot`** on cluster and instances.
* Structure dependencies and references so updates prefer in-place changes; where replacement may be required, the policies above protect data.
* Include optional support for **RDS Blue/Green Deployments** if available for the chosen engine version (create the Blue/Green resource but gate it behind a parameter toggle with sane defaults).

# Constraints & conventions

* **File format:** pure **YAML** (no JSON). Use CloudFormation YAML intrinsic functions (`!Ref`, `!Sub`, `!GetAtt`, `!If`, etc.).
* **Environment suffix:** define a parameter `EnvironmentSuffix` with a **safe regex** (no hard AllowedValues). Example:

  * `AllowedPattern: '^[a-z0-9]+(-[a-z0-9]+)*$'`
  * `ConstraintDescription: 'Use lowercase letters, digits, and hyphens (kebab-case).'`
* **No hard-coded ARNs or IDs.** Every cross-resource reference must use `!Ref`/`!GetAtt`.
* **Region:** default to **us-east-1** where relevant; do not hard-code AZ names—discover with `Fn::GetAZs` and pick the first three.
* **Security:** no public subnets; block public access to the DB; least-privilege IAM for rotation Lambda and metrics/alarms.
* **Connection pooling:** add cluster-level parameters for connection handling as comments + settings where valid (e.g., thread handling) while ensuring engine compatibility.

# Deliverable

Return **only** the complete **TapStack.yml** contents, starting at the first line of YAML. Do **not** include explanations outside YAML. The template must include:

* **Metadata** with `cfn-lint` regional config.
* **Parameters** (including `EnvironmentSuffix`, `AlarmEmail`, VPC CIDR, DB name, username, backup/backtrack windows, etc.) with sane defaults and the regex constraint described above.
* **Mappings/Conditions** as needed for AZ selection and optional Blue/Green toggle.
* **Resources**:

  * VPC, three private subnets across three AZs, route tables, and a VPC endpoint set minimally required for Secrets Manager and CloudWatch (Interface endpoints).
  * Security Groups (DB and application tier SG).
  * RDS Subnet Group.
  * DB Cluster Parameter Group with required settings (see Technical requirements).
  * Secrets Manager secret + rotation Lambda + IAM roles/policies + rotation schedule (30 days).
  * Aurora DB Cluster with backtrack, backups, Performance Insights, KMS encryption enabled.
  * Three DB Instances (1 writer, 2 readers) of class `db.r5.2xlarge`, spread across the three subnets/AZs.
  * SNS Topic and Email Subscription.
  * Five CloudWatch Alarms (CPU, connections, read latency, write latency, replica lag) with correct **Dimensions** for cluster/instances.
  * Optional `AWS::RDS::BlueGreenDeployment` governed by a parameter toggle (default off) and documented with YAML comments.
* **Outputs** (all `Export`-ready), including:

  * `ClusterArn`, `ClusterIdentifier`, `WriterEndpoint`, `ReaderEndpoint`, `EngineVersion`
  * `DBInstanceArns` (list or individual), `SubnetGroupName`
  * `SecretArn`, `RotationEnabled`
  * `SnsTopicArn`
  * `AlarmArns` for each of the five alarms
  * `SecurityGroupIds` (DB and App), `VpcId`, `PrivateSubnetIds`

# Implementation notes (must follow)

* Every **Name** or identifier property that allows a string must include `"${EnvironmentSuffix}"` via `!Sub`.
* Alarms must reference the correct **RDS Aurora metrics** namespaces/dimensions:

  * Instances: `AWS/RDS` with `DBInstanceIdentifier`
  * Cluster-level: `AWS/RDS` with `DBClusterIdentifier`
* For parameters that may be **engine-incompatible** (e.g., `query_cache_size`, `innodb_buffer_pool_size`), include guardrails:

  * Prefer valid Aurora-specific parameters; if an exact parameter isn’t supported, include a **commented rationale** and set the closest valid alternative while keeping the requested intent (high-throughput OLTP).
* Use **KMS encryption** for the cluster and the Secrets Manager secret (create a CMK in the template with least-privilege key policy).
* Ensure **reader endpoint** is exported from the cluster outputs (the standard Aurora reader endpoint), and document the DNS in a YAML comment.
* Ensure **zero-downtime posture** via snapshot policies and instance distribution; readers should continue serving while writer updates occur.

# Quality gates

* Pass `cfn-lint` with region `us-east-1`.
* No hardcoded AZ names; use `Fn::GetAZs`.
* No hard **AllowedValues** for `EnvironmentSuffix`; enforce the **regex** constraint instead.
* All inter-resource references via `!Ref` and `!GetAtt`; no opaque strings.
* All resources carry the tags `Environment=Production`, `Team=Platform`, `Service=Trading`.
* Include `DeletionPolicy` and `UpdateReplacePolicy` where data loss is possible (at minimum on cluster, instances, secrets, and KMS key).

# Outputs (explicit list)

Provide Outputs for:

* `ClusterArn`, `ClusterIdentifier`, `WriterEndpoint`, `ReaderEndpoint`, `EngineVersion`
* `DBInstanceWriterArn`, `DBInstanceReader1Arn`, `DBInstanceReader2Arn`
* `SecretArn`, `RotationScheduleArn`
* `SnsTopicArn`
* `AlarmCpuArn`, `AlarmConnectionsArn`, `AlarmReadLatencyArn`, `AlarmWriteLatencyArn`, `AlarmReplicaLagArn`
* `VpcId`, `DbSecurityGroupId`, `AppSecurityGroupId`, `DbSubnetGroupName`, `PrivateSubnetIds`

# Style & formatting

* Human-authored tone, **no conversational opening**.
* Clear YAML comments explaining any unavoidable engine/version nuances.
* Consistent indentation (2 spaces), kebab-case for names, and `!Sub` for string interpolation with `EnvironmentSuffix`.

**Return only the TapStack.yml CloudFormation YAML, nothing else.**
