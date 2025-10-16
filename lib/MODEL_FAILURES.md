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

TapStackpr4595  ╷
                │ Error: creating EC2 Instance: operation error EC2: RunInstances, https response error StatusCode: 400, RequestID: 7e985743-013f-4c37-8292-1fb565e318f4, api error InvalidParameterValue: Value (TapStackpr4595-pr4595-ec2-role) for parameter iamInstanceProfile.name is invalid. Invalid IAM Instance Profile name
                │ 
                │   with aws_instance.private-instance (private-instance),
                │   on cdk.tf.json line 303, in resource.aws_instance.private-instance (private-instance):
                │  303:       },
                │ 
                ╵
TapStackpr4595  ╷
                │ Error: creating EC2 Instance: operation error EC2: RunInstances, https response error StatusCode: 400, RequestID: 44e694c0-3123-4f7f-b932-1fb5cd9d5544, api error InvalidParameterValue: Value (TapStackpr4595-pr4595-ec2-role) for parameter iamInstanceProfile.name is invalid. Invalid IAM Instance Profile name
                │ 
                │   with aws_instance.public-instance (public-instance),
                │   on cdk.tf.json line 328, in resource.aws_instance.public-instance (public-instance):
                │  328:       }
                │ 
                ╵
TapStackpr4595  ╷
                │ Error: creating S3 Bucket (TapStackpr4595-pr4595-private-data): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: QHD0RBSYJPZS6AT5, HostID: DK7AjwfzEjjh7aiH3Dbsz+th4+qw5MbyWYe7sz6EqPSfcQEf959kSiSw79+pDE3efukR6YpsM7fZ4h02+E6NFE70+WoN7dIC, api error InvalidBucketName: The specified bucket is not valid.
                │ 
                │   with aws_s3_bucket.private-s3_bucket_AF265DE0 (private-s3/bucket),
                │   on cdk.tf.json line 730, in resource.aws_s3_bucket.private-s3_bucket_AF265DE0 (private-s3/bucket):
                │  730:       },
                │ 
                ╵
TapStackpr4595  ╷
                │ Error: creating S3 Bucket (TapStackpr4595-pr4595-public-assets): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: QHD4QJHS5EHPBQTX, HostID: xfUfiXfLp4MIhDPHpWMQi35/Jeux/nha3ihQqhP7i9YgNvYMfWUTHHeb/1ikhHr5chCoVMGNhnZCEv9ZX+fl6AkANTFKZWdi, api error InvalidBucketName: The specified bucket is not valid.
                │ 
                │   with aws_s3_bucket.public-s3_bucket_28D4DA36 (public-s3/bucket),
                │   on cdk.tf.json line 745, in resource.aws_s3_bucket.public-s3_bucket_28D4DA36 (public-s3/bucket):
                │  745:       }
                │ 
                ╵
TapStackpr4595  ::error::Terraform exited with code 1.
Invoking Terraform CLI failed with exit code 1
0 Stacks deploying     1 Stack done     0 Stacks waiting
Error: Process completed with exit code 1.