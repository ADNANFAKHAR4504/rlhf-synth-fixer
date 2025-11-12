```typescript
above code is failing with following errors at build stage fix and generate the code
Error: bin/tap.ts(21,3): error TS2353: Object literal may only specify known properties, and 'environmentSuffix' does not exist in type 'TapStackProps'.
Error: lib/tap-stack.ts(386,9): error TS2353: Object literal may only specify known properties, and 'throttleSettings' does not exist in type 'CfnStageProps'.
Error: Process completed with exit code 2.
```
