# Failures

- **Unproven 15-minute rollback guarantee**  
  The response **asserts** rollback within 15 minutes but provides no concrete SLA-proof steps or measurements. Waiter usage in the rollback Lambda (`get_waiter('group_in_service')`) is unreliable/unsupported as shown and overall timing math (delays × attempts) is not proven to meet the 15-minute requirement in all failure scenarios.

- **Data integrity / "no loss" claim unsupported**  
  State snapshots only capture ASG configuration and basic metadata — **not** application data, DB snapshots, EBS volume snapshots, or transactional data. The design therefore **cannot guarantee no data loss** during rollback.

- **Least-privilege IAM not enforced**  
  Many IAM statements use `"Resource": "*"` (AutoScaling, EC2, CloudFormation, SNS, CloudWatch Logs). The policies therefore **do not satisfy least-privilege** requirements; scoped ARNs / conditions are missing.

- **Parameter Store secrecy requirements not met**  
  Parameters are created without consistently choosing `SecureString` for sensitive values. The prompt required secure parameter management; the code uses plain `String` by default for some parameters.

- **State storage lacks concurrency controls and consistency guarantees**  
  S3 is used for state snapshots, but there is **no locking, version-consistency validation, or concurrency control**, introducing race conditions during concurrent recovery operations.

- **Recovery of original instance parameters not guaranteed**  
  Rollback logic only updates ASG desired/min/max — it does not ensure reconstruction of original instance-specific parameters (EBS attachment state, ephemeral data, instance metadata), so original-instance fidelity is not guaranteed.

- **CloudWatch / Log configuration incomplete or inconsistent**  
  LogGroups are created but some alarms and dashboard widgets hardcode regions and metrics; retention/KMS usage and concrete alarm notification targets are inconsistent. Alarm thresholds/aggregation are not tuned or validated.

- **SNS subscription lifecycle not addressed**  
  Email subscription is created but there is no handling/documentation for required subscription confirmation or fallback notification channels.

- **Dangerous/naïve cleanup logic**  
  The cleanup Lambda deletes snapshots and volumes older than a cutoff without ownership/tag verification or dry-run safeguards — this is unsafe and could incur data loss or unexpected costs.

- **Resource scoping and production hygiene issues**  
  Uses default VPC and first two subnets for compute (not explicitly configurable), and bucket names/ARNS are not namespaced robustly — increases risk in multi-account/multi-stack deployments.

- **Operation edge-cases unhandled**  
  The orchestrator doesn't address terminated instances, partially replaced instances, or failures during ASG resize/update (no rollback-on-failure of the rollback itself).
