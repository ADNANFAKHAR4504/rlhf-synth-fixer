The code you provided failed with the below mentioned build errors - 

```bash

> tap@0.1.0 build
> tsc --skipLibCheck

lib/tap-stack.ts:87:63 - error TS2345: Argument of type 'Input<{ [key: string]: string; }>' is not assignable to parameter of type 'Record<string, string>'.
  Type 'Promise<{ [key: string]: string; }>' is not assignable to type 'Record<string, string>'.
    Index signature for type 'string' is missing in type 'Promise<{ [key: string]: string; }>'.

87     new WebAppInfrastructure('ap-south-1', environmentSuffix, tags);
                                                                 ~~~~

lib/webappinfra.ts:238:7 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

238       port: "80",
          ~~~~

  node_modules/@pulumi/aws/lb/listener.d.ts:585:5
    585     port?: pulumi.Input<number>;
            ~~~~
    The expected type comes from property 'port' which is declared here on type 'ListenerArgs'

lib/webappinfra.ts:250:7 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

250       port: "443",
          ~~~~

  node_modules/@pulumi/aws/lb/listener.d.ts:585:5
    585     port?: pulumi.Input<number>;
            ~~~~
    The expected type comes from property 'port' which is declared here on type 'ListenerArgs'


Found 2 errors in 1 files.

Errors  Files
     2  lib/webappinfra.ts:238
```