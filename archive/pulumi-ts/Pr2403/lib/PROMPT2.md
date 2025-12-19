The code you provided is failing with build errors -

```bash
lib/infrastructure-stack.ts:144:7 - error TS2353: Object literal may only specify known properties, and 'keySpec' does not exist in type 'KeyArgs'.

144       keySpec: "SYMMETRIC_DEFAULT",
          ~~~~~~~

lib/infrastructure-stack.ts:169:7 - error TS2353: Object literal may only specify known properties, and 'publicAccessBlock' does not exist in type 'BucketArgs'.

169       publicAccessBlock: {
          ~~~~~~~~~~~~~~~~~

lib/infrastructure-stack.ts:283:7 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

283       port: "80",
          ~~~~

  node_modules/@pulumi/aws/lb/listener.d.ts:585:5
    585     port?: pulumi.Input<number>;
            ~~~~
    The expected type comes from property 'port' which is declared here on type 'ListenerArgs'

lib/infrastructure-stack.ts:437:7 - error TS2353: Object literal may only specify known properties, and 'publicAccessBlock' does not exist in type 'BucketArgs'.

437       publicAccessBlock: {
          ~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:28:9 - error TS2353: Object literal may only specify known properties, and 'stateBucket' does not exist in type 'TapStackArgs'.

28         stateBucket: "custom-state-bucket",
           ~~~~~~~~~~~


Found 4 errors in 1 files.

Errors  Files
     4  lib/infrastructure-stack.ts:144
```