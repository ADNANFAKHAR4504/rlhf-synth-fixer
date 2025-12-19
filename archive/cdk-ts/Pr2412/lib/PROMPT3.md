The CDK infrastructure code is still encountering the same TypeScript compilation error despite previous attempts. Please provide a definitive solution that completely resolves this issue:

Persistent Error:
```
bin/tap.ts(21,3): error TS2353: Object literal may only specify known properties, and 'environmentSuffix' does not exist in type 'StackProps'.
Process completed with exit code 2.
```

Required Solution:
1. Create a completely clean implementation without any TypeScript interface issues
2. Ensure the stack constructor properly handles custom properties
3. Implement comprehensive resource naming strategy for deployment uniqueness
4. Include all required infrastructure components with proper configuration
5. Verify that all CDK constructs and properties are valid and current
6. Provide complete configuration files including tsconfig.json and cdk.json
7. Ensure the solution compiles and synthesizes successfully

The final implementation should be production-ready with no compilation errors, proper security configurations, and comprehensive infrastructure coverage for a scalable web application backend.