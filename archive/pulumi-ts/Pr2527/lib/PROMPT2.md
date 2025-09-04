The code you provided is failing with the following build errors - 

```bash
> tap@0.1.0 build
> tsc --skipLibCheck

lib/secure-infrastructure.ts:467:9 - error TS2353: Object literal may only specify known properties, and 'serverSideEncryptionConfiguration' does not exist in type 'BucketServerSideEncryptionConfigurationV2Args'.

467         serverSideEncryptionConfiguration: {
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/secure-infrastructure.ts:525:9 - error TS2353: Object literal may only specify known properties, and 'serverSideEncryptionConfiguration' does not exist in type 'BucketServerSideEncryptionConfigurationV2Args'.

525         serverSideEncryptionConfiguration: {
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/secure-infrastructure.ts:559:9 - error TS2353: Object literal may only specify known properties, and 'secretString' does not exist in type 'SecretArgs'.

559         secretString: JSON.stringify({
            ~~~~~~~~~~~~

lib/secure-infrastructure.ts:582:9 - error TS2353: Object literal may only specify known properties, and 'secretString' does not exist in type 'SecretArgs'.

582         secretString: JSON.stringify({
            ~~~~~~~~~~~~

lib/secure-infrastructure.ts:852:9 - error TS2353: Object literal may only specify known properties, and 'resourceId' does not exist in type 'FlowLogArgs'.

852         resourceId: this.vpc.id,
            ~~~~~~~~~~

test/tap-stack.unit.test.ts:28:9 - error TS2353: Object literal may only specify known properties, and 'stateBucket' does not exist in type 'TapStackArgs'.

28         stateBucket: "custom-state-bucket",
           ~~~~~~~~~~~

Found 5 errors in 1 files.

Errors  Files
     5  lib/secure-infrastructure.ts:467
```