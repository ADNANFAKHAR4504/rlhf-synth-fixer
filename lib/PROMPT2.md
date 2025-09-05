## Issue Description

Hi, AWS cloud infrastructure engineer expert, following our previous conversation I see that the execution of the code failed at synth with this error:

```
master_key=sns.Alias.from_alias_name(
AttributeError: module 'aws_cdk.aws_sns' has no attribute 'Alias'.
```

## Root Cause
It simply means the model is referencing the KMS key wrongly.


Kindly correct this error.