│ Error: Invalid reference
│ 
│   on main.tf line 462, in resource "aws_launch_template" "main":
│  462:       console.log(`Server running on port ${port}`);
│ 
│ A reference to a resource type must be followed by at least one attribute
│ access, specifying the resource name.
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
│ Error: Invalid reference
│ 
│   on main.tf line 462, in resource "aws_launch_template" "main":
│  462:       console.log(`Server running on port ${port}`);
│ 
│ A reference to a resource type must be followed by at least one attribute
│ access, specifying the resource name.
╵