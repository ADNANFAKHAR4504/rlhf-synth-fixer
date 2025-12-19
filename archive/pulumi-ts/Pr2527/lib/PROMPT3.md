The code you provided failed with the below mentioned build errors - 

```bash

> tap@0.1.0 build
> tsc --skipLibCheck

lib/secure-infrastructure.ts:683:7 - error TS2353: Object literal may only specify known properties, and 'resourceIds' does not exist in type 'FlowLogArgs'.

683       resourceIds: [this.vpc.id],
          ~~~~~~~~~~~

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


Found 3 errors in 2 files.

Errors  Files
     1  lib/secure-infrastructure.ts:683
     2  test/tap-stack.unit.test.ts:28
```