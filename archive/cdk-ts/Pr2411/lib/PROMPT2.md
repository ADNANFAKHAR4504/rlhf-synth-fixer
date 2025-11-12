Above code is failed with following errors fix and generate the code|

```typescript
Error: bin/tap.ts(21,3): error TS2353: Object literal may only specify known properties, and 'environmentSuffix' does not exist in type 'TapStackProps'.
Error: lib/tap-stack.ts(362,9): error TS2353: Object literal may only specify known properties, and 'throttleSettings' does not exist in type 'StageOptions'.
Error: lib/tap-stack.ts(505,7): error TS2322: Type '{ ruleName: string; priority: number; fixedRate: number; reservoirSize: number; serviceName: string; serviceType: string; host: string; httpMethod: string; urlPath: string; version: number; }' is not assignable to type 'IResolvable | SamplingRuleProperty | undefined'.
  Property 'resourceArn' is missing in type '{ ruleName: string; priority: number; fixedRate: number; reservoirSize: number; serviceName: string; serviceType: string; host: string; httpMethod: string; urlPath: string; version: number; }' but required in type 'SamplingRuleProperty'.
Error: Process completed with exit code 2.
```
