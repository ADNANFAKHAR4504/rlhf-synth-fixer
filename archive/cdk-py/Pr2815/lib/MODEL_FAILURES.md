### Model Failures


## Synth Error
- There is a synth error indicates that sns.Alias doesn't exist. Which means the KMS keys for SNS topics was not referenced properly.# Lambda Module Import Failure


## Deployment Test  Error
When i checked the cloudwatch logs it indicated that the Lambda can't find the code file it's looking for:  
`Unable to import module 'lambda_function': No module named 'lambda_function'`

### The Problem
The model asked Lambda to look for a file, but deployed inline code instead:
```python
handler="lambda_function.lambda_handler"
code=_lambda.Code.from_inline(...)
```

### Impact
Function fails on every request and it never runs.
