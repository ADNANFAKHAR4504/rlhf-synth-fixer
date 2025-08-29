The code you provided is failing with the below mentioned build errors -

```bash

> tap@0.1.0 build
> tsc --skipLibCheck

lib/infrastructure.ts:341:11 - error TS2353: Object literal may only specify known properties, and 'serverSideEncryptionConfiguration' does not exist in type 'BucketServerSideEncryptionConfigurationV2Args'.

341           serverSideEncryptionConfiguration: {
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/infrastructure.ts:496:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

496     pulumi.export('vpcId', this.vpc.id);
               ~~~~~~

lib/infrastructure.ts:497:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

497     pulumi.export('publicSubnetId', this.publicSubnet.id);
               ~~~~~~

lib/infrastructure.ts:498:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

498     pulumi.export('privateSubnetId', this.privateSubnet.id);
               ~~~~~~

lib/infrastructure.ts:499:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

499     pulumi.export('ec2InstanceId', this.ec2Instance.id);
               ~~~~~~

lib/infrastructure.ts:500:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

500     pulumi.export('ec2PublicIp', this.ec2Instance.publicIp);
               ~~~~~~

lib/infrastructure.ts:501:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

501     pulumi.export('rdsEndpoint', this.rdsInstance.endpoint);
               ~~~~~~

lib/infrastructure.ts:502:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

502     pulumi.export('s3BucketName', this.s3Bucket.bucket);
               ~~~~~~

lib/infrastructure.ts:503:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

503     pulumi.export('iamRoleArn', this.iamRole.arn);
               ~~~~~~

lib/infrastructure.ts:504:12 - error TS2339: Property 'export' does not exist on type 'typeof import("/Users/manish.kumar/Library/CloudStorage/OneDrive-Avalara/Documents/test/iac-test-automations/node_modules/@pulumi/pulumi/index")'.

504     pulumi.export('cloudWatchLogGroup', this.cloudWatchLogGroup.name);
               ~~~~~~


Found 12 errors in 2 files.

Errors  Files
    10  lib/infrastructure.ts:341
```
