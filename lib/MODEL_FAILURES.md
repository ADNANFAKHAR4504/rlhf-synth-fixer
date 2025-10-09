1. Deployment failed with the genearted resposne by model as it used wrong data source in cloudtrail.

2. Deployment failed because it used wrong parameter in ALB creation.

```
│ Error: expected event_selector.0.data_resource.1.type to be one of ["AWS::DynamoDB::Table" "AWS::Lambda::Function" "AWS::S3::Object"], got AWS::RDS::DBCluster
│ 
│   with aws_cloudtrail.main,
│   on tap_stack.tf line 1036, in resource "aws_cloudtrail" "main":
│ 1036:       type   = "AWS::RDS::DBCluster"
│ 
╵
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1198, in resource "aws_lb" "main":
│ 1198:   enable_drop_invalid_header_fields = true
│ 
│ An argument named "enable_drop_invalid_header_fields" is not expected here.
```

```

╷
│ Error: expected event_selector.0.data_resource.1.type to be one of ["AWS::DynamoDB::Table" "AWS::Lambda::Function" "AWS::S3::Object"], got AWS::RDS::DBCluster
│ 
│   with aws_cloudtrail.main,
│   on tap_stack.tf line 1036, in resource "aws_cloudtrail" "main":
│ 1036:       type   = "AWS::RDS::DBCluster"
│ 
╵
Error: Terraform exited with code 1.

```
