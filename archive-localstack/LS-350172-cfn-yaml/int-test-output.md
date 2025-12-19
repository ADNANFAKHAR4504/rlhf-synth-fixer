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


up to date, audited 2335 packages in 30s

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

 PASS  test/tap-stack.int.test.ts (37.987 s)
  TapStack Infrastructure - Integration Tests
    1. User Access & Authentication Flow                                                         
      √ VPC and subnets exist for user access path (63 ms)                                       
    2. Application Data Processing Flow - EC2 to S3                                              
      √ S3 bucket is accessible and supports write/read operations (2060 ms)                     
      √ S3 bucket supports object listing operations (2032 ms)                                   
    3. Application Data Processing Flow - EC2 to RDS                                             
      √ database credentials can be retrieved from Secrets Manager (13 ms)                       
    4. Monitoring & Observability Flow                                                           
      √ EC2 instance logs should be available in CloudWatch Logs (9 ms)                          
      √ CloudWatch Logs can receive and retrieve log events (2035 ms)                            
    5. Network Traffic Flow - VPC Flow Logs                                                      
      √ VPC Flow Log groups exist for network traffic monitoring (6 ms)                          
    6. Data Persistence & Backup Flow                                                            
      √ S3 bucket should support versioning for data persistence (2027 ms)                       
    7. Security & Encryption Flow                                                                
      √ S3 objects should be encrypted with KMS when written (2018 ms)                           
      √ S3 encrypted objects can be read back (2041 ms)                                          
    8. High Availability & Resilience Flow                                                       
      √ private subnets exist across multiple availability zones (20 ms)                         
    9. Complete End-to-End Workflow                                                              
      √ Complete data flow: S3 -> CloudWatch Logs -> SNS (4080 ms)                               
      √ All required services are accessible: S3, Secrets Manager, CloudWatch Logs (25 ms)       
                                                                                                 
Test Suites: 1 passed, 1 total                                                                   
Tests:       13 passed, 13 total                                                                 
Snapshots:   0 total
Time:        41.066 s
Ran all test suites matching /.int.test.ts$/i.
🎉 Integration tests completed successfully!
📊 Test Summary:
  • All infrastructure components validated
  • LocalStack environment verified
  • Resources properly configured