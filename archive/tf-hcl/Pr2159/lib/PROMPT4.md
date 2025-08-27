Getting below RDS DB related error , please provide the fixed code snippet
```

│ Error: creating RDS DB Instance (read replica) (tap-stack-postgres-replica): operation error RDS: CreateDBInstanceReadReplica, https response error StatusCode: 400, RequestID: 5541c5b3-d2db-4aef-8807-83660177c6ee, api error InvalidParameterCombination: Cannot create a cross region unencrypted read replica from encrypted source.
│ 
│   with aws_db_instance.secondary,
│   on tap_stack.tf line 1319, in resource "aws_db_instance" "secondary":
│ 1319: resource "aws_db_instance" "secondary" {
│ 
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.
```
