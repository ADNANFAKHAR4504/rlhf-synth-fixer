1. Model had failures wrt to the wrong use of upper characters in the subnet group name which is not allowed.

2. Model had failures wrt RDS cluster being wrongly used as the events selector for cloudtrails which is not allowed again.


```
⚠️ Terraform plan file not found, creating new plan and deploying...
╷
│ Error: expected event_selector.1.data_resource.0.type to be one of ["AWS::DynamoDB::Table" "AWS::Lambda::Function" "AWS::S3::Object"], got AWS::RDS::DBCluster
│ 
│   with aws_cloudtrail.main,
│   on tap_stack.tf line 919, in resource "aws_cloudtrail" "main":
│  919:       type   = "AWS::RDS::DBCluster"
│ 
╵
Error: Terraform exited with code 1.
Plan creation failed, attempting direct apply...
╷
│ Error: Failed to load "tfplan" as a plan file
│ 
│ Error: stat tfplan: no such file or directory
╵
Error: Terraform exited with code 1.
⚠️ Direct apply with plan failed, trying without plan...
╷
│ Error: expected event_selector.1.data_resource.0.type to be one of ["AWS::DynamoDB::Table" "AWS::Lambda::Function" "AWS::S3::Object"], got AWS::RDS::DBCluster
│ 
│   with aws_cloudtrail.main,
│   on tap_stack.tf line 919, in resource "aws_cloudtrail" "main":
│  919:       type   = "AWS::RDS::DBCluster"
│ 
╵
Error: Terraform exited with code 1.
❌ All deployment attempts failed. Check for state lock issues.

```
