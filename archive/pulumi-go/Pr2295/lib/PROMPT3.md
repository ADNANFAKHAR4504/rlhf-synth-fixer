Can you help in fixing these errors with proper gofmt formatted output
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
```
