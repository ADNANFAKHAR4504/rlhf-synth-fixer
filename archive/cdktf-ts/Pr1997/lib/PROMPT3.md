our last fix worked, but build still failed with a new errors:

```
'"@cdktf/provider-aws"' has no exported member named 'AwsProvider'. Did you mean 'provider'?ts(2724)
Module '"@cdktf/provider-aws"' has no exported member 's3BucketReplication'.ts(2305)
'"@cdktf/provider-aws"' has no exported member named 'cloudtrailTrail'. Did you mean 'cloudtrail'?ts(2724)
Property 'S3BucketServerSideEncryptionConfiguration' does not exist on type 'typeof import("/Users/user/Documents/My_Turing/iac-test-automations/node_modules/@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration/index")'. Did you mean 'S3BucketServerSideEncryptionConfigurationA'?ts(2551)
index.d.ts(123, 22): 'S3BucketServerSideEncryptionConfigurationA' is declared here.
Property 'S3BucketVersioning' does not exist on type 'typeof import("/Users/user/Documents/My_Turing/iac-test-automations/node_modules/@cdktf/provider-aws/lib/s3-bucket-versioning/index")'. Did you mean 'S3BucketVersioningA'?ts(2551)
index.d.ts(74, 22): 'S3BucketVersioningA' is declared here.
Property 'S3BucketLogging' does not exist on type 'typeof import("/Users/user/Documents/My_Turing/iac-test-automations/node_modules/@cdktf/provider-aws/lib/s3-bucket-logging/index")'. Did you mean 'S3BucketLoggingA'?ts(2551)
index.d.ts(229, 22): 'S3BucketLoggingA' is declared here.
'backupPlan' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.ts(7022)
```