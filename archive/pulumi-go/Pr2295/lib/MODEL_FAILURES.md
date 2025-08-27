There were these erros in the Mdel response -

1. Provided response had lint issues.
2. It had failures for S3 related things 
```
[resource plugin aws-6.83.0] installing
@ previewing update...............................

@ previewing update.................................................................................................................
    pulumi:pulumi:Stack TapStack-TapStackpr2295  # github.com/TuringGpt/iac-test-automations/lib
    pulumi:pulumi:Stack TapStack-TapStackpr2295  ./tap_stack.go:176:15: undefined: s3.NewBucketVersioning
    pulumi:pulumi:Stack TapStack-TapStackpr2295  ./tap_stack.go:177:4: unknown field Bucket in struct literal of type s3.BucketVersioningArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2295  ./tap_stack.go:178:4: unknown field VersioningConfiguration in struct literal of type s3.BucketVersioningArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2295  ./tap_stack.go:178:33: undefined: s3.BucketVersioningVersioningConfigurationArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2295  ./tap_stack.go:187:15: undefined: s3.NewBucketServerSideEncryptionConfiguration
    pulumi:pulumi:Stack TapStack-TapStackpr2295  ./tap_stack.go:188:4: unknown field Bucket in struct literal of type s3.BucketServerSideEncryptionConfigurationArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2295  ./tap_stack.go:189:4: unknown field Rules in struct literal of type s3.BucketServerSideEncryptionConfigurationArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2295  ./tap_stack.go:189:14: undefined: s3.BucketServerSideEncryptionConfigurationRuleArray
    pulumi:pulumi:Stack TapStack-TapStackpr2295  error: error in compiling Go: unable to run `go build`: exit status 1
    pulumi:pulumi:Stack TapStack-TapStackpr2295  1 error; 9 messages
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2295):
    # github.com/TuringGpt/iac-test-automations/lib
    ./tap_stack.go:176:15: undefined: s3.NewBucketVersioning
    ./tap_stack.go:177:4: unknown field Bucket in struct literal of type s3.BucketVersioningArgs
    ./tap_stack.go:178:4: unknown field VersioningConfiguration in struct literal of type s3.BucketVersioningArgs
    ./tap_stack.go:178:33: undefined: s3.BucketVersioningVersioningConfigurationArgs
    ./tap_stack.go:187:15: undefined: s3.NewBucketServerSideEncryptionConfiguration
    ./tap_stack.go:188:4: unknown field Bucket in struct literal of type s3.BucketServerSideEncryptionConfigurationArgs
    ./tap_stack.go:189:4: unknown field Rules in struct literal of type s3.BucketServerSideEncryptionConfigurationArgs
    ./tap_stack.go:189:14: undefined: s3.BucketServerSideEncryptionConfigurationRuleArray

    error: error in compiling Go: unable to run `go build`: exit status 1

Diagnostics:
  aws:ec2:Subnet (hipaa-private-subnet-rds):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating EC2 Subnet: operation error EC2: CreateSubnet, https response error StatusCode: 400, RequestID: b66b0530-d956-4dbf-9ce3-ba465ee619bf, api error InvalidParameterValue: Value (us-west-2b) for parameter availabilityZone is invalid. Subnets can currently only be created in the following availability zones: us-east-1a, us-east-1b, us-east-1c, us-east-1d, us-east-1e, us-east-1f.: provider=aws@6.83.0
    error: 1 error occurred:
    	* creating EC2 Subnet: opera

can you help fixing all these errors and create all the resources, VPC and subnet and other resources in us-east-1, so update the response.

Getting these errors now

@ previewing update.......................................................................................................................
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refreshing # github.com/TuringGpt/iac-test-automations/lib
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refreshing ./tap_stack.go:198:4: unknown field ServerSideEncryptionConfigurations in struct literal of type s3.BucketServerSideEncryptionConfigurationV2Args
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refreshing ./tap_stack.go:198:43: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArray
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refreshing ./tap_stack.go:199:9: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refreshing ./tap_stack.go:200:16: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArray
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refreshing ./tap_stack.go:201:11: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refreshing ./tap_stack.go:202:48: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
@ previewing update....
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refreshing error: error in compiling Go: unable to run `go build`: exit status 1
 ~  pulumi:pulumi:Stack TapStack-TapStackpr2295 refresh 1 error; 7 messages
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2295):
    # github.com/TuringGpt/iac-test-automations/lib
    ./tap_stack.go:198:4: unknown field ServerSideEncryptionConfigurations in struct literal of type s3.BucketServerSideEncryptionConfigurationV2Args
    ./tap_stack.go:198:43: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArray
    ./tap_stack.go:199:9: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs
    ./tap_stack.go:200:16: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArray
    ./tap_stack.go:201:11: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs
    ./tap_stack.go:202:48: undefined: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs

    error: error in compiling Go: unable to run `go build`: exit status 1
```
