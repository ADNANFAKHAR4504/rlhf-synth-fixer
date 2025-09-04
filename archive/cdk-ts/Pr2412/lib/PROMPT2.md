The previous CDK implementation failed with a TypeScript compilation error. Please fix the following issue and generate a corrected version:

Error encountered:
```
bin/tap.ts(21,3): error TS2353: Object literal may only specify known properties, and 'environmentSuffix' does not exist in type 'StackProps'.
Process completed with exit code 2.
```

The issue is that the code attempts to pass custom properties to the CDK Stack constructor without properly defining the TypeScript interface. Please provide a corrected implementation that:

1. Defines a proper interface extending StackProps to include custom properties
2. Updates the stack constructor to use the new interface
3. Ensures all TypeScript types are correctly defined
4. Maintains the same infrastructure functionality
5. Includes proper error handling and resource configuration

The solution should compile successfully without any TypeScript errors while preserving all the infrastructure components and functionality.
