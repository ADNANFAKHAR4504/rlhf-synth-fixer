The code you provided has failed with these errors in the deployment -

```bash
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2420):
    (node:2600) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously (rejection id: 2)
    (Use `node --trace-warnings ...` to show where the warning was created)

    warning: BucketVersioningV2 is deprecated: aws.s3/bucketversioningv2.BucketVersioningV2 has been deprecated in favor of aws.s3/bucketversioning.BucketVersioning
    warning: BucketServerSideEncryptionConfigurationV2 is deprecated: aws.s3/bucketserversideencryptionconfigurationv2.BucketServerSideEncryptionConfigurationV2 has been deprecated in favor of aws.s3/bucketserversideencryptionconfiguration.BucketServerSideEncryptionConfiguration
    Downloading provider: aws
    error: Error: invocation of aws:rds/getEngineVersion:getEngineVersion returned an error: invoking aws:rds/getEngineVersion:getEngineVersion: 1 error occurred:
    	* no RDS engine versions match the criteria and preferred versions: &{<nil> <nil> 0xc00bdada80 <nil> [] <nil> 0xc00bd8ee70 0xc00bd8ee71 <nil> <nil> {}}
    [8.0.35 8.0.34 8.0.33]


        at Object.callback (/home/runner/work/iac-test-automations/iac-test-automations/node_modules/@pulumi/runtime/invoke.ts:272:37)
        at Object.onReceiveStatus (/home/runner/work/iac-test-automations/iac-test-automations/node_modules/@grpc/grpc-js/src/client.ts:360:26)
        at Object.onReceiveStatus (/home/runner/work/iac-test-automations/iac-test-automations/node_modules/@grpc/grpc-js/src/client-interceptors.ts:458:34)
        at Object.onReceiveStatus (/home/runner/work/iac-test-automations/iac-test-automations/node_modules/@grpc/grpc-js/src/client-interceptors.ts:419:48)
        at /home/runner/work/iac-test-automations/iac-test-automations/node_modules/@grpc/grpc-js/src/resolving-call.ts:169:24
        at processTicksAndRejections (node:internal/process/task_queues:85:11)

```
