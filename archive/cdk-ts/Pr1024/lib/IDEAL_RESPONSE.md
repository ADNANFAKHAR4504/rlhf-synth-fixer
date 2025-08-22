```typescript
// cfn-utils.ts

```

```typescript
// security-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecurityStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Determine if this is the primary region
    const currentRegion = cdk.Stack.of(this).region;
    const isPrimaryRegion = currentRegion === 'us-east-1';

    // Multi-Region VPC with conditional CIDR
    this.vpc = new ec2.Vpc(this, 'FinancialServicesVPC', {
      ipAddresses: ec2.IpAddresses.cidr(
        isPrimaryRegion ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      vpcName: `FinancialServices-VPC-${environmentSuffix}`,
    });

    // KMS Key for Financial Services with rotation
    this.kmsKey = new kms.Key(this, 'FinancialServicesKMSKey', {
      description: 'Customer-managed KMS key for Financial Services encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
    });

    // KMS Key Alias
    new kms.Alias(this, 'FinancialServicesKMSKeyAlias', {
      aliasName: `alias/financial-services-${environmentSuffix}`,
      targetKey: this.kmsKey,
    });

    // Lambda Security Group
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: this.vpc,
        description:
          'Security group for Lambda functions in Financial Services infrastructure',
        securityGroupName: `Lambda-SecurityGroup-${environmentSuffix}`,
      }
    );

    // Add ingress rule for HTTPS from VPC
    this.lambdaSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS access from VPC'
    );

    // Add egress rule for HTTPS outbound
    this.lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound access'
    );

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'FinancialServices');

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'ID of the Financial Services VPC',
      exportName: `${cdk.Stack.of(this).stackName}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.kmsKey.keyId,
      description: 'ID of the Financial Services KMS Key',
      exportName: `${cdk.Stack.of(this).stackName}-KMS-Key-ID`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: this.lambdaSecurityGroup.securityGroupId,
      description: 'ID of the Lambda Security Group',
      exportName: `${cdk.Stack.of(this).stackName}-Lambda-SG-ID`,
    });
  }
}

```

```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly turnAroundPromptTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Determine if this is the primary region
    const currentRegion = this.region;
    const isPrimaryRegion =
      currentRegion === 'us-east-1' || currentRegion === cdk.Aws.NO_VALUE;

    // Multi-Region VPC with conditional CIDR
    this.vpc = new ec2.Vpc(this, 'FinancialServicesVPC', {
      ipAddresses: ec2.IpAddresses.cidr(
        isPrimaryRegion ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      vpcName: `FinancialServices-VPC-${environmentSuffix}`,
    });

    // KMS Key for Financial Services with rotation
    this.kmsKey = new kms.Key(this, 'FinancialServicesKMSKey', {
      description: 'Customer-managed KMS key for Financial Services encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
    });

    // KMS Key Alias
    new kms.Alias(this, 'FinancialServicesKMSKeyAlias', {
      aliasName: `alias/financial-services-${environmentSuffix}`,
      targetKey: this.kmsKey,
    });

    // Lambda Security Group
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: this.vpc,
        description:
          'Security group for Lambda functions in Financial Services infrastructure',
        securityGroupName: `Lambda-SecurityGroup-${environmentSuffix}`,
        allowAllOutbound: false, // We'll define specific egress rules
      }
    );

    // Add ingress rule for HTTPS from VPC
    this.lambdaSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS access from VPC'
    );

    // Add egress rule for HTTPS outbound
    this.lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound access'
    );

    // Turn Around Prompt Table
    this.turnAroundPromptTable = new dynamodb.Table(
      this,
      'TurnAroundPromptTable',
      {
        tableName: `TurnAroundPromptTable${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: this.kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
      }
    );

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'FinancialServices');

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'ID of the Financial Services VPC',
      exportName: `${this.stackName}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.kmsKey.keyId,
      description: 'ID of the Financial Services KMS Key',
      exportName: `${this.stackName}-KMS-Key-ID`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: this.lambdaSecurityGroup.securityGroupId,
      description: 'ID of the Lambda Security Group',
      exportName: `${this.stackName}-Lambda-SG-ID`,
    });

    new cdk.CfnOutput(this, 'TurnAroundPromptTableName', {
      value: this.turnAroundPromptTable.tableName,
      description: 'Name of the Turn Around Prompt Table',
      exportName: `${this.stackName}-Table-Name`,
    });

    new cdk.CfnOutput(this, 'TurnAroundPromptTableArn', {
      value: this.turnAroundPromptTable.tableArn,
      description: 'ARN of the Turn Around Prompt Table',
      exportName: `${this.stackName}-Table-ARN`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for this deployment',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });
  }
}

```