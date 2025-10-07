TapStackpr3701  aws_route_table_association.network_public-rt-association-1_4366BAFD: Creation complete after 1s [id=rtbassoc-073da11a72be5d036]
TapStackpr3701  ╷
                │ Warning: Argument is deprecated
                │ 
                │   with aws_iam_role.database_rds-monitoring-role_D71736F3 (database/rds-monitoring-role),
                │   on cdk.tf.json line 209, in resource.aws_iam_role.database_rds-monitoring-role_D71736F3 (database/rds-monitoring-role):
                │  209:         "managed_policy_arns": [
                │  210:           "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
                │  211:         ],
                │ 
                │ managed_policy_arns is deprecated. Use the aws_iam_role_policy_attachment
                │ resource instead. If Terraform should exclusively manage all managed policy
                │ attachments (the current behavior of this argument), use the
                │ aws_iam_role_policy_attachments_exclusive resource as well.
                │ 
                │ (and 2 more similar warnings elsewhere)
                ╵
TapStackpr3701  ╷
                │ Error: creating RDS DB Instance (tap-pr3701-db): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 7c7f3301-7ae5-4c14-8763-b5569b77dac8, api error InvalidParameterCombination: You can't specify IOPS or storage throughput for engine mysql and a storage size less than 400.
                │ 
                │   with aws_db_instance.database_rds-instance_A4A033CE (database/rds-instance),
                │   on cdk.tf.json line 157, in resource.aws_db_instance.database_rds-instance_A4A033CE (database/rds-instance):
                │  157:       }
                │ 
                ╵
TapStackpr3701  ╷