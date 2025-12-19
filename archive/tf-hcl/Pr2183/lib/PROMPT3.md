This is the error I encountered after applying your latest update:  
```error
╷

│ Error: creating RDS DB Instance (webapp-staging-database): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: df4356f3-9961-47fa-b610-18d5c5a776c1, api error InvalidParameterCombination: Cannot find version 8.0.35 for mysql

│

│ with module.database.aws_db_instance.main,

│ on modules/database_module/database.tf line 61, in resource "aws_db_instance" "main":

│ 61: resource "aws_db_instance" "main" {

│

╵
```

Your task is to:  
1. Figure out what's causing the error.  
2. Explain why Terraform can't find MySQL version `8.0.35`.  
3. Suggest a valid MySQL version that actually works with RDS service  
4. Update and fix the Terraform code for the database module
