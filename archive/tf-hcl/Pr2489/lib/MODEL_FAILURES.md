Below were the model failures -

1. Model was not able to generate the full response in single Turn. So had to genertae multiple turns.
2. Error realted to the database configuration. Error as below
```
╷
│ Error: creating RDS DB Instance (tap-primary-us-east-2-database): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 7b68c8f5-20d1-4ed1-8298-a9ee15486ae8, api error InvalidParameterCombination: Performance Insights not supported for this configuration.
│ 
│   with aws_db_instance.primary,
│   on tap_stack.tf line 927, in resource "aws_db_instance" "primary":
│  927: resource "aws_db_instance" "primary" {
│ 
╵
Error: Terraform exited with code 1.
random_string.db_username: Refreshing s

``` 
