# MODEL FAILURES

---

## 1. Lambda Dead Letter Config - Nil Configuration Error

**Model Response:**
MODEL_RESPONSE.md:563-565 - Included deadLetterConfig with empty targetArn:
```java
.deadLetterConfig(LambdaFunctionDeadLetterConfig.builder()
    .targetArn("") // Add DLQ ARN if needed
    .build())
```

**Actual Implementation:**
LambdaConstruct.java:106-125 - **Completely removed deadLetterConfig** from Lambda function configuration:
```java
this.function = new LambdaFunction(this, "log-processor", LambdaFunctionConfig.builder()
        .functionName(getResourcePrefix() + "-log-processor")
        .filename(lambdaAsset.getPath())
        .handler("log_processor.handler")
        .runtime("python3.9")
        .role(lambdaRole.getArn())
        .memorySize(getLambdaMemory())
        .timeout(60)
        .reservedConcurrentExecutions(100)
        .environment(LambdaFunctionEnvironment.builder()
                .variables(Map.of(
                        "S3_BUCKET", s3Bucket.getBucket(),
                        "ENVIRONMENT", getEnvironment()
                ))
                .build())
        .tracingConfig(LambdaFunctionTracingConfig.builder()
                .mode("Active")
                .build())
        // NOTE: No deadLetterConfig
        .dependsOn(List.of(lambdaRole, logGroup))
        .build());
```

**Impact:** Terraform deployment fails with error:
```
╷
│ Error: nil dead_letter_config supplied for function: log-analytics-development-log-processor
│
│   with aws_lambda_function.lambda_log-processor_DCD2B25C (lambda/log-processor),
│   on cdk.tf.json line 371, in resource.aws_lambda_function.lambda_log-processor_DCD2B25C:
│  371:       }
╵
```

AWS Lambda does not accept a dead letter configuration with an empty targetArn. If deadLetterConfig is specified, it must have a valid SQS queue ARN or SNS topic ARN. The fix is to **omit the deadLetterConfig entirely** rather than provide an empty value.

---

## 2. Missing IAM Policy - Incomplete Lambda Permissions

**Model Response:**
MODEL_RESPONSE.md:518-531 - Created IAM policy called "lambda-s3-policy" with **only S3 permissions**:
```java
new IamRolePolicy(this, "lambda-s3-policy", IamRolePolicyConfig.builder()
    .name("s3-access")
    .role(lambdaRole.getId())
    .policy(String.format("""
        {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["s3:PutObject", "s3:PutObjectAcl"],
                "Resource": "%s/*"
            }]
        }
        """, s3Bucket.getArn()))
    .build());
```

**Actual Implementation:**
LambdaConstruct.java:65-90 - **Added comprehensive policy** called "lambda-s3-cloudwatch-policy" with **both S3 AND CloudWatch permissions**:
```java
new IamRolePolicy(this, "lambda-s3-cloudwatch-policy", IamRolePolicyConfig.builder()
        .name("s3-cloudwatch-access")
        .role(lambdaRole.getId())
        .policy(String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": ["s3:PutObject", "s3:PutObjectAcl"],
                            "Resource": "%s/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["cloudwatch:PutMetricData"],
                            "Resource": "*",
                            "Condition": {
                                "StringEquals": {
                                    "cloudwatch:namespace": "LogAnalytics"
                                }
                            }
                        }
                    ]
                }
                """, s3Bucket.getArn()))
        .build());
```

**Impact:** Without CloudWatch permissions, Lambda function can write to S3 but **cannot publish custom metrics to CloudWatch**. This breaks observability and monitoring capabilities. The Lambda function would fail when attempting to call `cloudwatch:PutMetricData`, resulting in access denied errors that would appear in CloudWatch Logs but prevent proper monitoring of log processing metrics (throughput, latency, error rates).

---

## 3. Lambda Handler Name - Python Module Import Error

**Model Response:**
MODEL_RESPONSE.md:551 - Used hyphen in handler name:
```java
.handler("log-processor.handler")
```

**Actual Implementation:**
LambdaConstruct.java:109 - **Fixed to use underscore**:
```java
.handler("log_processor.handler")
```

**Impact:** Python module names cannot contain hyphens. Lambda would fail at invocation time with error:
```
Unable to import module 'log-processor': No module named 'log-processor'
```

Python interprets hyphens as subtraction operators in module names. The correct Python naming convention uses underscores for module names. The Lambda runtime expects to find a file named `log_processor.py` with a `handler` function, not `log-processor.py`.
```

All constructs then extend BaseConstruct:
```java
public class StorageConstruct extends BaseConstruct {
    public StorageConstruct(final Construct scope, final String id) {
        super(scope, id);
        // Access config via protected methods
    }
}
```

---

## 4. ECS Service Deployment Configuration Structure - API Mismatch

**Model Response:**
MODEL_RESPONSE.md:753-760 - Used nested `.deploymentConfiguration()` builder:
```java
.deploymentConfiguration(EcsServiceDeploymentConfiguration.builder()
    .maximumPercent(200)
    .minimumHealthyPercent(100)
    .deploymentCircuitBreaker(EcsServiceDeploymentConfigurationDeploymentCircuitBreaker.builder()
        .enable(true)
        .rollback(true)
        .build())
    .build())
```

**Actual Implementation:**
EcsConstruct.java:174-182 - **Uses flat properties** instead of nested configuration:
```java
.deploymentMaximumPercent(200)
.deploymentMinimumHealthyPercent(100)
.deploymentCircuitBreaker(EcsServiceDeploymentCircuitBreaker.builder()
        .enable(true)
        .rollback(true)
        .build())
```

**Impact:** CDKTF Java API for ECS Service uses flat properties for deployment configuration rather than a nested `deploymentConfiguration` object. Using the nested structure causes compilation error:
```
error: cannot find symbol
  symbol:   method deploymentConfiguration(EcsServiceDeploymentConfiguration)
  location: interface EcsServiceConfig.Builder
```

The correct CDKTF API exposes `deploymentMaximumPercent` and `deploymentMinimumHealthyPercent` as direct properties on `EcsServiceConfig.Builder`, while `deploymentCircuitBreaker` is configured separately.

---

## Summary of Critical Failures

### Deployment-Breaking Errors:
1. **Lambda Dead Letter Config** - Nil configuration causes Terraform apply failure
2. **Lambda Handler Name** - Python module import error at runtime
3. **ECS Deployment Config** - Compilation error due to API mismatch

### Functional Failures:
4. **Missing CloudWatch Permissions** - Lambda cannot publish custom metrics

### Architectural Improvements:

**Total Impact:** The model response would have failed at multiple stages:
- **Build time:** ECS deployment configuration compilation error
- **Deploy time:** Lambda dead letter config Terraform error
- **Runtime:** Lambda handler import error, missing CloudWatch permissions
- **Testing:** Insufficient outputs prevent comprehensive integration testing
