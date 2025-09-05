Error is still persistent

╷
│ Error: Invalid data source
│ 
│   on secure_infrastructure_setup.tf line 392, in data "aws_config_configuration_recorder" "existing":
│  392: data "aws_config_configuration_recorder" "existing" {
│ 
│ The provider hashicorp/aws does not support data source
│ "aws_config_configuration_recorder".
│ 
│ Did you intend to use the managed resource type
│ "aws_config_configuration_recorder"? If so, declare this using a "resource"
│ block instead of a "data" block.
╵
╷
│ Error: Invalid data source
│ 
│   on secure_infrastructure_setup.tf line 397, in data "aws_config_delivery_channel" "existing":
│  397: data "aws_config_delivery_channel" "existing" {
│ 
│ The provider hashicorp/aws does not support data source
│ "aws_config_delivery_channel".
│ 
│ Did you intend to use the managed resource type
│ "aws_config_delivery_channel"? If so, declare this using a "resource" block
│ instead of a "data" block.
╵
Error: Terraform exited with code 1.
Plan creation failed, attempting direct apply...
╷
│ Error: Failed to load "tfplan" as a plan file
│ 
│ Error: stat tfplan: no such file or directory
╵
Error: Terraform exited with code 1.
╷
│ Error: Invalid data source
│ 
│   on secure_infrastructure_setup.tf line 392, in data "aws_config_configuration_recorder" "existing":
│  392: data "aws_config_configuration_recorder" "existing" {
│ 
│ The provider hashicorp/aws does not support data source
│ "aws_config_configuration_recorder".
│ 
│ Did you intend to use the managed resource type
│ "aws_config_configuration_recorder"? If so, declare this using a "resource"
│ block instead of a "data" block.
╵
╷
│ Error: Invalid data source
│ 
│   on secure_infrastructure_setup.tf line 397, in data "aws_config_delivery_channel" "existing":
│  397: data "aws_config_delivery_channel" "existing" {
│ 
│ The provider hashicorp/aws does not support data source
│ "aws_config_delivery_channel".
│ 
│ Did you intend to use the managed resource type
│ "aws_config_delivery_channel"? If so, declare this using a "resource" block
│ instead of a "data" block.
╵
Error: Terraform exited with code 1.

fix the error and ensure it addresses it