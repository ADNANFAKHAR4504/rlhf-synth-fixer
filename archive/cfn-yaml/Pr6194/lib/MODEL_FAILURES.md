# model_failure

## What could go wrong

* **Secrets transform capability missing**
  Using `HostedRotationLambda` without **`CAPABILITY_AUTO_EXPAND`** or without the **`Transform: AWS::SecretsManager-YYYY-MM-DD`** header leads to deployment failure.

* **Secret name invalid or colliding**
  Using `${AWS::StackId}` raw (contains `:`) or reusing a name scheduled for deletion causes Secrets Manager errors.
  **Mitigation:** derive a **GUID tail** from `StackId` and keep path-safe characters only.

* **Unsupported database parameters**
  Aurora MySQL 5.7 rejects certain MySQL parameters (e.g., query cache, buffer pool size formatting, some InnoDB commit knobs).
  **Mitigation:** set `query_cache_size=0`; rely on Aurora auto-sizing for `innodb_buffer_pool_size`; apply only **modifiable** parameters at the correct scope (instance vs cluster).

* **Missing required capabilities**
  Deploying without **`CAPABILITY_NAMED_IAM`** (for hosted rotation’s managed IAM) produces change set errors.
  **Mitigation:** include both **`CAPABILITY_NAMED_IAM`** and **`CAPABILITY_AUTO_EXPAND`**.

* **Alarms bound to wrong dimensions**
  Binding latency/connection alarms to `DBClusterIdentifier` where `DBInstanceIdentifier` is expected (or vice versa) prevents metrics from evaluating.
  **Mitigation:** use **writer instance** for CPU/Connections/Latency and **cluster identifier** for replica lag.

* **Rotation in private subnets failing**
  Hosted rotation needs to talk to Secrets Manager and CloudWatch Logs. Without **interface endpoints** or egress, rotation fails.
  **Mitigation:** create **`com.amazonaws.${Region}.secretsmanager`** and **`com.amazonaws.${Region}.logs`** interface endpoints and attach the rotation Lambda to private subnets and a dedicated SG.

* **Email alarms never arrive**
  SNS subscriptions require **email confirmation**.
  **Mitigation:** confirm the subscription before relying on alarms.

* **Quota and AZ mismatches**
  Insufficient RDS instance quotas or regions lacking three AZs for the chosen instance class will fail deployments.
  **Mitigation:** verify quotas and AZ availability; adjust instance class or request quota increases.

* **Data protection during updates**
  Replacement of stateful resources without snapshot policies risks data loss.
  **Mitigation:** ensure **`DeletionPolicy/UpdateReplacePolicy = Snapshot`** on the cluster and instances.

## How the final template prevents these failures

* Declares **Secrets Manager transform** and documents the required capabilities.
* Uses a **valid, unique secret name** derived from the **StackId GUID tail**.
* Constrains parameters to those **supported** and **modifiable** on Aurora MySQL 5.7.
* Binds alarms to correct **dimensions** (writer instance vs cluster).
* Adds **interface VPC endpoints** for rotation to function within private subnets.
* Applies **snapshot policies** for safe rollbacks.
* Enforces **safe naming** of all resources via **`EnvironmentSuffix`** regex rather than brittle enumerations.
