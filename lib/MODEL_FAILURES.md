1. Model had failures regarding the provider configuration regarding the variable declaration.

```

╷
│ Error: Reference to undeclared input variable
│ 
│   on provider.tf line 19, in provider "aws":
│   19:   region = var.aws_region
│ 
│ An input variable with the name "aws_region" has not been declared. This
│ variable can be declared with a variable "aws_region" {} block.
╵

```
