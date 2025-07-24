Here's a complete CDK TypeScript solution that meets the specified requirements:

**bin/multi-cloud-app.ts**
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MultiCloudStack } from '../lib/multi-cloud-stack';

const app = new cdk.App();

// Get environment from context
const envName = app.node.tryGetContext('env') || 'dev';
const cloudProvider = app.node.tryGetContext('cloud') || 'aws';

// Load configuration
const config = require(`../config/${envName}.json`);

new MultiCloudStack(app, `MultiCloudStack-${envName}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  },
  cloudProvider: cloudProvider,
  config: config
});
```

**lib/multi-cloud-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { InstanceClass, InstanceSize, InstanceType, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { Bucket } from 'aws-cdk-lib/aws-s3';

interface MultiCloudStackProps extends cdk.StackProps {
  cloudProvider: string;
  config: any;
}

export class MultiCloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MultiCloudStackProps) {
    super(scope, id, props);

    // Environment tagging
    cdk.Tags.of(this).add('Environment', props.config.environment);

    // Networking
    if (props.cloudProvider === 'aws') {
      const vpc = new Vpc(this, 'MainVPC', {
        cidr: props.config.network.cidr,
        maxAzs: 1,
        subnetConfiguration: [{
          subnetType: SubnetType.PUBLIC,
          name: 'PublicSubnet'
        }]
      });
      
      new cdk.CfnOutput(this, 'VPCID', { value: vpc.vpcId });
    } else {
      // Azure VNet placeholder
      new cdk.CfnOutput(this, 'AzureVNet', {
        value: `Would create Azure VNet with CIDR ${props.config.network.cidr}`
      });
    }

    // Compute
    if (props.cloudProvider === 'aws') {
      const ec2Instance = new cdk.aws_ec2.Instance(this, 'MainInstance', {
        vpc: Vpc.fromLookup(this, 'VPC', { vpcId: this.node.tryGetContext('vpcId') }),
        instanceType: InstanceType.of(
          InstanceClass.BURSTABLE2,
          InstanceSize.MICRO
        ),
        machineImage: new cdk.aws_ec2.AmazonLinuxImage()
      });

      ec2Instance.connections.allowFromAnyIpv4(Port.tcp(22));
    } else {
      // Azure VM placeholder
      new cdk.CfnOutput(this, 'AzureVM', {
        value: `Would create Azure VM with size ${props.config.compute.instanceSize}`
      });
    }

    // Storage
    if (props.cloudProvider === 'aws') {
      const bucket = new Bucket(this, 'MainBucket', {
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });
    } else {
      // Azure Storage Account placeholder
      new cdk.CfnOutput(this, 'AzureStorage', {
        value: `Would create Azure Storage Account ${props.config.storage.accountName}`
      });
    }
  }
}
```

**config/dev.json**
```json
{
  "environment": "dev",
  "awsRegion": "us-west-2",
  "network": {
    "cidr": "10.0.0.0/16"
  },
  "compute": {
    "instanceSize": "Standard_B1s"
  },
  "storage": {
    "accountName": "devstorageaccount"
  }
}
```

**config/staging.json**
```json
{
  "environment": "staging",
  "awsRegion": "us-east-1",
  "network": {
    "cidr": "10.1.0.0/16"
  },
  "compute": {
    "instanceSize": "Standard_B2s"
  },
  "storage": {
    "accountName": "stagingstorage"
  }
}
```

**config/prod.json**
```json
{
  "environment": "prod",
  "awsRegion": "eu-west-1",
  "network": {
    "cidr": "10.2.0.0/16"
  },
  "compute": {
    "instanceSize": "Standard_D2s_v3"
  },
  "storage": {
    "accountName": "prodstorage"
  }
}
```

**Key Architectural Notes:**
1. Cloud provider selection is handled via CDK context (`--context cloud=azure`)
2. Environment-specific configuration is loaded from JSON files
3. AWS resources use native CDK constructs while Azure uses placeholders
4. Would use Azure SDKs or cdktf for real Azure integration
5. Sensitive data handling would use AWS Secrets Manager for AWS and Azure Key Vault for Azure

To deploy:
```bash
cdk deploy --context env=dev --context cloud=aws
```

This implementation provides a foundation that could be extended with:
- Real Azure integration using cdktf
- Parameter validation
- More complex resource patterns
- CI/CD pipeline integration
- Cross-cloud resource dependencies