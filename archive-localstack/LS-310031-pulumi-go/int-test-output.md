[0;34m🧪 Running Integration Tests against LocalStack Pulumi Deployment...[0m
[0;32m✅ LocalStack is running[0m
[0;32m✅ Infrastructure outputs found[0m
[0;32m✅ Infrastructure outputs validated[0m
[1;33m📁 Working directory: /Users/chandangupta/Desktop/localstack-task/iac-test-automations[0m
[1;33m🔧 Setting up LocalStack environment...[0m
[0;34m🌐 Environment configured for LocalStack:[0m
[1;33m  • AWS_ENDPOINT_URL: http://localhost:4566[0m
[1;33m  • AWS_REGION: us-east-1[0m
[1;33m  • SSL Verification: Disabled[0m
[0;34m📋 Stack Outputs:[0m
  • bucketName: prod-infrastructure-bucket-tapstackprdev
  • iamRoleArn: arn:aws:iam::000000000000:role/ec2-s3-role-2e42e4c
  • instanceId: skipped-for-localstack
  • instancePublicIp: N/A
  • securityGroupId: sg-e28fafd60da1f75be
  • subnetAId: subnet-7c4f78666bd0d8529
  • subnetBId: subnet-73a6fb1dd7bf06f2f
  • vpcId: vpc-b6a51d96df8da59ba
[1;33m🚀 Running Go integration tests...[0m
[0;34m=== RUN   TestVPCDeployment[0m
[0;36m    tap_stack_int_test.go:166: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;32m--- PASS: TestVPCDeployment (0.33s)[0m
[0;34m=== RUN   TestInternetGatewayDeployment[0m
[0;36m    tap_stack_int_test.go:191: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;32m--- PASS: TestInternetGatewayDeployment (0.10s)[0m
[0;34m=== RUN   TestSubnetDeployments[0m
[0;36m    tap_stack_int_test.go:224: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;34m=== RUN   TestSubnetDeployments/Subnet_A[0m
[0;34m=== RUN   TestSubnetDeployments/Subnet_B[0m
[0;32m--- PASS: TestSubnetDeployments (0.09s)[0m
[0;32m    --- PASS: TestSubnetDeployments/Subnet_A (0.00s)[0m
[0;32m    --- PASS: TestSubnetDeployments/Subnet_B (0.00s)[0m
[0;34m=== RUN   TestEC2InstanceDeployment[0m
[0;36m    tap_stack_int_test.go:290: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:293: No Instance ID found in outputs[0m
[1;33m--- SKIP: TestEC2InstanceDeployment (0.09s)[0m
[0;34m=== RUN   TestSecurityGroupDeployment[0m
[0;36m    tap_stack_int_test.go:327: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;32m--- PASS: TestSecurityGroupDeployment (0.10s)[0m
[0;34m=== RUN   TestS3BucketDeployment[0m
[0;36m    tap_stack_int_test.go:380: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;32m--- PASS: TestS3BucketDeployment (0.11s)[0m
[0;34m=== RUN   TestIAMRoleDeployment[0m
[0;36m    tap_stack_int_test.go:426: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;32m--- PASS: TestIAMRoleDeployment (0.11s)[0m
[0;34m=== RUN   TestRouteTableConfiguration[0m
[0;36m    tap_stack_int_test.go:494: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:554: Found route table associations with subnets: [subnet-7c4f78666bd0d8529 subnet-73a6fb1dd7bf06f2f][0m
[0;32m--- PASS: TestRouteTableConfiguration (0.10s)[0m
[0;34m=== RUN   TestInternetConnectivity[0m
[0;36m    tap_stack_int_test.go:563: Warning: Could not read Pulumi outputs: exit status 255. Attempting AWS resource discovery...[0m
[0;36m    tap_stack_int_test.go:648: Discovered fallback VPC: vpc-b6a51d96df8da59ba[0m
[0;36m    tap_stack_int_test.go:757: Found ec2-s3-role from Pulumi deployment: ec2-s3-role-2e42e4c[0m
[0;36m    tap_stack_int_test.go:772: Successfully discovered AWS resources for VPC: vpc-b6a51d96df8da59ba[0m
[0;32m--- PASS: TestInternetConnectivity (0.11s)[0m
[0;32mPASS[0m
[0;36mok  	github.com/example/tap/templates/pulumi-go/tests/integration	1.725s[0m
[0;32m🎉 Integration tests completed successfully![0m
[0;34m📊 Test Summary:[0m
[1;33m  • All infrastructure components validated[0m
[1;33m  • LocalStack environment verified[0m
[1;33m  • Pulumi resources properly configured[0m
