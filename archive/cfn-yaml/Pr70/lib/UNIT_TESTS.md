# Unit tests

```text

> tap@0.1.0 test:unit
> jest --coverage --testPathPattern=\.unit\.test\.ts$

PASS test/tap-stack.unit.test.ts
  TapStack CloudFormation Template
    Template Structure
      ✓ should have valid CloudFormation format version (2 ms)
      ✓ should have a description (1 ms)
      ✓ should have metadata section (1 ms)
    Parameters
      ✓ should have EnvironmentSuffix parameter (1 ms)
      ✓ LatestAmiId parameter should have correct properties (1 ms)
      ✓ should have LatestAmiId parameter
      ✓ EC2InstanceProfile should reference the correct role (1 ms)
      ✓ EnvironmentSuffix parameter should have correct properties
    Resources
      ✓ should have SharedVPC resource
      ✓ SharedVPC should have correct tags (1 ms)
      ✓ should have PublicSubnet resource (1 ms)
      ✓ PublicSubnet should have correct tags
      ✓ should have AppS3Bucket resource
      ✓ AppS3Bucket should have correct bucket name and tags
      ✓ should have AppSecurityGroup resource (6 ms)
      ✓ AppSecurityGroup should have correct properties
      ✓ should have EC2InstanceRole resource
      ✓ EC2InstanceRole should have correct properties (1 ms)
      ✓ should have EC2InstanceProfile resource
      ✓ should have ProductionOnlyInstance resource
      ✓ ProductionOnlyInstance should have correct properties (1 ms)
    Outputs
      ✓ should have StackName output
      ✓ should have EnvironmentSuffix output (1 ms)

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |       0 |        0 |       0 |       0 |                   
----------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        0.585 s
Ran all test suites matching /.unit.test.ts$/i.
```
