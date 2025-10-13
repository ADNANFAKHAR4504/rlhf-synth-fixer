TapStackpr4196  ╷
                │ Warning: Invalid Attribute Combination
                │ 
                │   with aws_s3_bucket_lifecycle_configuration.audit-trail_audit-bucket_lifecycle_141D812D (audit-trail/audit-bucket/lifecycle),
                │   on cdk.tf.json line 945, in resource.aws_s3_bucket_lifecycle_configuration.audit-trail_audit-bucket_lifecycle_141D812D (audit-trail/audit-bucket/lifecycle).rule:
                │  945:           {
                │  946:             "expiration": {
                │  947:               "days": 90
                │  948:             },
TapStackpr4196  │  949:             "id": "expire-old-logs",
                │  950:             "status": "Enabled",
                │  951:             "transition": [
                │  952:               {
                │  953:                 "days": 30,
                │  954:                 "storage_class": "STANDARD_IA"
                │  955:               },
                │  956:               {
                │  957:                 "days": 60,
                │  958:                 "storage_class": "GLACIER"
                │  959:               }
                │  960:             ]
                │  961:           }
                │ 
                │ No attribute specified when one (and only one) of
                │ [rule[0].filter,rule[0].prefix] is required
                │ 
                │ This will be an error in a future version of the provider
                │ 
                │ (and one more similar warning elsewhere)
                ╵
                ╷
                │ Error: only lowercase alphanumeric characters, hyphens, underscores, periods, and spaces allowed in "name"
                │ 
                │   with aws_db_subnet_group.main-vpc_db-subnet-group_D9EB4817 (main-vpc/db-subnet-group),
                │   on cdk.tf.json line 372, in resource.aws_db_subnet_group.main-vpc_db-subnet-group_D9EB4817 (main-vpc/db-subnet-group):
                │  372:         "name": "TapStackpr4196-pr4196-vpc-db-subnet-group",
                │ 
                ╵
TapStackpr4196  ╷
                │ Error: Extraneous JSON object property
                │ 
                │   on cdk.tf.json line 1001, in resource.aws_s3_bucket_lifecycle_configuration.public-s3_lifecycle_5C6BE8CD (public-s3/lifecycle).rule[0].noncurrent_version_expiration:
                │ 1001:               "days": 90
                │ 
                │ No argument or block type is named "days".
                ╵
                ╷
                │ Error: Missing required argument
                │ 
                │   on cdk.tf.json line 1002, in resource.aws_s3_bucket_lifecycle_configuration.public-s3_lifecycle_5C6BE8CD (public-s3/lifecycle).rule[0].noncurrent_version_expiration:
                │ 1002:             },
                │ 
                │ The argument "noncurrent_days" is required, but no definition was found.
                ╵
TapStackpr4196  ::error::Terraform exited with code 1.
0 Stacks deploying     1 Stack done     0 Stacks waiting
Invoking Terraform CLI failed with exit code 1
Error: Process completed with exit code 1.