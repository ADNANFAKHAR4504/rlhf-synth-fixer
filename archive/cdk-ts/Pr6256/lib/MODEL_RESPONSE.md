# Model Response - VPC Infrastructure (With Training Flaws)

This implementation contains intentional mistakes for training purposes.

## File: lib/TapStack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // FLAW 1: CloudWatch Log Group missing - VPC Flow Logs won't work properly
    // FLAW 2: Missing 7-day retention requirement

    // FLAW 3: VPC created with only 2 AZs instead of 3
    // FLAW 4: NAT gateway count set to 1 instead of 3 (one per AZ)
    this.vpc = new ec2.Vpc(this, 'PaymentVpc', {
      vpcName: `payment-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // FLAW 3: Should be 3
      natGateways: 1, // FLAW 4: Should be 3

      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],

      // FLAW 5: VPC Flow Logs not configured at all
    });

    // FLAW 6: Missing Environment and Project tags
    cdk.Tags.of(this.vpc).add('Name', 'PaymentVPC');

    const publicSubnets = this.vpc.publicSubnets;
    const privateSubnets = this.vpc.privateSubnets;

    // FLAW 7: Network ACL created but rules are incomplete
    const networkAcl = new ec2.NetworkAcl(this, 'PaymentNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `payment-nacl-${environmentSuffix}`,
    });

    // FLAW 8: Only HTTPS rule added, missing MySQL and Redis
    networkAcl.addEntry('AllowHttpsInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('AllowHttpsOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // FLAW 9: Missing ephemeral ports for return traffic
    // FLAW 10: Missing explicit deny rules

    // FLAW 11: Network ACL not associated with private subnets

    // FLAW 12: S3 VPC Endpoint not created at all

    // FLAW 13: CloudFormation Outputs incomplete - missing several subnet IDs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    // FLAW 14: Only outputting first public subnet instead of all 3
    if (publicSubnets.length > 0) {
      new cdk.CfnOutput(this, 'PublicSubnetId', {
        value: publicSubnets[0].subnetId,
        description: 'Public Subnet ID',
      });
    }

    // FLAW 15: Private subnet outputs missing completely
    // FLAW 16: S3 Endpoint output missing (endpoint not created)
    // FLAW 17: Flow Logs log group output missing (log group not created)
  }
}
```

## File: bin/tap.ts

```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/TapStack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'VPC infrastructure for payment processing',
});

app.synth();
```

## File: test/TapStack.test.ts

```ts
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/TapStack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC created', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
  });

  test('Subnets created', () => {
    const subnets = template.findResources('AWS::EC2::Subnet');
    expect(Object.keys(subnets).length).toBeGreaterThan(0);
  });

  test('Internet Gateway created', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {});
  });
});
```

## File: package.json

```json
{
  "name": "payment-vpc-infrastructure",
  "version": "1.0.0",
  "description": "VPC infrastructure for payment processing",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "20.0.0",
    "aws-cdk": "2.100.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.0.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist"
  },
  "include": ["bin/**/*.ts", "lib/**/*.ts", "test/**/*.ts"],
  "exclude": ["node_modules", "cdk.out"]
}
```

## File: cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## File: jest.config.js

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
```

## File: .gitignore

```
*.js
!jest.config.js
*.d.ts
node_modules
cdk.out
.cdk.staging
```

## File: README.md

```markdown
# Payment VPC Infrastructure

VPC infrastructure for payment processing.

## Installation

```bash
npm install
```

## Deploy

```bash
npm run build
cdk deploy
```

## Test

```bash
npm test
```
```

## Summary of Training Flaws

This implementation contains 17 intentional flaws:

1. Missing CloudWatch Log Group for VPC Flow Logs
2. Missing 7-day retention requirement
3. VPC uses only 2 AZs instead of required 3
4. Only 1 NAT gateway instead of 3 (one per AZ)
5. VPC Flow Logs not configured
6. Missing required tags (Environment=Production, Project=PaymentGateway)
7. Network ACL created but rules incomplete
8. Missing MySQL (3306) and Redis (6379) rules
9. Missing ephemeral ports for return traffic
10. Missing explicit deny rules in Network ACL
11. Network ACL not associated with private subnets
12. S3 VPC Endpoint not created
13. CloudFormation outputs incomplete
14. Only one public subnet ID output instead of all 3
15. Private subnet outputs missing
16. S3 Endpoint output missing
17. Flow Logs log group output missing

Additional quality issues:
- Test coverage insufficient (only 3 basic tests)
- Missing comprehensive assertions for Network ACLs
- Missing validation for subnet count
- README lacks detailed documentation
- package.json missing useful scripts
