> tap@0.1.0 localstack:cfn:test
> ./scripts/localstack-cloudformation-test.sh

🧪 Running Integration Tests against LocalStack...
✅ LocalStack is running
✅ Infrastructure outputs found
✅ Infrastructure outputs validated
📦 Installing npm dependencies...

> tap@0.1.0 preinstall
> echo 'Skipping version checks for CI/CD'

Skipping version checks for CI/CD

> tap@0.1.0 prepare
> husky


up to date, audited 2335 packages in 10s

308 packages are looking for funding
  run `npm fund` for details

17 vulnerabilities (5 low, 1 moderate, 11 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
✅ Dependencies installed successfully
🔧 Setting up LocalStack environment...
🌐 Environment configured for LocalStack:
  • AWS_ENDPOINT_URL: http://localhost:4566
  • AWS_REGION: us-east-1
  • SSL Verification: Disabled
🚀 Starting integration tests...

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in C:/Users/mikia/Desktop/IAC/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules

 PASS  test/tap-stack.int.test.ts (5.774 s)
  TapStack End-to-End Data Flow Integration Tests
    Complete Data Flow: S3 -> CloudWatch Logs -> SNS                                                  
      √ writes artifact, records log, and publishes SNS notification (2119 ms)                        
    Data Flow: CloudWatch logs written and retrieved
      √ log stream entries appear and log group exists (2050 ms)                                      
    Data Flow: SNS notification published and received                                                
      √ topic accepts publish and exposes attributes (21 ms)                                          
    Networking: Route tables and security groups                                                      
      √ route tables include default internet route for public subnet (14 ms)                         
      √ security groups referenced in outputs exist (12 ms)                                           
    Networking: VPC endpoints                                                                         
      √ S3 VPC endpoint exists when declared (1 ms)                                                   
                                                                                                      
Test Suites: 1 passed, 1 total                                                                        
Tests:       6 passed, 6 total                                                                        
Snapshots:   0 total
Time:        6.137 s
Ran all test suites matching /.int.test.ts$/i.
🎉 Integration tests completed successfully!
📊 Test Summary:
  • All infrastructure components validated
  • LocalStack environment verified
  • Resources properly configured