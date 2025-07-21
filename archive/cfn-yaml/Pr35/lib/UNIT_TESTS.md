# Unit tests

```text

> tap@0.1.0 test:unit
> jest --coverage --testPathPattern=\.unit\.test\.ts$

PASS test/tap-stack.unit.test.ts
  TapStack CloudFormation Template
    Template Structure
      ✓ should have valid CloudFormation format version (3 ms)
      ✓ should have a description (1 ms)
      ✓ should have metadata section
    Parameters
      ✓ should have EnvironmentSuffix parameter
      ✓ EnvironmentSuffix parameter should have correct properties (2 ms)
    Resources
      ✓ should have TurnAroundPromptTable resource
      ✓ TurnAroundPromptTable should be a DynamoDB table (1 ms)
      ✓ TurnAroundPromptTable should have correct deletion policies (1 ms)
      ✓ TurnAroundPromptTable should have correct properties (2 ms)
      ✓ TurnAroundPromptTable should have correct attribute definitions (1 ms)
      ✓ TurnAroundPromptTable should have correct key schema (1 ms)
    Outputs
      ✓ should have all required outputs (12 ms)
      ✓ TurnAroundPromptTableName output should be correct (1 ms)
      ✓ TurnAroundPromptTableArn output should be correct (3 ms)
      ✓ StackName output should be correct
      ✓ EnvironmentSuffix output should be correct (1 ms)
    Template Validation
      ✓ should have valid JSON structure (1 ms)
      ✓ should not have any undefined or null required sections
    Resource Naming Convention
      ✓ table name should follow naming convention with environment suffix
      ✓ export names should follow naming convention (6 ms)

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |       0 |        0 |       0 |       0 |                   
----------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        0.635 s
Ran all test suites matching /.unit.test.ts$/i.
```
