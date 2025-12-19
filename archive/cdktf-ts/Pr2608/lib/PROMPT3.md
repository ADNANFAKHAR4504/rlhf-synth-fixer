The build failed:
"$ npm run build

> tap@0.1.0 build
> tsc --skipLibCheck

lib/tap-stack.ts:26:10 - error TS2724: '"@cdktf/provider-aws/lib/s3-bucket-replication-configuration"' has no exported member named 'S3BucketReplicationConfiguration'. Did you mean 'S3BucketReplicationConfigurationA'?

26 import { S3BucketReplicationConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-replication-configuration";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

node_modules/@cdktf/provider-aws/lib/s3-bucket-replication-configuration/index.d.ts:644:22
644 export declare class S3BucketReplicationConfigurationA extends cdktf.TerraformResource {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'S3BucketReplicationConfigurationA' is declared here.

test/tap-stack.unit.test.ts:15:10 - error TS2724: '"@cdktf/provider-aws/lib/s3-bucket-replication-configuration"' has no exported member named 'S3BucketReplicationConfiguration'. Did you mean 'S3BucketReplicationConfigurationA'?

15 import { S3BucketReplicationConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-replication-configuration";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

node_modules/@cdktf/provider-aws/lib/s3-bucket-replication-configuration/index.d.ts:644:22
644 export declare class S3BucketReplicationConfigurationA extends cdktf.TerraformResource {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
'S3BucketReplicationConfigurationA' is declared here.

Found 2 errors in 2 files.

Errors Files
1 lib/tap-stack.ts:26"
