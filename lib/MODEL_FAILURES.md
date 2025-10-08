TapStackpr3795  ╷
                │ Error: "kms_key_id" (alias/aws/rds) is an invalid ARN: arn: invalid prefix
                │ 
                │   with aws_db_instance.database-module_mysql-instance_594897D7 (database-module/mysql-instance),
                │   on cdk.tf.json line 139, in resource.aws_db_instance.database-module_mysql-instance_594897D7 (database-module/mysql-instance):
                │  139:         "kms_key_id": "alias/aws/rds",
                │ 
                ╵
TapStackpr3795  ::error::Terraform exited with code 1.
Invoking Terraform CLI failed with exit code 1
0 Stacks deploying     1 Stack done     0 Stacks waiting

Error: 025-10-08T07:19:28.091] [ERROR] default - (node:2601) [DEP0044] DeprecationWarning: The `util.isArray` API is deprecated. Please use `Array.isArray()` instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
TapStackpr3795  Initializing the backend...
TapStackpr3795  
                Successfully configured the backend "s3"! Terraform will automatically
                use this backend unless the backend configuration changes.
TapStackpr3795  ╷
                │ Error: Terraform encountered problems during initialisation, including problems
                │ with the configuration, described below.
                │ 
                │ The Terraform configuration must be valid before initialization so that
                │ Terraform can determine which modules and providers need to be installed.
                │ 
                │ 
                ╵
TapStackpr3795  ╷
                │ Error: Missing required argument
                │ 
                │   on cdk.tf.json line 41, in output.app-logs-s3-bucket:
                │   41:     },
                │ 
                │ The argument "value" is required, but no definition was found.
                ╵
TapStackpr3795  ::error::Terraform exited with code 1.
Error: terraform init failed with exit code 1
0 Stacks deploying     0 Stacks done     1 Stack waiting
Error: Process completed with exit code 1.