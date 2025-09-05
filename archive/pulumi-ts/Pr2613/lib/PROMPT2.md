The code you provided is failing with the below mentioned build errors -

```bash
☺  npm run build                                                                                                                            IAC-348889 e3f5b9125f

> tap@0.1.0 build
> tsc --skipLibCheck

lib/webAppInfra.ts:533:9 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

533         port: '80',
            ~~~~

  node_modules/@pulumi/aws/lb/listener.d.ts:585:5
    585     port?: pulumi.Input<number>;
            ~~~~
    The expected type comes from property 'port' which is declared here on type 'ListenerArgs'

lib/webAppInfra.ts:637:9 - error TS2353: Object literal may only specify known properties, and 'tags' does not exist in type 'SelectionArgs'.

637         tags: allTags,
            ~~~~

test/tap-stack.unit.test.ts:28:9 - error TS2353: Object literal may only specify known properties, and 'stateBucket' does not exist in type 'TapStackArgs'.

28         stateBucket: "custom-state-bucket",
           ~~~~~~~~~~~

test/tap-stack.unit.test.ts:55:15 - error TS2554: Expected 2-3 arguments, but got 1.

55       stack = new TapStack("TestTapStackDefault");
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  lib/tap-stack.ts:53:29
    53   constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
                                   ~~~~~~~~~~~~~~~~~~
    An argument for 'args' was not provided.


Found 4 errors in 2 files.

Errors  Files
     2  lib/webAppInfra.ts:533
     2  test/tap-stack.unit.test.ts:28
```

Also refactor this asynchronous operation outside of the constructor
