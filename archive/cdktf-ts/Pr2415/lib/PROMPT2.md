The build failed with below error:
$ npm run build

> tap@0.1.0 build
> tsc --skipLibCheck

test/tap-stack.int.test.ts:22:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

22 expect(synthesized).toHaveResourceWithProperties(RouteTableAssociation, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.int.test.ts:26:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

26 expect(synthesized).toHaveResourceWithProperties(RouteTableAssociation, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.int.test.ts:33:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

33 expect(synthesized).toHaveResourceWithProperties(Lb, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.int.test.ts:42:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

42 expect(synthesized).toHaveResourceWithProperties(Instance, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.int.test.ts:46:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

46 expect(synthesized).toHaveResourceWithProperties(Instance, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.int.test.ts:53:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

53 expect(synthesized).toHaveResourceWithProperties(DbInstance, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.int.test.ts:60:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

60 expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:23:25 - error TS2339: Property 'toHaveResource' does not exist on type 'JestMatchers<any>'.

23 expect(synthesized).toHaveResource(Vpc);
~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:28:21 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<string>'.

28 expect(subnets).toHaveResourceWithProperties(Subnet, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:31:21 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<string>'.

31 expect(subnets).toHaveResourceWithProperties(Subnet, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:34:21 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<string>'.

34 expect(subnets).toHaveResourceWithProperties(Subnet, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:37:21 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<string>'.

37 expect(subnets).toHaveResourceWithProperties(Subnet, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:43:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

43 expect(synthesized).toHaveResourceWithProperties(DbInstance, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:50:25 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<any>'.

50 expect(synthesized).toHaveResourceWithProperties(
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:66:19 - error TS2339: Property 'toHaveResourceWithProperties' does not exist on type 'JestMatchers<string>'.

66 expect(ec2Sg).toHaveResourceWithProperties(SecurityGroup, {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/tap-stack.unit.test.ts:88:44 - error TS2345: Argument of type 'typeof IamPolicy' is not assignable to parameter of type 'string'.

88 Testing.toHaveResourceWithProperties(IamPolicy, {}).properties.policy
~~~~~~~~~

test/tap-stack.unit.test.ts:88:59 - error TS2339: Property 'properties' does not exist on type 'boolean'.

88 Testing.toHaveResourceWithProperties(IamPolicy, {}).properties.policy
~~~~~~~~~~

Found 17 errors in 2 files.

Errors Files
7 test/tap-stack.int.test.ts:22
10 test/tap-stack.unit.test.ts:23
