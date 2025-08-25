# Fix Terraform Configuration Issues

I'm trying to deploy a serverless web application using Terraform, but I'm running into some errors. The deployment is failing with "Unsupported argument" errors and I need help fixing them.

Here's the error I'm seeing:

```
Error: Unsupported argument
     │
     │   on tap_stack.tf line 285, in resource "aws_api_gateway_method_response" "hello_get_200":
     │  285:   response_headers = {
     │
     │ An argument named "response_headers" is not expected here.
     ╵
```

It looks like I'm using the wrong argument name for the API Gateway method response configuration. I suspect there might be other similar issues throughout the configuration.

Can you help me fix all the unsupported argument issues in the Terraform code? I want to make sure the configuration follows the correct Terraform syntax and uses the proper argument names for all AWS resources.

Thanks!