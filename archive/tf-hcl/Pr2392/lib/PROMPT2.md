> tap@0.1.0 tf:plan
> cd lib && terraform plan -lock=false -out=tfplan

╷
│ Error: Reference to undeclared input variable
│ 
│   on provider.tf line 19, in provider "aws":
│   19:   region = var.aws_region
│ 
│ An input variable with the name "aws_region" has not been declared. This
│ variable can be declared with a variable "aws_region" {} block.
╵
Error: Terraform exited with code 1.

seeing this in deploy stage