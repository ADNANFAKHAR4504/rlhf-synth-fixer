The code you provided is failing with the below mentioned errors - 

```bash
> tsc --skipLibCheck

lib/environmentMigrationStack.ts:463:7 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

463       port: "80",
          ~~~~

  node_modules/@pulumi/aws/lb/listener.d.ts:585:5
    585     port?: pulumi.Input<number>;
            ~~~~
    The expected type comes from property 'port' which is declared here on type 'ListenerArgs'
```

Also please add all the appropriate outputs so that those can be used outside
