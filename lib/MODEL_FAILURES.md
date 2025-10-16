 - Obtained hashicorp/aws checksums for linux_amd64; All checksums for this platform were already tracked in the lock file
                Success! Terraform has validated the lock file and found no need for changes.
TapStackpr4595  ╷
                │ Warning: Invalid Attribute Combination
                │ 
                │   with aws_s3_bucket_lifecycle_configuration.public-s3_lifecycle_5C6BE8CD (public-s3/lifecycle),
                │   on cdk.tf.json line 753, in resource.aws_s3_bucket_lifecycle_configuration.public-s3_lifecycle_5C6BE8CD (public-s3/lifecycle).rule:
                │  753:           {
                │  754:             "expiration": [
                │  755:               {
                │  756:                 "days": 90
                │  757:               }
                │  758:             ],
                │  759:             "id": "expire-old-versions",
                │  760:             "status": "Enabled"
                │  761:           }
                │ 
                │ No attribute specified when one (and only one) of
                │ [rule[0].filter,rule[0].prefix] is required
                │ 
                │ This will be an error in a future version of the provider
                ╵
TapStackpr4595  ╷
                │ Error: only lowercase alphanumeric characters, hyphens, underscores, periods, and spaces allowed in "name"
                │ 
                │   with aws_db_subnet_group.rds_subnet-group_347D738E (rds/subnet-group),
                │   on cdk.tf.json line 189, in resource.aws_db_subnet_group.rds_subnet-group_347D738E (rds/subnet-group):
                │  189:         "name": "TapStackpr4595-pr4595-db-subnet-group",
                │ 
                ╵
TapStackpr4595  ╷
                │ Error: Reference to undeclared resource
                │ 
                │   on cdk.tf.json line 868, in resource.aws_secretsmanager_secret_version.rds_secret-version_EB489C47 (rds/secret-version):
                │  868:         "secret_string": "{\"username\":\"dbadmin\",\"password\":\"${random_password.db.result}\",\"engine\":\"postgres\",\"host\":\"${aws_db_instance.main.endpoint}\",\"port\":5432,\"dbname\":\"appdb\"}"
                │ 
                │ A managed resource "random_password" "db" has not been declared in the root
                │ module.
                ╵
TapStackpr4595  ╷
                │ Error: Reference to undeclared resource
                │ 
                │   on cdk.tf.json line 868, in resource.aws_secretsmanager_secret_version.rds_secret-version_EB489C47 (rds/secret-version):
                │  868:         "secret_string": "{\"username\":\"dbadmin\",\"password\":\"${random_password.db.result}\",\"engine\":\"postgres\",\"host\":\"${aws_db_instance.main.endpoint}\",\"port\":5432,\"dbname\":\"appdb\"}"
                │ 
                │ A managed resource "aws_db_instance" "main" has not been declared in the
                │ root module.
                ╵
TapStackpr4595  ::error::Terraform exited with code 1.
0 Stacks deploying     1 Stack done     0 Stacks waiting
Invoking Terraform CLI failed with exit code 1
Error: Process completed with exit code 1.