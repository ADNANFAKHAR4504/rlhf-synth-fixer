1. Error 1: filebase64sha256 failed (lambda_placeholder.zip missing)
Problem: Terraform can't find or open the file you referenced for the Lambda code hash.

How to Fix
Option 1: Add the file

Ensure lambda_placeholder.zip is present in your project root or ${path.module} directory. This zip must contain your Lambda handler and dependencies.

This Terraform error means Terraform could not find the file named lambda_placeholder.zip in the directory referenced by ${path.module}, which in your case is "." (the current directory where you are running terraform apply).

What this error means
The aws_lambda_function resource expects a zipped file for Lambda code (referenced for deployment and for computing the source_code_hash to track updates).

Common causes
The .zip file is missing—the file was never built, renamed, or checked in.

You may be using a placeholder or "dummy" zip reference, but didn't create or place a file in your working directory.

If using CI, the build step to bundle or copy the Lambda zip did not run or failed.

How to Fix
Option 1: Add the file
Ensure your deployment folder (where you're running terraform apply) contains lambda_placeholder.zip.

The file must be a valid zip archive, usually containing your Lambda code (handler, Node.js .js/py/etc files, and dependencies).

Option 2: Automate file generation
In your workflow or Makefile/script, add:

```
zip lambda_placeholder.zip index.js   # replace with your handler and dependency files
```

If you're using a deployment framework (e.g., SAM, Serverless, CDK), make sure the zip is created and copied to the correct directory before running terraform plan/apply.

Option 3: Inline Code (advanced)
If purposely running as a placeholder but don't need real Lambda code yet, you can create an empty zip:
```
echo "exports.handler = async ()=>{};" > index.js
zip lambda_placeholder.zip index.js
```
Or use filename with data.archive_file to generate a zip dynamically, then reference that file.

```
╷
│ Error: Error in function call
│ 
│   on tap_stack.tf line 757, in resource "aws_lambda_function" "data_replay":
│  757:   source_code_hash = filebase64sha256("${path.module}/lambda_placeholder.zip")
│     ├────────────────
│     │ while calling filebase64sha256(path)
│     │ path.module is "."
│ 
│ Call to function "filebase64sha256" failed: open lambda_placeholder.zip: no
│ such file or directory.
```

Error 2 and 3: Invalid resource type aws_lambda_function_code
Problem: Terraform AWS provider does not support aws_lambda_function_code. You tried to create resources of an unsupported type.

Why?
In the official AWS provider for Terraform (hashicorp/aws), the only resource type defined for Lambda deployment is:

resource "aws_lambda_function" "..." { ... }

There is no resource type called aws_lambda_function_code. You cannot create or reference it in your Terraform code.

aws_lambda_function_code is neither available nor deprecated—it simply never existed.

Possible Causes
You might have confused this with aws_lambda_function's code argument block, or with other frameworks (CDK, CloudFormation, or other providers which separate function config and code).

You may have found sample code or a plugin from non-standard modules/documentation.

Copied or auto-generated code that refers to aws_lambda_function_code (which is not valid in Terraform AWS provider context).


```
╷
│ Error: Invalid resource type
│ 
│   on tap_stack.tf line 770, in resource "aws_lambda_function_code" "device_verification":
│  770: resource "aws_lambda_function_code" "device_verification" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_function_code".
╵
╷
│ Error: Invalid resource type
│ 
│   on tap_stack.tf line 855, in resource "aws_lambda_function_code" "data_replay":
│  855: resource "aws_lambda_function_code" "data_replay" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_function_code".
╵
Error: Terraform exited with code 1.

```

Summary of Fixes -
All references to aws_lambda_function_code resources must be removed and replaced with valid aws_lambda_function blocks using either zip_file or filename/source_code_hash.

If referencing zip files, ensure they exist in your Terraform module directory.

