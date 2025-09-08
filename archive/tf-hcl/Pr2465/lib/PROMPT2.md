I am getting the error. The lambda should have been inline
```
│ Error: Invalid function argument
│ 
│   on tap_stack.tf line 192, in data "archive_file" "lambda_zip":
│  192:     content = templatefile("${path.module}/lambda_function.js", {
│  193:       table_name = aws_dynamodb_table.main_table.name
│  194:     })
│     ├────────────────
│     │ while calling templatefile(path, vars)
│     │ path.module is "."
```