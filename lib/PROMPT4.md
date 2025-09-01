Can you please provide the code snippet to fix below errors -
```
⚠️Terraform plan file not found, creating new plan and deploying...
╷
│ Error: expected delivery_frequency to be one of ["One_Hour" "Three_Hours" "Six_Hours" "Twelve_Hours" "TwentyFour_Hours"], got Daily
│ 
│   with aws_config_delivery_channel.primary,
│   on tap_stack.tf line 1581, in resource "aws_config_delivery_channel" "primary":
│ 1581:     delivery_frequency = "Daily"
│ 
╵
╷
│ Error: expected delivery_frequency to be one of ["One_Hour" "Three_Hours" "Six_Hours" "Twelve_Hours" "TwentyFour_Hours"], got Daily
│ 
│   with aws_config_delivery_channel.secondary,
│   on tap_stack.tf line 1594, in resource "aws_config_delivery_channel" "secondary":
│ 1594:     delivery_frequency = "Daily"
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
⚠️Direct apply with plan failed, trying without plan...
╷
│ Error: expected delivery_frequency to be one of ["One_Hour" "Three_Hours" "Six_Hours" "Twelve_Hours" "TwentyFour_Hours"], got Daily
│ 
│   with aws_config_delivery_channel.primary,
│   on tap_stack.tf line 1581, in resource "aws_config_delivery_channel" "primary":
│ 1581:     delivery_frequency = "Daily"
│ 
╵
╷
│ Error: expected delivery_frequency to be one of ["One_Hour" "Three_Hours" "Six_Hours" "Twelve_Hours" "TwentyFour_Hours"], got Daily
│ 
│   with aws_config_delivery_channel.secondary,
│   on tap_stack.tf line 1594, in resource "aws_config_delivery_channel" "secondary":
│ 1594:     delivery_frequency = "Daily"
│ 
╵
Error: Terraform exited with code 1.
All deployment attempts failed. Check for state lock issues.
```
