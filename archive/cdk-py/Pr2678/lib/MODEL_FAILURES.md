## **Model Failure Documentation Template**

###  Deprecated values and Synth failure
The model generated:

```python
billing_mode=dynamodb.BillingMode.ON_DEMAND
```

This value is deprecated/removed in the latest AWS CDK version, causing a deployment and synth error.

* CDK synthesis failed during `cdk synth` or `cdk deploy`.
* Potential delays in production deployment or CI/CD pipeline execution.


###  Resolution
Replace the deprecated value with:

```python
billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
```