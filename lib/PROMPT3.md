I am having this  error now

> tap@0.1.0 tf:plan
> cd lib && terraform plan -lock=false -out=tfplan

╷
│ Error: Invalid reference
│ 
│   on tap_stack.tf line 62, in locals:
│   62:                 <p>Region: <span class="region">${region}</span></p>
│ 
│ A reference to a resource type must be followed by at least one attribute
│ access, specifying the resource name.
╵
Error: Terraform exited with code 1.