*** Flaw 1 ***
│ Error: Terraform encountered problems during initialisation, including problems
│ with the configuration, described below.
│ 
│ The Terraform configuration must be valid before initialization so that
│ Terraform can determine which modules and providers need to be installed.
│ 
│ 
╵
╷
│ Error: Unterminated object constructor expression
│ 
│   on tap_stack.tf line 140, in output "vpc_ids":
│  140:   value = {
│ 
│ There is no corresponding closing brace before the end of the file. This may be caused by incorrect brace nesting elsewhere in this
│ file.