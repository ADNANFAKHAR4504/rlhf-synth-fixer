\033[0;32m✅ Stack selected: localstack-dev\033[0m
\033[1;33m🔧 Configuring AWS provider for LocalStack...\033[0m
\033[0;32m✅ AWS provider configured for LocalStack\033[0m
## Deployment
**Started:** 2025-12-15 12:51:50

\033[1;33m📦 Deploying Pulumi stack...\033[0m
\033[0;36m🔧 Deploying stack:\033[0m
\033[0;34m  • Stack Name: localstack-dev\033[0m
\033[0;34m  • Environment: dev\033[0m
\033[0;34m  • Region: us-east-1\033[0m
### Deployment Output
```
Previewing update (localstack-dev):

@ previewing update....
    pulumi:pulumi:Stack TapStack-localstack-dev  warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
    pulumi:pulumi:Stack TapStack-localstack-dev  warning: BucketLifecycleConfigurationV2 is deprecated: aws.s3/bucketlifecycleconfigurationv2.BucketLifecycleConfigurationV2 has been deprecated in favor of aws.s3/bucketlifecycleconfiguration.BucketLifecycleConfiguration
@ previewing update.....
 +  pulumi:pulumi:Stack TapStack-localstack-dev create warning: BucketLifecycleConfigurationV2 is deprecated: aws.s3/bucketlifecycleconfigurationv2.BucketLifecycleConfigurationV2 has been deprecated in favor of aws.s3/bucketlifecycleconfiguration.BucketLifecycleConfiguration
 +  tap:stack:TapStack pulumi-infra create 
 +  aws:iam:Role apigw-cw-role-dev create 
 +  aws:s3:BucketV2 serverless-logs-dev create 
 +  aws:iam:Role lambda-role-dev create 
 +  aws:cloudwatch:LogGroup apigw-logs-dev create 
 +  pulumi:pulumi:Stack TapStack-localstack-dev create /home/rajendra/turing/iac-[secret]-automations/.venv/lib/python3.12/site-packages/pulumi_aws/_utilities.py:317: UserWarning: name is deprecated. Use region instead.
 +  pulumi:pulumi:Stack TapStack-localstack-dev create   warnings.warn(message)
 +  pulumi:pulumi:Stack TapStack-localstack-dev create warning: name is deprecated: name is deprecated. Use region instead.
 +  aws:apigateway:RestApi api-dev create 
 +  aws:cloudwatch:LogGroup lambda-logs-dev create 
 +  aws:iam:RolePolicyAttachment lambda-basic-execution-dev create 
 +  aws:iam:RolePolicyAttachment apigw-cw-role-policy-dev create 
 +  aws:cloudwatch:MetricAlarm apigw-4xx-dev create 
 +  aws:apigateway:Account apigw-account-dev create 
 +  aws:apigateway:Resource api-proxy-dev create 
 +  aws:s3:BucketPublicAccessBlock serverless-logs-pab-dev create 
 +  aws:iam:RolePolicy lambda-s3-policy-dev create 
 +  aws:apigateway:Method api-root-method-dev create 
 +  aws:s3:BucketLifecycleConfigurationV2 serverless-logs-lifecycle-dev create 
 +  aws:lambda:Function handler-dev create 
 +  aws:apigateway:Method api-proxy-method-dev create 
 +  aws:cloudwatch:MetricAlarm lambda-errors-dev create 
 +  aws:cloudwatch:MetricAlarm lambda-duration-dev create 
 +  aws:lambda:Permission apigw-invoke-dev create 
 +  aws:apigateway:Integration api-proxy-int-dev create 
 +  aws:apigateway:Integration api-root-int-dev create 
 +  aws:apigateway:Deployment api-deploy-dev create 
 +  aws:apigateway:Stage api-stage-dev create 
 +  aws:apigateway:MethodSettings api-stage-methodsettings-dev create 
 +  pulumi:pulumi:Stack TapStack-localstack-dev create 3 warnings; 2 messages
Diagnostics:
  pulumi:pulumi:Stack (TapStack-localstack-dev):
    warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
    warning: BucketLifecycleConfigurationV2 is deprecated: aws.s3/bucketlifecycleconfigurationv2.BucketLifecycleConfigurationV2 has been deprecated in favor of aws.s3/bucketlifecycleconfiguration.BucketLifecycleConfiguration
    warning: name is deprecated: name is deprecated. Use region instead.

    /home/rajendra/turing/iac-[secret]-automations/.venv/lib/python3.12/site-packages/pulumi_aws/_utilities.py:317: UserWarning: name is deprecated. Use region instead.
      warnings.warn(message)

Outputs:
    api_gateway_execution_arn: [unknown]
    api_gateway_id           : [unknown]
    api_gateway_stage        : "dev"
    api_gateway_url          : [unknown]
    api_log_group            : "/aws/apigateway/TapStack-dev"
    apigw_cloudwatch_role_arn: [unknown]
    echo_endpoint            : [unknown]
    health_endpoint          : [unknown]
    info_endpoint            : [unknown]
    lambda_function_arn      : [unknown]
    lambda_function_name     : "TapStack-handler-dev"
    lambda_log_group         : "/aws/lambda/TapStack-handler-dev"
    lambda_version           : [unknown]
    s3_log_bucket            : "tapstack-logs-dev"
    s3_log_bucket_arn        : [unknown]

Resources:
    + 27 to create

Updating (localstack-dev):

@ updating....
    pulumi:pulumi:Stack TapStack-localstack-dev  warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
    pulumi:pulumi:Stack TapStack-localstack-dev  warning: BucketLifecycleConfigurationV2 is deprecated: aws.s3/bucketlifecycleconfigurationv2.BucketLifecycleConfigurationV2 has been deprecated in favor of aws.s3/bucketlifecycleconfiguration.BucketLifecycleConfiguration
@ updating....
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (0s) warning: BucketLifecycleConfigurationV2 is deprecated: aws.s3/bucketlifecycleconfigurationv2.BucketLifecycleConfigurationV2 has been deprecated in favor of aws.s3/bucketlifecycleconfiguration.BucketLifecycleConfiguration
 +  tap:stack:TapStack pulumi-infra creating (0s) 
@ updating....
 +  aws:iam:Role apigw-cw-role-dev creating (0s) 
 +  aws:iam:Role lambda-role-dev creating (0s) 
 +  aws:cloudwatch:LogGroup lambda-logs-dev creating (0s) 
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (0s) /home/rajendra/turing/iac-[secret]-automations/.venv/lib/python3.12/site-packages/pulumi_aws/_utilities.py:317: UserWarning: name is deprecated. Use region instead.
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (0s)   warnings.warn(message)
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (0s) warning: name is deprecated: name is deprecated. Use region instead.
 +  aws:cloudwatch:LogGroup apigw-logs-dev creating (0s) 
 +  aws:s3:BucketV2 serverless-logs-dev creating (0s) 
 +  aws:apigateway:RestApi api-dev creating (0s) 
 +  aws:cloudwatch:LogGroup lambda-logs-dev created (0.08s) 
 +  aws:cloudwatch:LogGroup apigw-logs-dev created (0.08s) 
 +  aws:iam:Role apigw-cw-role-dev created (0.08s) 
 +  aws:apigateway:RestApi api-dev created (0.08s) 
 +  aws:iam:Role lambda-role-dev created (0.09s) 
 +  aws:iam:RolePolicyAttachment apigw-cw-role-policy-dev creating (0s) 
 +  aws:apigateway:Account apigw-account-dev creating (0s) 
 +  aws:cloudwatch:MetricAlarm apigw-4xx-dev creating (0s) 
 +  aws:iam:RolePolicyAttachment lambda-basic-execution-dev creating (0s) 
 +  aws:apigateway:Resource api-proxy-dev creating (0s) 
 +  aws:apigateway:Method api-root-method-dev creating (0s) 
 +  aws:apigateway:Account apigw-account-dev created (0.04s) 
 +  aws:apigateway:Method api-root-method-dev created (0.05s) 
 +  aws:iam:RolePolicyAttachment apigw-cw-role-policy-dev created (0.05s) 
 +  aws:apigateway:Resource api-proxy-dev created (0.05s) 
 +  aws:iam:RolePolicyAttachment lambda-basic-execution-dev created (0.06s) 
 +  aws:apigateway:Method api-proxy-method-dev creating (0s) 
 +  aws:apigateway:Method api-proxy-method-dev created (0.02s) 
 +  aws:cloudwatch:MetricAlarm apigw-4xx-dev created (0.09s) 
 +  aws:s3:BucketV2 serverless-logs-dev created (0.22s) 
 +  aws:s3:BucketPublicAccessBlock serverless-logs-pab-dev creating (0s) 
 +  aws:s3:BucketLifecycleConfigurationV2 serverless-logs-lifecycle-dev creating (0s) 
 +  aws:iam:RolePolicy lambda-s3-policy-dev creating (0s) 
 +  aws:lambda:Function handler-dev creating (0s) 
 +  aws:s3:BucketPublicAccessBlock serverless-logs-pab-dev created (0.02s) 
 +  aws:iam:RolePolicy lambda-s3-policy-dev created (0.04s) 
@ updating........
 +  aws:lambda:Function handler-dev created (5s) 
 +  aws:cloudwatch:MetricAlarm lambda-errors-dev creating (0s) 
 +  aws:cloudwatch:MetricAlarm lambda-duration-dev creating (0s) 
 +  aws:lambda:Permission apigw-invoke-dev creating (0s) 
 +  aws:apigateway:Integration api-proxy-int-dev creating (0s) 
 +  aws:apigateway:Integration api-root-int-dev creating (0s) 
 +  aws:apigateway:Integration api-proxy-int-dev created (0.04s) 
 +  aws:lambda:Permission apigw-invoke-dev created (0.04s) 
 +  aws:apigateway:Integration api-root-int-dev created (0.05s) 
 +  aws:apigateway:Deployment api-deploy-dev creating (0s) 
 +  aws:cloudwatch:MetricAlarm lambda-errors-dev created (0.07s) 
 +  aws:cloudwatch:MetricAlarm lambda-duration-dev created (0.07s) 
 +  aws:apigateway:Deployment api-deploy-dev created (0.02s) 
 +  aws:apigateway:Stage api-stage-dev creating (0s) 
 +  aws:apigateway:Stage api-stage-dev created (0.03s) 
 +  aws:apigateway:MethodSettings api-stage-methodsettings-dev creating (0s) 
 +  aws:apigateway:MethodSettings api-stage-methodsettings-dev created (0.02s) 
@ updating.....................................................
 +  aws:s3:BucketLifecycleConfigurationV2 serverless-logs-lifecycle-dev created (55s) 
 +  pulumi:pulumi:Stack TapStack-localstack-dev created (55s) 3 warnings; 2 messages
Diagnostics:
  pulumi:pulumi:Stack (TapStack-localstack-dev):
    warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
    warning: BucketLifecycleConfigurationV2 is deprecated: aws.s3/bucketlifecycleconfigurationv2.BucketLifecycleConfigurationV2 has been deprecated in favor of aws.s3/bucketlifecycleconfiguration.BucketLifecycleConfiguration
    warning: name is deprecated: name is deprecated. Use region instead.

    /home/rajendra/turing/iac-[secret]-automations/.venv/lib/python3.12/site-packages/pulumi_aws/_utilities.py:317: UserWarning: name is deprecated. Use region instead.
      warnings.warn(message)

Outputs:
    api_gateway_execution_arn: "arn:aws:execute-api:us-east-1:000000000000:wzzu50ockn"
    api_gateway_id           : "wzzu50ockn"
    api_gateway_stage        : "dev"
    api_gateway_url          : "http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_"
    api_log_group            : "/aws/apigateway/TapStack-dev"
    apigw_cloudwatch_role_arn: "arn:aws:iam::000000000000:role/apigw-cw-role-dev-047e322"
    echo_endpoint            : "http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/echo"
    health_endpoint          : "http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/health"
    info_endpoint            : "http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/info"
    lambda_function_arn      : "arn:aws:lambda:us-east-1:000000000000:function:TapStack-handler-dev"
    lambda_function_name     : "TapStack-handler-dev"
    lambda_log_group         : "/aws/lambda/TapStack-handler-dev"
    lambda_version           : "1"
    s3_log_bucket            : "tapstack-logs-dev"
    s3_log_bucket_arn        : "arn:aws:s3:::tapstack-logs-dev"

Resources:
    + 27 created

Duration: 58s

```

\033[0;32m✅ Pulumi deployment completed successfully\033[0m
\033[0;32m⏱️  Total deployment time: 63s\033[0m
**Ended:** 2025-12-15 12:52:53
**Duration:** 63s

\033[1;33m📊 Generating stack outputs...\033[0m
\033[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json\033[0m
## Stack Outputs
\033[0;34m📋 Stack Outputs:\033[0m
  • api_gateway_execution_arn: arn:aws:execute-api:us-east-1:000000000000:wzzu50ockn
  • api_gateway_id: wzzu50ockn
  • api_gateway_stage: dev
  • api_gateway_url: http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_
  • api_log_group: /aws/apigateway/TapStack-dev
  • apigw_cloudwatch_role_arn: arn:aws:iam::000000000000:role/apigw-cw-role-dev-047e322
  • echo_endpoint: http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/echo
  • health_endpoint: http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/health
  • info_endpoint: http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/info
  • lambda_function_arn: arn:aws:lambda:us-east-1:000000000000:function:TapStack-handler-dev
  • lambda_function_name: TapStack-handler-dev
  • lambda_log_group: /aws/lambda/TapStack-handler-dev
  • lambda_version: 1
  • s3_log_bucket: tapstack-logs-dev
  • s3_log_bucket_arn: arn:aws:s3:::tapstack-logs-dev

### JSON Output
```json
{
  "api_gateway_execution_arn": "arn:aws:execute-api:us-east-1:000000000000:wzzu50ockn",
  "api_gateway_id": "wzzu50ockn",
  "api_gateway_stage": "dev",
  "api_gateway_url": "http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_",
  "api_log_group": "/aws/apigateway/TapStack-dev",
  "apigw_cloudwatch_role_arn": "arn:aws:iam::000000000000:role/apigw-cw-role-dev-047e322",
  "echo_endpoint": "http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/echo",
  "health_endpoint": "http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/health",
  "info_endpoint": "http://localhost:4566/restapis/wzzu50ockn/dev/_user_request_/info",
  "lambda_function_arn": "arn:aws:lambda:us-east-1:000000000000:function:TapStack-handler-dev",
  "lambda_function_name": "TapStack-handler-dev",
  "lambda_log_group": "/aws/lambda/TapStack-handler-dev",
  "lambda_version": "1",
  "s3_log_bucket": "tapstack-logs-dev",
  "s3_log_bucket_arn": "arn:aws:s3:::tapstack-logs-dev"
}
```

\033[0;36m🎯 Deployment Summary:\033[0m
\033[0;34m  • Stack: localstack-dev\033[0m
\033[0;34m  • Resources: 28\033[0m
\033[0;34m  • Duration: 63s\033[0m
\033[0;34m  • LocalStack: http://localhost:4566\033[0m
## Summary
- **Stack:** localstack-dev
- **Resources:** 28
- **Duration:** 63s
- **LocalStack:** http://localhost:4566

---
**Status:** ✅ Completed successfully
\033[0;32m🎉 Pulumi deployment to LocalStack completed successfully!\033[0m
\033[0;34m📄 Execution output saved to: execution-output.md\033[0m
