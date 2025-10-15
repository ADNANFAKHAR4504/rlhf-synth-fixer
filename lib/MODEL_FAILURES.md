TapStackpr4477  ╷
                │ Error: creating RDS DB Instance (tap-project-pr4477-db): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: deb1518d-06e5-4fa5-90d5-b935a2b81682, api error InvalidParameterCombination: The parameter group tap-project-pr4477-db-params with DBParameterGroupFamily postgres15 can't be used for this instance. Use a parameter group with DBParameterGroupFamily postgres17.
                │ 
                │   with aws_db_instance.rds_db-instance_9631E10E (rds/db-instance),
                │   on cdk.tf.json line 288, in resource.aws_db_instance.rds_db-instance_9631E10E (rds/db-instance):
                │  288:       }
                │ 
                ╵
TapStackpr4477  ::error::Terraform exited with code 1.
0 Stacks deploying     1 Stack done     0 Stacks waiting
Invoking Terraform CLI failed with exit code 1
Error: Process completed with exit code 1.