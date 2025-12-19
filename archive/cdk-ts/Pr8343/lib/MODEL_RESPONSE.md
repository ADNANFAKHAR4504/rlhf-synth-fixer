bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
const envName = app.node.tryGetContext('env') || 'dev';

new TapStack(app, 'TapStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  envName: envName
});
```

lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class TapStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const envName = props?.envName || 'dev';
    const vpc = new ec2.Vpc(this, `${envName}-vpc`, {
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          name: `${envName}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: `${envName}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        }
      ],
      natGateways: 0
    });

    const igw = new ec2.CfnInternetGateway(this, `${envName}-igw`);
    new ec2.CfnVPCGatewayAttachment(this, `${envName}-igw-attach`, {
      vpcId: vpc.vpcId,
      internetGatewayId: igw.ref
    });

    const publicRouteTable = vpc.publicSubnets[0].routeTable;
    publicRouteTable.addGatewayRoute('default', { gatewayId: igw.ref });
  }
}
```

cdk.json

```json
{
  "app": "npx ts-node bin/tap.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true",
    "aws-cdk:enableDiffNoFail": "true",
    "@aws-cdk/core:stackRelativeExports": "true"
  }
}
```