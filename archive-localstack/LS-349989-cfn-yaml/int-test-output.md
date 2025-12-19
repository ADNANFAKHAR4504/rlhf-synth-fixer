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


up to date, audited 2335 packages in 9s

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

  console.warn
    Could not retrieve stack resources for TapStackdev

      125 |       setResourceIndex(items);
      126 |     } catch (error) {
    > 127 |       console.warn(`Could not retrieve stack resources for ${stackName}`);
          |               ^
      128 |     }
      129 |   }
      130 | });

      at Object.<anonymous> (test/tap-stack.int.test.ts:127:15)

 PASS  test/tap-stack.int.test.ts
  TapStack Production Integration Tests
    Infrastructure Prerequisites                                                                 
      √ AWS credentials are properly configured (2 ms)                                           
      √ CloudFormation stack is deployed and operational (8 ms)                                  
      √ deployment outputs are accessible                                                        
    Network Infrastructure Validation                                                            
      √ VPC is properly configured with DNS resolution                                           
      √ public subnets are configured for internet access (1 ms)                                 
      √ private subnets are properly isolated                                                    
      √ NAT Gateway provides outbound internet access for private subnets                        
      √ routing tables are properly configured                                                   
    Security Configuration Validation                                                            
      √ web tier security group allows HTTP and HTTPS traffic                                    
      √ database tier security group restricts access to web tier only                           
      √ lambda security group allows HTTPS egress (10 ms)                                        
    Compute Infrastructure Validation                                                            
      √ web server is deployed in private subnet with encrypted storage (1 ms)                   
      √ lambda function is configured with VPC access (6 ms)                                     
    Storage Infrastructure Validation                                                            
      √ data bucket is encrypted and versioned                                                   
      √ logs bucket is encrypted for ALB access logs                                             
    Database Infrastructure Validation                                                           
      √ database secret is properly stored in Secrets Manager                                    
      √ database subnet group is configured (9 ms)                                               
      √ RDS instance is properly configured with security best practices (7 ms)                  
    Load Balancer Infrastructure Validation                                                      
      √ application load balancer is internet-facing and operational (10 ms)                     
      √ target group is configured with health checks (9 ms)                                     
      √ target group has healthy targets (8 ms)                                                  
    API Gateway Infrastructure Validation                                                        
      √ REST API is deployed and accessible                                                      
      √ API Gateway log group is configured for monitoring (12 ms)                               
      √ API endpoint is functional and returns valid responses (6 ms)                            
    End-to-End Functional Flow                                                                   
      √ ALB serves site content from EC2                                                         
      √ DB connectivity status is exposed via web page                                           
      √ API Gateway -> Lambda -> S3 (put then get)                                               
    IAM Security Validation                                                                      
      √ EC2 role has appropriate permissions (12 ms)                                             
      √ Lambda role has VPC execution permissions (12 ms)                                        
      √ API Gateway role is configured for CloudWatch logging (15 ms)                            
    Monitoring and Observability Validation                                                      
      √ CloudWatch alarms are configured for critical metrics (14 ms)                            
      √ SNS topic for alarms exists (11 ms)                                                      
      √ VPC Flow Logs are enabled for network monitoring (9 ms)                                  
    Security Services Validation                                                                 
      √ GuardDuty detector is enabled for threat detection                                       
    End-to-End Integration Testing                                                               
      √ ALB to EC2 connectivity works through target group (6 ms)                                
      √ Lambda function can access VPC resources (6 ms)                                          
      √ RDS database is accessible from application tier (6 ms)
      √ S3 buckets are accessible and properly configured                                        
      √ complete infrastructure stack is operational (6 ms)                                      
                                                                                                 
Test Suites: 1 passed, 1 total                                                                   
Tests:       39 passed, 39 total                                                                 
Snapshots:   0 total
Time:        2.851 s, estimated 3 s
Ran all test suites matching /.int.test.ts$/i.
🎉 Integration tests completed successfully!
📊 Test Summary:
  • All infrastructure components validated
  • LocalStack environment verified
  • Resources properly configured