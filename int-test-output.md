# LocalStack Deployment Test

**Date:** $(date)
**Task:** archive/pulumi-py/Pr1386
**Platform:** pulumi
**Language:** py
**PR ID:** Pr1386
**Working Directory:** /home/ubuntu/iac-test-automations/worktree/localstack-Pr1386

---

## Environment Setup

Setting up LocalStack environment variables...

PULUMI_CONFIG_PASSPHRASE=
AWS_DEFAULT_REGION=us-east-1
PULUMI_BACKEND_URL=file://~/.pulumi-local
AWS_S3_FORCE_PATH_STYLE=true
AWS_SECRET_ACCESS_KEY=test
AWS_SKIP_CREDENTIALS_VALIDATION=true
AWS_ACCESS_KEY_ID=test
AWS_SKIP_METADATA_API_CHECK=true
AWS_ENDPOINT_URL=http://localhost:4566

## Dependencies Installation

```bash
Activating virtual environment...
Installing Pulumi AWS plugin and dependencies...
Collecting pulumi
  Using cached pulumi-3.213.0-py3-none-any.whl.metadata (3.8 kB)
Collecting pulumi-aws
  Using cached pulumi_aws-7.15.0-py3-none-any.whl.metadata (10 kB)
Collecting debugpy~=1.8.7 (from pulumi)
  Using cached debugpy-1.8.19-cp312-cp312-manylinux_2_34_x86_64.whl.metadata (1.4 kB)
Collecting dill~=0.4 (from pulumi)
  Using cached dill-0.4.0-py3-none-any.whl.metadata (10 kB)
Collecting grpcio<2,>=1.68.1 (from pulumi)
  Using cached grpcio-1.76.0-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.whl.metadata (3.7 kB)
Collecting pip<26,>=24.3.1 (from pulumi)
  Using cached pip-25.3-py3-none-any.whl.metadata (4.7 kB)
Collecting protobuf<6,>=3.20.3 (from pulumi)
  Using cached protobuf-5.29.5-cp38-abi3-manylinux2014_x86_64.whl.metadata (592 bytes)
Collecting pyyaml~=6.0 (from pulumi)
  Using cached pyyaml-6.0.3-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (2.4 kB)
Collecting semver~=3.0 (from pulumi)
  Using cached semver-3.0.4-py3-none-any.whl.metadata (6.8 kB)
Collecting parver>=0.2.1 (from pulumi-aws)
  Using cached parver-0.5-py3-none-any.whl.metadata (2.7 kB)
Collecting typing-extensions~=4.12 (from grpcio<2,>=1.68.1->pulumi)
  Using cached typing_extensions-4.15.0-py3-none-any.whl.metadata (3.3 kB)
Collecting arpeggio>=1.7 (from parver>=0.2.1->pulumi-aws)
  Using cached Arpeggio-2.0.3-py2.py3-none-any.whl.metadata (2.4 kB)
Collecting attrs>=19.2 (from parver>=0.2.1->pulumi-aws)
  Using cached attrs-25.4.0-py3-none-any.whl.metadata (10 kB)
Using cached pulumi-3.213.0-py3-none-any.whl (384 kB)
Using cached pulumi_aws-7.15.0-py3-none-any.whl (11.5 MB)
Using cached debugpy-1.8.19-cp312-cp312-manylinux_2_34_x86_64.whl (4.3 MB)
Using cached dill-0.4.0-py3-none-any.whl (119 kB)
Using cached grpcio-1.76.0-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.whl (6.6 MB)
Using cached parver-0.5-py3-none-any.whl (15 kB)
Using cached pip-25.3-py3-none-any.whl (1.8 MB)
Using cached protobuf-5.29.5-cp38-abi3-manylinux2014_x86_64.whl (319 kB)
Using cached pyyaml-6.0.3-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (807 kB)
Using cached semver-3.0.4-py3-none-any.whl (17 kB)
Using cached Arpeggio-2.0.3-py2.py3-none-any.whl (54 kB)
Using cached attrs-25.4.0-py3-none-any.whl (67 kB)
Using cached typing_extensions-4.15.0-py3-none-any.whl (44 kB)
Installing collected packages: arpeggio, typing-extensions, semver, pyyaml, protobuf, pip, dill, debugpy, attrs, parver, grpcio, pulumi, pulumi-aws
  Attempting uninstall: pip
    Found existing installation: pip 24.0
    Uninstalling pip-24.0:
      Successfully uninstalled pip-24.0
Successfully installed arpeggio-2.0.3 attrs-25.4.0 debugpy-1.8.19 dill-0.4.0 grpcio-1.76.0 parver-0.5 pip-25.3 protobuf-5.29.5 pulumi-3.213.0 pulumi-aws-7.15.0 pyyaml-6.0.3 semver-3.0.4 typing-extensions-4.15.0
```

Dependencies installed successfully.


## Pulumi Backend Setup

```bash
Setting up local Pulumi backend...
Initializing Pulumi stack...
/bin/bash: line 1: pulumi: command not found
Initializing Pulumi stack...
Initializing Pulumi stack...
Logged in to ip-10-0-1-210 as ubuntu (file://~)
Stack initialized successfully
```

Pulumi backend configured successfully.

## Pulumi Configuration for LocalStack

Configuring AWS endpoints to point to LocalStack...

```bash
Setting AWS region...
Setting AWS access credentials...
Setting AWS skip validations...
Configuring LocalStack endpoints...
Configuration complete
```

Configuration complete.

## LocalStack Health Check

Verifying LocalStack is running...

```bash
{"services": {"acm": "available", "apigateway": "available", "cloudformation": "available", "cloudwatch": "available", "config": "available", "dynamodb": "available", "dynamodbstreams": "available", "ec2": "available", "es": "available", "events": "available", "firehose": "available", "iam": "running", "kinesis": "available", "kms": "available", "lambda": "available", "logs": "available", "opensearch": "available", "redshift": "available", "resource-groups": "available", "resourcegroupstaggingapi": "available", "route53": "available", "route53resolver": "available", "s3": "available", "s3control": "available", "scheduler": "available", "secretsmanager": "available", "ses": "available", "sns": "available", "sqs": "available", "ssm": "available", "stepfunctions": "available", "sts": "running", "support": "available", "swf": "available", "transcribe": "available"}, "edition": "community", "version": "4.12.1.dev27"}```

## Deployment

Attempting Pulumi deployment to LocalStack...

**Expected Issues:**
- CloudFront is NOT available in LocalStack Community (will fail)
- WAFv2 is NOT available in LocalStack Community (will fail)
- Other services (S3, KMS, Route53, ACM, IAM, CloudWatch) should work

```bash
Starting deployment at Tue Dec 23 11:00:16 UTC 2025...
Updating (tap-stack-Pr1386):

 +  pulumi:pulumi:Stack TapStack-tap-stack-Pr1386 creating (0s) 
 +  pulumi:pulumi:Stack TapStack-tap-stack-Pr1386 creating (0s) error: Program failed with an unhandled exception:
 +  pulumi:pulumi:Stack TapStack-tap-stack-Pr1386 **creating failed (0.05s)** 1 error
Diagnostics:
  pulumi:pulumi:Stack (TapStack-tap-stack-Pr1386):
    error: Program failed with an unhandled exception:
    Traceback (most recent call last):
      File "tap.py", line 15, in <module>
        from lib.tap_stack import TapStack, TapStackArgs
    ModuleNotFoundError: No module named 'lib'

Resources:
    + 1 created
    1 errored

Duration: 1s

Deployment finished with exit code: 255
```

**ERROR:** ModuleNotFoundError: No module named 'lib'

**FIX:** Adding current directory to PYTHONPATH and retrying deployment...

```bash
Retrying deployment at Tue Dec 23 11:00:36 UTC 2025...
Updating (tap-stack-Pr1386):

 ~  pulumi:pulumi:Stack TapStack-tap-stack-Pr1386 refreshing (0s) 
 ~  pulumi:pulumi:Stack TapStack-tap-stack-Pr1386 refreshing (0s) 
@ updating....
    pulumi:pulumi:Stack TapStack-tap-stack-Pr1386 running 
 +  custom:resource:TapStack TapStack creating (0s) 
@ updating.....
 +  aws:cloudwatch:LogGroup log-group-us-west-2-dev creating (0s) 
 +  aws:kms:Key kms-key-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-us-east-1-dev creating (0s) 
 +  aws:cloudfront:OriginAccessIdentity oai-dev creating (0s) 
 +  aws:wafv2:WebAcl waf-acl-dev creating (0s) 
 +  aws:iam:Role pulumi-role-dev creating (0s) 
 +  aws:iam:Role pulumi-role-dev created (0.05s) 
 +  aws:iam:RolePolicy pulumi-policy-dev creating (0s) 
 +  aws:iam:RolePolicy pulumi-policy-dev created (0.10s) 
 +  aws:cloudfront:OriginAccessIdentity oai-dev creating (0s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFront Origin Access Identity: operation error CloudFront: CreateCloudFrontOriginAccessIdentity, https response error StatusCode: 501, RequestID: b7433055-d705-4090-9d67-844b3f9f91d1, api error InternalFailure: The API for service 'cloudfront' is either not included in your current license plan or has not yet been emulated by LocalStack. Please refer to https://docs.localstack.cloud/references/coverage for more details.: provider=aws@7.15.0
 +  aws:cloudfront:OriginAccessIdentity oai-dev creating (0s) error: 1 error occurred:
 +  aws:cloudfront:OriginAccessIdentity oai-dev **creating failed** error: 1 error occurred:
@ updating....
 +  aws:cloudwatch:LogGroup log-group-us-east-1-dev created (0.59s) 
 +  aws:cloudwatch:LogGroup log-group-us-west-2-dev created (0.59s) 
@ updating.....
 +  aws:wafv2:WebAcl waf-acl-dev creating (2s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating WAFv2 WebACL (waf-acl-dev-2283418): operation error WAFV2: CreateWebACL, https response error StatusCode: 501, RequestID: c2aca494-b1bf-4e9d-b12d-e906a6c7d897, api error InternalFailure: The API for service 'wafv2' is either not included in your current license plan or has not yet been emulated by LocalStack. Please refer to https://docs.localstack.cloud/references/coverage for more details.: provider=aws@7.15.0
 +  aws:wafv2:WebAcl waf-acl-dev creating (2s) error: 1 error occurred:
 +  aws:wafv2:WebAcl waf-acl-dev **creating failed** error: 1 error occurred:
@ updating........
 +  aws:kms:Key kms-key-dev created (8s) 
    pulumi:pulumi:Stack TapStack-tap-stack-Pr1386 running error: update failed
    pulumi:pulumi:Stack TapStack-tap-stack-Pr1386 **failed** 1 error
 +  custom:resource:TapStack TapStack created 
Diagnostics:
  aws:wafv2:WebAcl (waf-acl-dev):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating WAFv2 WebACL (waf-acl-dev-2283418): operation error WAFV2: CreateWebACL, https response error StatusCode: 501, RequestID: c2aca494-b1bf-4e9d-b12d-e906a6c7d897, api error InternalFailure: The API for service 'wafv2' is either not included in your current license plan or has not yet been emulated by LocalStack. Please refer to https://docs.localstack.cloud/references/coverage for more details.: provider=aws@7.15.0
    error: 1 error occurred:
    	* creating WAFv2 WebACL (waf-acl-dev-2283418): operation error WAFV2: CreateWebACL, https response error StatusCode: 501, RequestID: c2aca494-b1bf-4e9d-b12d-e906a6c7d897, api error InternalFailure: The API for service 'wafv2' is either not included in your current license plan or has not yet been emulated by LocalStack. Please refer to https://docs.localstack.cloud/references/coverage for more details.

  aws:cloudfront:OriginAccessIdentity (oai-dev):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFront Origin Access Identity: operation error CloudFront: CreateCloudFrontOriginAccessIdentity, https response error StatusCode: 501, RequestID: b7433055-d705-4090-9d67-844b3f9f91d1, api error InternalFailure: The API for service 'cloudfront' is either not included in your current license plan or has not yet been emulated by LocalStack. Please refer to https://docs.localstack.cloud/references/coverage for more details.: provider=aws@7.15.0
    error: 1 error occurred:
    	* creating CloudFront Origin Access Identity: operation error CloudFront: CreateCloudFrontOriginAccessIdentity, https response error StatusCode: 501, RequestID: b7433055-d705-4090-9d67-844b3f9f91d1, api error InternalFailure: The API for service 'cloudfront' is either not included in your current license plan or has not yet been emulated by LocalStack. Please refer to https://docs.localstack.cloud/references/coverage for more details.

  pulumi:pulumi:Stack (TapStack-tap-stack-Pr1386):
    error: update failed

Resources:
    + 6 created
    1 unchanged
    3 errored

Duration: 12s

Deployment finished with exit code: 255
Current stack is tap-stack-Pr1386:
    Managed by ip-10-0-1-210
    Last updated: 12 seconds ago (2025-12-23 11:00:49.121747113 +0000 UTC)
    Pulumi version used: v3.213.0
Current stack resources (8):
    TYPE                                    NAME
    pulumi:pulumi:Stack                     TapStack-tap-stack-Pr1386
    ├─ custom:resource:TapStack             TapStack
    │  ├─ aws:iam/role:Role                 pulumi-role-dev
    │  │  │  ID: pulumi-role-dev-846c072
    │  │  └─ aws:iam/rolePolicy:RolePolicy  pulumi-policy-dev
    │  │        ID: pulumi-role-dev-846c072:pulumi-policy-dev-f0a6ec1
    │  ├─ aws:cloudwatch/logGroup:LogGroup  log-group-us-east-1-dev
    │  │     ID: /aws/s3/us-east-1-dev
    │  ├─ aws:cloudwatch/logGroup:LogGroup  log-group-us-west-2-dev
    │  │     ID: /aws/s3/us-west-2-dev
    │  └─ aws:kms/key:Key                   kms-key-dev
    │        ID: b4d3a225-fbe3-4d0f-8896-6d66985d7f56
    └─ pulumi:providers:aws                 default_7_15_0
          ID: 12cbe37e-cb03-4da5-b7f1-0b6474a8efa9

Current stack outputs (0):
    No output values currently in this stack

Use `pulumi stack select` to change stack; `pulumi stack ls` lists known ones
```

---

## Deployment Summary

### Resources Successfully Created

The following resources were successfully deployed to LocalStack:

1. **IAM Role** (`pulumi-role-dev`) - Created successfully
2. **IAM Role Policy** (`pulumi-policy-dev`) - Created successfully  
3. **KMS Key** (`kms-key-dev`) - Created successfully (8s)
4. **CloudWatch Log Groups**:
   - `log-group-us-east-1-dev` - Created successfully (0.59s)
   - `log-group-us-west-2-dev` - Created successfully (0.59s)
5. **Custom Resource** (`TapStack`) - Created successfully

**Total Successful:** 6 resources

### Resources That Failed

The following resources failed due to LocalStack Community limitations:

1. **CloudFront Origin Access Identity** (`oai-dev`) - FAILED
   - Error: `StatusCode: 501 - api error InternalFailure`
   - Reason: CloudFront is NOT available in LocalStack Community edition
   - Message: "The API for service 'cloudfront' is either not included in your current license plan or has not yet been emulated by LocalStack"

2. **WAFv2 WebACL** (`waf-acl-dev`) - FAILED
   - Error: `StatusCode: 501 - api error InternalFailure`
   - Reason: WAFv2 is NOT available in LocalStack Community edition
   - Message: "The API for service 'wafv2' is either not included in your current license plan or has not yet been emulated by LocalStack"

3. **Dependent Resources** - NOT CREATED
   - CloudFront Distribution (depends on Origin Access Identity)
   - S3 Buckets (creation may have been blocked by failures)
   - Route53 Records (depend on CloudFront)
   - ACM Certificate (may not have been created due to failures)

**Total Failed:** 3+ resources

### Services Status

| Service | Available in LocalStack | Status | Notes |
|---------|------------------------|--------|-------|
| IAM | Yes (running) | SUCCESS | Role and policy created |
| KMS | Yes (available) | SUCCESS | Key created successfully |
| CloudWatch Logs | Yes (available) | SUCCESS | Log groups created |
| S3 | Yes (available) | PARTIAL | May not have been attempted due to failures |
| CloudFront | NO | FAILED | 501 - Not in Community edition |
| WAFv2 | NO | FAILED | 501 - Not in Community edition |
| Route53 | Yes (available) | UNKNOWN | May not have been attempted |
| ACM | Yes (available) | UNKNOWN | May not have been attempted |

### Root Cause Analysis

The deployment failed because the TAP stack has hard dependencies on CloudFront and WAFv2, which are:
- NOT available in LocalStack Community edition
- Required for the application architecture (CDN and Web Application Firewall)
- Cannot be easily mocked or removed without significant architectural changes

The code attempts to create these resources in sequence, and when CloudFront OAI and WAFv2 fail with 501 errors, the entire stack deployment fails. The S3 buckets and other downstream resources may not have been created because the stack design has implicit or explicit dependencies on the CloudFront distribution.

### Conclusion

**Deployment Status:** FAILED

**Exit Code:** 255

**Duration:** ~12 seconds

**Verdict:** This task CANNOT be deployed to LocalStack Community edition without code modifications to:
1. Make CloudFront resources optional or mock them
2. Make WAFv2 resources optional or mock them  
3. Adjust S3 bucket policies to work without CloudFront OAI
4. Handle the absence of these services gracefully

**Migration Readiness:** NOT READY - Requires refactoring to support LocalStack Community constraints.

