The build passed but all tests failed with below error, please fix it as well:

$ npm run test

> tap@0.1.0 test
> jest --coverage

FAIL test/tap-stack.int.test.ts (26.421 s)
Integration Tests for TapStack
✕ should associate public subnets with the public route table (103 ms)
✕ should place the ALB in public subnets (1 ms)
✕ should place EC2 instances in public subnets and attach the correct security group (1 ms)
✕ should place the RDS instance in private subnets (1 ms)
✕ should configure the RDS security group to only allow traffic from EC2 instances (1 ms)

● Integration Tests for TapStack › should associate public subnets with the public route table

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      30 |
      31 |   it("should associate public subnets with the public route table", () => {
    > 32 |     expect(synthesized).toHaveResourceWithProperties(RouteTableAssociation, {
         |                         ^
      33 |       subnet_id: "${aws_subnet.public-subnet-a.id}",
      34 |       route_table_id: "${aws_route_table.public-rt.id}",
      35 |     });

      at Object.<anonymous> (test/tap-stack.int.test.ts:32:25)

● Integration Tests for TapStack › should place the ALB in public subnets

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      41 |
      42 |   it("should place the ALB in public subnets", () => {
    > 43 |     expect(synthesized).toHaveResourceWithProperties(Lb, {
         |                         ^
      44 |       subnets: [
      45 |         "${aws_subnet.public-subnet-a.id}",
      46 |         "${aws_subnet.public-subnet-b.id}",

      at Object.<anonymous> (test/tap-stack.int.test.ts:43:25)

● Integration Tests for TapStack › should place EC2 instances in public subnets and attach the correct security group

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      50 |
      51 |   it("should place EC2 instances in public subnets and attach the correct security group", () => {
    > 52 |     expect(synthesized).toHaveResourceWithProperties(Instance, {
         |                         ^
      53 |       subnet_id: "${aws_subnet.public-subnet-a.id}",
      54 |       vpc_security_group_ids: ["${aws_security_group.ec2-sg.id}"],
      55 |     });

      at Object.<anonymous> (test/tap-stack.int.test.ts:52:25)

● Integration Tests for TapStack › should place the RDS instance in private subnets

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      61 |
      62 |   it("should place the RDS instance in private subnets", () => {
    > 63 |     expect(synthesized).toHaveResourceWithProperties(DbInstance, {
         |                         ^
      64 |       db_subnet_group_name: "${aws_db_subnet_group.rds-subnet-group.name}",
      65 |       vpc_security_group_ids: ["${aws_security_group.rds-sg.id}"],
      66 |     });

      at Object.<anonymous> (test/tap-stack.int.test.ts:63:25)

● Integration Tests for TapStack › should configure the RDS security group to only allow traffic from EC2 instances

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      68 |
      69 |   it("should configure the RDS security group to only allow traffic from EC2 instances", () => {
    > 70 |     expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
         |                         ^
      71 |       name: expect.stringMatching(/^rds-sg-/),
      72 |       ingress: [
      73 |         {

      at Object.<anonymous> (test/tap-stack.int.test.ts:70:25)

FAIL test/tap-stack.unit.test.ts (26.426 s)
Unit Tests for TapStack
✕ should create a VPC (91 ms)
✕ should create four subnets (2 public, 2 private) (1 ms)
✕ should create a Multi-AZ RDS instance (1 ms)
✕ should enable server-side encryption for the S3 bucket
✕ should configure the EC2 security group with restricted ingress
✕ should create an IAM policy with least privilege

● Unit Tests for TapStack › should create a VPC

    TypeError: expect(...).toHaveResource is not a function

      31 |
      32 |   it("should create a VPC", () => {
    > 33 |     expect(synthesized).toHaveResource(Vpc);
         |                         ^
      34 |   });
      35 |
      36 |   it("should create four subnets (2 public, 2 private)", () => {

      at Object.<anonymous> (test/tap-stack.unit.test.ts:33:25)

● Unit Tests for TapStack › should create four subnets (2 public, 2 private)

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      35 |
      36 |   it("should create four subnets (2 public, 2 private)", () => {
    > 37 |     expect(synthesized).toHaveResourceWithProperties(Subnet, {
         |                         ^
      38 |       cidr_block: "10.0.1.0/24",
      39 |     });
      40 |     expect(synthesized).toHaveResourceWithProperties(Subnet, {

      at Object.<anonymous> (test/tap-stack.unit.test.ts:37:25)

● Unit Tests for TapStack › should create a Multi-AZ RDS instance

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      50 |
      51 |   it("should create a Multi-AZ RDS instance", () => {
    > 52 |     expect(synthesized).toHaveResourceWithProperties(DbInstance, {
         |                         ^
      53 |       multi_az: true,
      54 |       storage_encrypted: true,
      55 |     });

      at Object.<anonymous> (test/tap-stack.unit.test.ts:52:25)

● Unit Tests for TapStack › should enable server-side encryption for the S3 bucket

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      57 |
      58 |   it("should enable server-side encryption for the S3 bucket", () => {
    > 59 |     expect(synthesized).toHaveResourceWithProperties(
         |                         ^
      60 |       S3BucketServerSideEncryptionConfigurationA,
      61 |       {
      62 |         rule: [

      at Object.<anonymous> (test/tap-stack.unit.test.ts:59:25)

● Unit Tests for TapStack › should configure the EC2 security group with restricted ingress

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      72 |
      73 |   it("should configure the EC2 security group with restricted ingress", () => {
    > 74 |     expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
         |                         ^
      75 |       name: expect.stringMatching(/^ec2-sg-/),
      76 |       ingress: expect.arrayContaining([
      77 |         expect.objectContaining({

      at Object.<anonymous> (test/tap-stack.unit.test.ts:74:25)

● Unit Tests for TapStack › should create an IAM policy with least privilege

    TypeError: expect(...).toHaveResourceWithProperties is not a function

      92 |
      93 |   it("should create an IAM policy with least privilege", () => {
    > 94 |     expect(synthesized).toHaveResourceWithProperties(IamPolicy, {
         |                         ^
      95 |       name: expect.stringMatching(/^ec2-policy-/),
      96 |       policy: expect.stringContaining(
      97 |         '"Resource":"${aws_s3_bucket.storage-bucket.arn}/*"'

      at Object.<anonymous> (test/tap-stack.unit.test.ts:94:25)

--------------|---------|----------|---------|---------|-------------------
File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------|---------|----------|---------|---------|-------------------
All files | 100 | 100 | 100 | 100 |  
 tap-stack.ts | 100 | 100 | 100 | 100 |  
--------------|---------|----------|---------|---------|-------------------
Test Suites: 2 failed, 2 total
Tests: 11 failed, 11 total
Snapshots: 0 total
Time: 37.839 s
Ran all test suites.
