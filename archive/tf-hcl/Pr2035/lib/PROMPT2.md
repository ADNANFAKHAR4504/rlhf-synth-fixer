I am getting the error Invalid value for "path" parameter: no file exists at "./user-data.sh"; File when running terraform plan, can we fix this? Below is the full error
```
╷
│ Error: Invalid function argument
│ 
│   on tap_stack.tf line 474, in resource "aws_launch_template" "primary":
│  474:   user_data = base64encode(templatefile("${path.module}/user-data.sh", {
│  475:     region = local.regions.primary
│  476:   }))
│     ├────────────────
│     │ while calling templatefile(path, vars)
│     │ path.module is "."
│ 
│ Invalid value for "path" parameter: no file exists at "./user-data.sh";
│ this function works only with files that are distributed as part of the
│ configuration source code, so if this file will be created by a resource in
│ this configuration you must instead obtain this result from an attribute of
│ that resource.
╵
╷
│ Error: Invalid function argument
│ 
│   on tap_stack.tf line 504, in resource "aws_launch_template" "secondary":
│  504:   user_data = base64encode(templatefile("${path.module}/user-data.sh", {
│  505:     region = local.regions.secondary
│  506:   }))
│     ├────────────────
│     │ while calling templatefile(path, vars)
│     │ path.module is "."
│ 
│ Invalid value for "path" parameter: no file exists at "./user-data.sh";
│ this function works only with files that are distributed as part of the
│ configuration source code, so if this file will be created by a resource in
│ this configuration you must instead obtain this result from an attribute of
│ that resource.
```