Getting this error in the tap_stack.go , can you help me to fix these errors and provide updated code -
```
Previewing update (TapStackpr2329):
[resource plugin aws-6.83.0] installing
@ previewing update..................................
@ previewing update...............................................................................................................................
    pulumi:pulumi:Stack TapStack-TapStackpr2329  # github.com/TuringGpt/iac-test-automations/lib
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ./tap_stack.go:563:15: undefined: s3.NewBucketVersioning
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ./tap_stack.go:564:4: unknown field Bucket in struct literal of type s3.BucketVersioningArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ./tap_stack.go:565:4: unknown field VersioningConfiguration in struct literal of type s3.BucketVersioningArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ./tap_stack.go:565:33: undefined: s3.BucketVersioningVersioningConfigurationArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ./tap_stack.go:574:15: undefined: s3.NewBucketServerSideEncryptionConfiguration
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ./tap_stack.go:575:4: unknown field Bucket in struct literal of type s3.BucketServerSideEncryptionConfigurationArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ./tap_stack.go:576:4: unknown field Rules in struct literal of type s3.BucketServerSideEncryptionConfigurationArgs
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ./tap_stack.go:576:14: undefined: s3.BucketServerSideEncryptionConfigurationRuleArray
    pulumi:pulumi:Stack TapStack-TapStackpr2329  error: error in compiling Go: unable to run `go build`: exit status 1
    pulumi:pulumi:Stack TapStack-TapStackpr2329  1 error; 9 messages
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2329):
    # github.com/TuringGpt/iac-test-automations/lib
    ./tap_stack.go:563:15: undefined: s3.NewBucketVersioning
    ./tap_stack.go:564:4: unknown field Bucket in struct literal of type s3.BucketVersioningArgs
    ./tap_stack.go:565:4: unknown field VersioningConfiguration in struct literal of type s3.BucketVersioningArgs
    ./tap_stack.go:565:33: undefined: s3.BucketVersioningVersioningConfigurationArgs
    ./tap_stack.go:574:15: undefined: s3.NewBucketServerSideEncryptionConfiguration
    ./tap_stack.go:575:4: unknown field Bucket in struct literal of type s3.BucketServerSideEncryptionConfigurationArgs
    ./tap_stack.go:576:4: unknown field Rules in struct literal of type s3.BucketServerSideEncryptionConfigurationArgs
    ./tap_stack.go:576:14: undefined: s3.BucketServerSideEncryptionConfigurationRuleArray
    error: error in compiling Go: unable to run `go build`: exit status 1
Error: Process completed with exit code 255.
```
