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

╷
                │ Error: only lowercase alphanumeric characters and hyphens allowed in "identifier"
                │ 
                │   with aws_db_instance.main-rds_instance_2D733CBC (main-rds/instance),
                │   on cdk.tf.json line 343, in resource.aws_db_instance.main-rds_instance_2D733CBC (main-rds/instance):
                │  343:         "identifier": "TapStackpr4196-pr4196-db",
                │ 
                ╵
TapStackpr4196  ╷
                │ Error: first character of "identifier" must be a letter
                │ 
                │   with aws_db_instance.main-rds_instance_2D733CBC (main-rds/instance),
                │   on cdk.tf.json line 343, in resource.aws_db_instance.main-rds_instance_2D733CBC (main-rds/instance):
                │  343:         "identifier": "TapStackpr4196-pr4196-db",
                │ 
                ╵
TapStackpr4196  ╷
TapStackpr4196  │ Error: Extraneous JSON object property
                │ 
                │   on cdk.tf.json line 1007, in resource.aws_s3_bucket_lifecycle_configuration.public-s3_lifecycle_5C6BE8CD (public-s3/lifecycle).rule[0].noncurrent_version_expiration:
                │ 1007:               "noncurrentDays": 90
                │ 
                │ No argument or block type is named "noncurrentDays". Did you mean
                │ "noncurrent_days"?
                ╵
TapStackpr4196  ╷
                │ Error: Missing required argument
                │ 
                │   on cdk.tf.json line 1008, in resource.aws_s3_bucket_lifecycle_configuration.public-s3_lifecycle_5C6BE8CD (public-s3/lifecycle).rule[0].noncurrent_version_expiration:
                │ 1008:             },
                │ 
                │ The argument "noncurrent_days" is required, but no definition was found.
                ╵
TapStackpr4196  ::error::Terraform exited with code 1.
Invoking Terraform CLI failed with exit code 1
0 Stacks deploying     1 Stack done     0 Stacks waiting
Error: Process completed with exit code 1.

TapStackpr4196  aws_route.main-vpc_private-route-1_9190DFC9: Creation complete after 1s [id=r-rtb-0d41d8fff7c61fb031080289494]
TapStackpr4196  ╷
                │ Error: "kms_key_id" (5b8fbce3-9589-44b7-9cca-c59dcacbe130) is an invalid ARN: arn: invalid prefix
                │ 
                │   with aws_db_instance.main-rds_instance_2D733CBC (main-rds/instance),
                │   on cdk.tf.json line 328, in resource.aws_db_instance.main-rds_instance_2D733CBC (main-rds/instance):
                │  328:         "kms_key_id": "${aws_kms_key.main-kms_key_0BE179F2 (main-kms/key).key_id}",
                │ 
                ╵
TapStackpr4196  ╷
                │ Error: creating IAM Role (TapStackpr4196-pr4196-cloudtrail-role): operation error IAM: CreateRole, https response error StatusCode: 400, RequestID: 6e292395-bfb0-4ea0-af63-4338618c8750, InvalidInput: Duplicate tag keys found. Please note that Tag keys are case insensitive.
                │ 
                │   with aws_iam_role.audit-trail_trail-role_8CF661E1 (audit-trail/trail-role/role),
                │   on cdk.tf.json line 455, in resource.aws_iam_role.audit-trail_trail-role_8CF661E1 (audit-trail/trail-role/role):
                │  455:       },
                │ 
                ╵
TapStackpr4196  ╷
                │ Error: creating IAM Role (TapStackpr4196-pr4196-ec2-role): operation error IAM: CreateRole, https response error StatusCode: 400, RequestID: c04b1abb-0191-428b-ac67-b6688404afcd, InvalidInput: Duplicate tag keys found. Please note that Tag keys are case insensitive.
                │ 
                │   with aws_iam_role.ec2-role_3F52732E (ec2-role/role),
                │   on cdk.tf.json line 472, in resource.aws_iam_role.ec2-role_3F52732E (ec2-role/role):
                │  472:       }
                │ 
                ╵
TapStackpr4196  ::error::Terraform exited with code 1.


0 Stacks deploying     1 Stack done     0 Stacks waiting
Invoking Terraform CLI failed with exit code 1
Error: Process completed with exit code 1.

TapStackpr4196  ╷
                │ Error: creating CloudTrail Trail (TapStackpr4196-pr4196): operation error CloudTrail: CreateTrail, https response error StatusCode: 400, RequestID: e0042425-6942-4d72-95b7-f5813de76fb3, InsufficientS3BucketPolicyException: Incorrect S3 bucket policy is detected for bucket: tapstackpr4196-pr4196-audit-logs
                │ 
                │   with aws_cloudtrail.audit-trail_8AEAD1CA (audit-trail/trail),
                │   on cdk.tf.json line 240, in resource.aws_cloudtrail.audit-trail_8AEAD1CA (audit-trail/trail):
                │  240:       }
                │ 
                ╵
TapStackpr4196  ╷