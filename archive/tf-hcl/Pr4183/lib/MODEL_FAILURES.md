1. Deployment failed because model wornlgy useed the inline code for the lambda fucntion which failed the deployemnt.

2. Deployment also failed because of the IAM role worng naming convention.

```
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 692, in resource "aws_lambda_function" "processor":
│  692:   inline_code = <<EOF
│ 
│ An argument named "inline_code" is not expected here.
╵
```
