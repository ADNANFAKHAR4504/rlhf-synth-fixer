The code you provided again failed with the error in the build phase -

```bash
 tap@0.1.0 build
> tsc --skipLibCheck

lib/webAppInfra.ts:533:9 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

533         port: '80',
            ~~~~

  node_modules/@pulumi/aws/lb/listener.d.ts:585:5
    585     port?: pulumi.Input<number>;
            ~~~~
    The expected type comes from property 'port' which is declared here on type 'ListenerArgs'
```
