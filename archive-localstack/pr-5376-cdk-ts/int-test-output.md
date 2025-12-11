
> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /mnt/d/Projects/Turing/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /mnt/d/Projects/Turing/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
  console.warn
    Skipping test: VPC ID not available

      21 |     it('should have VPC in eu-central-1 region', () => {
      22 |       if (!outputs || !outputs.vpcId) {
    > 23 |         console.warn('Skipping test: VPC ID not available');
         |                 ^
      24 |         return;
      25 |       }
      26 |       // VPC ID format indicates it's from the correct region

      at Object.<anonymous> (test/tap-stack.int.test.ts:23:17)

  console.warn
    Skipping test: VPC ID not available

      212 |     it('should have valid VPC ID format', () => {
      213 |       if (!outputs || !outputs.vpcId) {
    > 214 |         console.warn('Skipping test: VPC ID not available');
          |                 ^
      215 |         return;
      216 |       }
      217 |       expect(outputs.vpcId).toMatch(/^vpc-/);

      at Object.<anonymous> (test/migration-infrastructure.int.test.ts:214:17)

PASS test/migration-infrastructure.int.test.ts (8.55 s)
  Migration Infrastructure Integration Tests
    NAT Gateway Configuration
      ✓ should have public IP address assigned (69 ms)
    VPC Endpoint Configuration
      ✓ should have S3 VPC endpoint configured
    EC2 Instance Configuration
      ✓ should have two EC2 instances running (1 ms)
      ✓ should have instances in private subnets
      ✓ should use t3.medium instance type (1 ms)
      ✓ should have IAM instance profile attached
    Security Group Configuration
      ✓ should have EC2 and RDS security groups (1 ms)
      ✓ should have RDS security group allowing MySQL from EC2 SG
    RDS Configuration
      ✓ should have RDS MySQL instance running (1 ms)
      ✓ should have storage encryption enabled
      ✓ should not be publicly accessible (1 ms)
      ✓ should have automated backups configured
      ✓ should be in private subnets
      ✓ should have correct endpoint format (1 ms)
    S3 Bucket Configuration
      ✓ should have S3 bucket created
      ✓ should have versioning enabled (1 ms)
      ✓ should have server-side encryption configured (2 ms)
    IAM Configuration
      ✓ should have EC2 IAM role created (1 ms)
      ✓ should have instance profile created
      ✓ should have S3 policy attached to EC2 role
      ✓ should have S3 replication role created (1 ms)
    Resource Outputs
      ✓ should have all required outputs defined
      ✓ should have valid VPC ID format (593 ms)
      ✓ should have valid subnet ID formats
      ✓ should have valid S3 ARN format (1 ms)
      ✓ should have valid VPC endpoint ID format
      ✓ should have valid private IP addresses
    High Availability Validation
      ✓ should have resources distributed across multiple AZs
      ✓ should have EC2 instances in different AZs

  console.warn
    Skipping test: public subnet IDs not available

      45 |     it('should have valid subnet IDs', () => {
      46 |       if (!outputs || !outputs.publicSubnetIds) {
    > 47 |         console.warn('Skipping test: public subnet IDs not available');
         |                 ^
      48 |         return;
      49 |       }
      50 |       if (Array.isArray(outputs.publicSubnetIds)) {

      at Object.<anonymous> (test/tap-stack.int.test.ts:47:17)

  console.warn
    Skipping test: private subnet IDs not available

      69 |     it('should have valid private subnet IDs', () => {
      70 |       if (!outputs || !outputs.privateSubnetIds) {
    > 71 |         console.warn('Skipping test: private subnet IDs not available');
         |                 ^
      72 |         return;
      73 |       }
      74 |       if (Array.isArray(outputs.privateSubnetIds)) {

      at Object.<anonymous> (test/tap-stack.int.test.ts:71:17)

  console.warn
    Skipping test: bastion public IP not available

      93 |     it('should have valid public IP format', () => {
      94 |       if (!outputs || !outputs.bastionPublicIp) {
    > 95 |         console.warn('Skipping test: bastion public IP not available');
         |                 ^
      96 |         return;
      97 |       }
      98 |       expect(outputs.bastionPublicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

      at Object.<anonymous> (test/tap-stack.int.test.ts:95:17)

PASS test/tap-stack.int.test.ts (8.591 s)
  TapStack Integration Tests
    VPC Infrastructure
      ✓ should have VPC in eu-central-1 region (677 ms)
    Public Subnets
      ✓ should have 3 public subnets deployed
      ✓ should have valid subnet IDs (13 ms)
    Private Subnets
      ✓ should have 3 private subnets deployed (1 ms)
      ✓ should have valid private subnet IDs (10 ms)
    Bastion Host
      ✓ should have bastion host with public IP (1 ms)
      ✓ should have valid public IP format (6 ms)
    Network Configuration
      ✓ should have resources in multiple availability zones (1 ms)
    VPC Flow Logs
      ✓ should have flow logs bucket configured (2 ms)
    High Availability
      ✓ should have resources distributed across availability zones
    Stack Outputs Format
      ✓ should have properly formatted outputs
      ✓ should not have undefined or null critical values
    Integration Test Setup
      ✓ should have cfn-outputs directory structure (4 ms)

Test Suites: 2 passed, 2 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        17.767 s, estimated 42 s
Ran all test suites matching /.int.test.ts$/i.
