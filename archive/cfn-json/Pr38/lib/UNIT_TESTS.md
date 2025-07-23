# Unit tests

```text

> tap@0.1.0 test:unit
> jest --coverage --testPathPattern=\.unit\.test\.ts$

PASS test/tap-stack.unit.test.ts
  TapStack CloudFormation Template
    Template Structure
      ✓ should have valid CloudFormation format version (2 ms)
      ✓ should have a description
      ✓ should have metadata section (1 ms)
    Parameters
      ✓ should have EnvironmentSuffix parameter
      ✓ EnvironmentSuffix parameter should have correct properties
    Resources
      ✓ should have TurnAroundPromptTable resource
      ✓ TurnAroundPromptTable should be a DynamoDB table
      ✓ TurnAroundPromptTable should have correct deletion policies (1 ms)
      ✓ TurnAroundPromptTable should have correct properties (1 ms)
      ✓ TurnAroundPromptTable should have correct attribute definitions (1 ms)
      ✓ TurnAroundPromptTable should have correct key schema
    Outputs
      ✓ should have all required outputs (6 ms)
      ✓ TurnAroundPromptTableName output should be correct
      ✓ TurnAroundPromptTableArn output should be correct (1 ms)
      ✓ StackName output should be correct
      ✓ EnvironmentSuffix output should be correct
    Template Validation
      ✓ should have valid JSON structure
      ✓ should not have any undefined or null required sections (1 ms)
      ✓ should have exactly one resource
      ✓ should have exactly one parameter
      ✓ should have exactly four outputs
    Resource Naming Convention
      ✓ table name should follow naming convention with environment suffix
      ✓ export names should follow naming convention

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |       0 |        0 |       0 |       0 |                   
----------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        0.621 s
Ran all test suites matching /.unit.test.ts$/i.
```
