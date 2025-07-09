**Flaw1**

TSError: ⨯ Unable to compile TypeScript:
bin/tap.ts:3:10 - error TS2305: Module '"../lib/tap-stack"' has no exported member 'TapStack.  import { TapStack } from '../lib/tap-stack';

**Flaw2**

Namespace '"/Users/hmogollon/devel/me/tap/node_modules/aws-cdk-lib/index"' has no exported member ‘Construct’```
Easy catch
import { Construct } from "constructs”; —>  cdk.Construct —> Construct
 using latest cdk version

**Flaw3**

Property 'API_KEY' does not exist on type 'typeof AuthorizationType’`

**Flaw4**

Property 'JsonSchema' does not exist on type 'typeof import("/Users/hmogollon/devel/me/tap/node_modules/aws-cdk-lib/aws-apigateway/index”)

**Flaw 5**

Property 'role' does not exist on type 'AwsIntegration’.

**Flaw 6**

Property 'API_KEY' does not exist on type 'typeof AuthorizationType'.

**Flaw 7**

throw new Error(`There is already a Construct with name '${childName}' in ${typeName}${name.length > 0 ? ' [' + name + ']' : ''}`);         ^ Error: There is already a Construct with name 'TurnAroundPromptModel' in RestApi2 [TurnAroundPromptA

**Flaw 8**

Since this app includes more than a single stack, specify which stacks to use (wildcards are supported) or specify `--all` Stacks: TapStack/DynamoDBStack · TapStack/ApiGatewayStack · TapStack
cdk deploy TapStack