\033[0;32m✅ Stack selected: localstack-dev\033[0m
\033[1;33m🔧 Configuring AWS provider for LocalStack...\033[0m
\033[0;32m✅ AWS provider configured for LocalStack\033[0m
## Deployment
**Started:** 2025-12-12 17:41:42

\033[1;33m📦 Deploying Pulumi stack...\033[0m
\033[0;36m🔧 Deploying stack:\033[0m
\033[0;34m  • Stack Name: localstack-dev\033[0m
\033[0;34m  • Environment: dev\033[0m
\033[0;34m  • Region: us-east-1\033[0m
### Deployment Output
```
Previewing update (localstack-dev):

@ previewing update.....
 +  pulumi:pulumi:Stack TapStack-localstack-dev create 
@ previewing update....
 +  pulumi:pulumi:Stack TapStack-localstack-dev create warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
 +  pulumi:pulumi:Stack TapStack-localstack-dev create warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning
 +  pulumi:pulumi:Stack TapStack-localstack-dev create warning: BucketServerSideEncryptionConfigurationV2 is deprecated: aws.s3/bucketserversideencryptionconfigurationv2.BucketServerSideEncryptionConfigurationV2 has been deprecated in favor of aws.s3/bucketserversideencryptionconfiguration.BucketServerSideEncryptionConfiguration
@ previewing update....
 +  pulumi:pulumi:Stack TapStack-localstack-dev create warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
 +  pulumi:pulumi:Stack TapStack-localstack-dev create warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning
@ previewing update....
 +  pulumi:providers:aws aws create 
 +  custom:app:TapStack pulumi-infra create 
@ previewing update....
 +  aws:ec2:Vpc zerotrust-vpc-dev create 
 +  aws:iam:Role lambda-role-dev create 
 +  aws:s3:BucketV2 zerotrust-data-dev create 
 +  aws:kms:Key zerotrust-kms-key-dev create 
 +  aws:iam:Role api-gateway-role-dev create 
 +  aws:iam:Role config-role-dev create 
 +  aws:s3:BucketV2 config-bucket-dev create 
 +  aws:ec2:Subnet private-subnet-1-dev create 
 +  aws:ec2:Subnet private-subnet-3-dev create 
 +  aws:ec2:RouteTable private-route-table-dev create 
 +  aws:ec2:Subnet private-subnet-2-dev create 
 +  aws:ec2:NetworkAcl zerotrust-nacl-dev create 
 +  aws:iam:RolePolicyAttachment lambda-basic-execution-dev create 
 +  aws:ec2:SecurityGroup lambda-sg-dev create 
 +  aws:ec2:SecurityGroup vpc-endpoint-sg-dev create 
 +  aws:cloudwatch:LogGroup zerotrust-logs-dev create 
 +  aws:apigateway:RestApi zerotrust-api-dev create 
 +  aws:kms:Alias zerotrust-kms-alias-dev create 
 +  aws:s3:BucketPublicAccessBlock zerotrust-data-public-block-dev create 
 +  aws:iam:RolePolicyAttachment config-policy-attachment-dev create 
 +  aws:s3:BucketVersioningV2 zerotrust-data-versioning-dev create 
 +  aws:s3:BucketServerSideEncryptionConfigurationV2 zerotrust-data-encryption-dev create 
 +  aws:s3:BucketVersioningV2 config-bucket-versioning-dev create 
 +  aws:s3:BucketPolicy zerotrust-data-policy-dev create 
 +  aws:s3:BucketPolicy config-bucket-policy-dev create 
 +  aws:ec2:NetworkAclRule nacl-ingress-deny-dev create 
 +  aws:ec2:RouteTableAssociation private-subnet-1-rt-assoc-dev create 
 +  aws:ec2:NetworkAclRule nacl-egress-deny-dev create 
 +  aws:ec2:RouteTableAssociation private-subnet-3-rt-assoc-dev create 
 +  aws:ec2:VpcEndpoint s3-vpc-endpoint-dev create 
 +  aws:ec2:VpcEndpoint dynamodb-vpc-endpoint-dev create 
 +  aws:ec2:NetworkAclRule nacl-ingress-443-dev create 
 +  aws:ec2:RouteTableAssociation private-subnet-2-rt-assoc-dev create 
 +  aws:ec2:NetworkAclRule nacl-ingress-3306-dev create 
 +  aws:ec2:NetworkAclRule nacl-egress-443-dev create 
 +  aws:apigateway:RequestValidator zerotrust-api-validator-dev create 
 +  aws:ec2:NetworkAclRule nacl-egress-3306-dev create 
 +  aws:apigateway:Resource zerotrust-api-resource-dev create 
 +  aws:ec2:SecurityGroup ec2-sg-dev create 
 +  aws:lambda:Function zerotrust-function-dev create 
 +  aws:iam:RolePolicy lambda-policy-dev create 
 +  aws:apigateway:Method zerotrust-api-method-dev create 
 +  aws:ec2:LaunchTemplate zerotrust-launch-template-dev create 
 +  aws:lambda:Permission api-gateway-lambda-permission-dev create 
 +  aws:iam:RolePolicy api-gateway-policy-dev create 
 +  aws:apigateway:Integration zerotrust-api-integration-dev create 
 +  aws:apigateway:Deployment zerotrust-api-deployment-dev create 
 +  aws:apigateway:Stage zerotrust-api-stage-dev create 
 +  pulumi:pulumi:Stack TapStack-localstack-dev create 5 warnings
Diagnostics:
  pulumi:pulumi:Stack (TapStack-localstack-dev):
    warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
    warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning
    warning: BucketServerSideEncryptionConfigurationV2 is deprecated: aws.s3/bucketserversideencryptionconfigurationv2.BucketServerSideEncryptionConfigurationV2 has been deprecated in favor of aws.s3/bucketserversideencryptionconfiguration.BucketServerSideEncryptionConfiguration
    warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
    warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning

Outputs:
    api_gateway_endpoint: [unknown]
    kms_key_arn         : [unknown]
    lambda_function_name: "zerotrust-function-dev"
    log_group_name      : "/aws/zerotrust/dev"
    s3_bucket_name      : [unknown]
    subnet_ids          : [
        [0]: [unknown]
        [1]: [unknown]
        [2]: [unknown]
    ]
    vpc_id              : [unknown]

Resources:
    + 51 to create

Updating (localstack-dev):

@ updating.....
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (0s) 
@ updating....
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (1s) warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (1s) warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (1s) warning: BucketServerSideEncryptionConfigurationV2 is deprecated: aws.s3/bucketserversideencryptionconfigurationv2.BucketServerSideEncryptionConfigurationV2 has been deprecated in favor of aws.s3/bucketserversideencryptionconfiguration.BucketServerSideEncryptionConfiguration
@ updating....
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (1s) warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (1s) warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning
@ updating....
 +  pulumi:providers:aws aws creating (0s) 
 +  pulumi:providers:aws aws created (0.00s) 
 +  custom:app:TapStack pulumi-infra creating (0s) 
 +  aws:ec2:Vpc zerotrust-vpc-dev creating (0s) 
 +  aws:iam:Role api-gateway-role-dev creating (0s) 
 +  aws:s3:BucketV2 zerotrust-data-dev creating (0s) 
 +  aws:kms:Key zerotrust-kms-key-dev creating (0s) 
 +  aws:s3:BucketV2 config-bucket-dev creating (0s) 
 +  aws:iam:Role lambda-role-dev creating (0s) 
 +  aws:iam:Role config-role-dev creating (0s) 
@ updating....
 +  aws:iam:Role lambda-role-dev created (0.17s) 
 +  aws:iam:Role api-gateway-role-dev created (0.21s) 
 +  aws:iam:Role config-role-dev created (0.20s) 
 +  aws:iam:RolePolicyAttachment lambda-basic-execution-dev creating (0s) 
 +  aws:iam:RolePolicyAttachment config-policy-attachment-dev creating (0s) 
 +  aws:iam:RolePolicyAttachment lambda-basic-execution-dev created (0.06s) 
 +  aws:iam:RolePolicyAttachment config-policy-attachment-dev created (0.05s) 
 +  aws:s3:BucketV2 config-bucket-dev creating (0s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: listing tags for S3 (Simple Storage) Bucket (config-bucket-dev): operation error S3 Control: ListTagsForResource, failed to resolve service endpoint, endpoint rule error, AccountId must only contain a-z, A-Z, 0-9 and `-`.: provider=aws@7.13.0
 +  aws:s3:BucketV2 config-bucket-dev creating (0s) error: 1 error occurred:
 +  aws:s3:BucketV2 config-bucket-dev **creating failed** error: 1 error occurred:
 +  aws:s3:BucketV2 zerotrust-data-dev creating (0s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: listing tags for S3 (Simple Storage) Bucket (zerotrust-data-dev): operation error S3 Control: ListTagsForResource, failed to resolve service endpoint, endpoint rule error, AccountId must only contain a-z, A-Z, 0-9 and `-`.: provider=aws@7.13.0
 +  aws:s3:BucketV2 zerotrust-data-dev creating (0s) error: 1 error occurred:
 +  aws:s3:BucketV2 zerotrust-data-dev **creating failed** error: 1 error occurred:
@ updating.............
 +  aws:ec2:Vpc zerotrust-vpc-dev created (10s) 
@ updating.....
 +  aws:kms:Key zerotrust-kms-key-dev created (12s) 
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (15s) error: update failed
 +  pulumi:pulumi:Stack TapStack-localstack-dev **creating failed** 1 error; 5 warnings
 +  custom:app:TapStack pulumi-infra created 
Diagnostics:
  pulumi:pulumi:Stack (TapStack-localstack-dev):
    warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
    warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning
    warning: BucketServerSideEncryptionConfigurationV2 is deprecated: aws.s3/bucketserversideencryptionconfigurationv2.BucketServerSideEncryptionConfigurationV2 has been deprecated in favor of aws.s3/bucketserversideencryptionconfiguration.BucketServerSideEncryptionConfiguration
    warning: BucketV2 is deprecated: s3.BucketV2 has been deprecated in favor of s3.Bucket
    warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning
    error: update failed

  aws:s3:BucketV2 (zerotrust-data-dev):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: listing tags for S3 (Simple Storage) Bucket (zerotrust-data-dev): operation error S3 Control: ListTagsForResource, failed to resolve service endpoint, endpoint rule error, AccountId must only contain a-z, A-Z, 0-9 and `-`.: provider=aws@7.13.0
    error: 1 error occurred:
    	* creating urn:pulumi:localstack-dev::TapStack::custom:app:TapStack$aws:s3/bucketV2:BucketV2::zerotrust-data-dev: 1 error occurred:
    	* listing tags for S3 (Simple Storage) Bucket (zerotrust-data-dev): operation error S3 Control: ListTagsForResource, failed to resolve service endpoint, endpoint rule error, AccountId must only contain a-z, A-Z, 0-9 and `-`.

  aws:s3:BucketV2 (config-bucket-dev):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: listing tags for S3 (Simple Storage) Bucket (config-bucket-dev): operation error S3 Control: ListTagsForResource, failed to resolve service endpoint, endpoint rule error, AccountId must only contain a-z, A-Z, 0-9 and `-`.: provider=aws@7.13.0
    error: 1 error occurred:
    	* creating urn:pulumi:localstack-dev::TapStack::custom:app:TapStack$aws:s3/bucketV2:BucketV2::config-bucket-dev: 1 error occurred:
    	* listing tags for S3 (Simple Storage) Bucket (config-bucket-dev): operation error S3 Control: ListTagsForResource, failed to resolve service endpoint, endpoint rule error, AccountId must only contain a-z, A-Z, 0-9 and `-`.

Resources:
    + 10 created
    3 errored

Duration: 18s

```

\033[0;32m✅ Pulumi deployment completed successfully\033[0m
\033[0;32m⏱️  Total deployment time: 26s\033[0m
**Ended:** 2025-12-12 17:42:08
**Duration:** 26s

\033[1;33m📊 Generating stack outputs...\033[0m
\033[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json\033[0m
## Stack Outputs
\033[1;33mℹ️  No stack outputs defined\033[0m
No outputs defined.

\033[0;36m🎯 Deployment Summary:\033[0m
\033[0;34m  • Stack: localstack-dev\033[0m
\033[0;34m  • Resources: 13\033[0m
\033[0;34m  • Duration: 26s\033[0m
\033[0;34m  • LocalStack: http://localhost:4566\033[0m
## Summary
- **Stack:** localstack-dev
- **Resources:** 13
- **Duration:** 26s
- **LocalStack:** http://localhost:4566

---
**Status:** ✅ Completed successfully
\033[0;32m🎉 Pulumi deployment to LocalStack completed successfully!\033[0m
\033[0;34m📄 Execution output saved to: execution-output.md\033[0m
