I'll create a production-ready AWS CDK v2 TypeScript project with the specified requirements. Here's the complete solution:

## AWS CDK v2 TypeScript Project

### 1. `package.json`

```json
{
  "name": "myapp-cdk",
  "version": "1.0.0",
  "description": "MyApp production infrastructure",
  "main": "lib/myapp-stack.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "synth": "cdk synth"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0"
  }
}
```

### 2. `cdk.json`

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/myapp.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-nordicapis-v2:unique": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logRetentionProvidedByAws": true
  }
}
```

### 3. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

### 4. `bin/myapp.ts`

```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyAppStack } from '../lib/myapp-stack';

const app = new cdk.App();

new MyAppStack(app, 'MyAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
```

### 5. `lib/myapp-stack.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MyAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
      vpcId: 'vpc-0bb1c79de3EXAMPLE',
    });

    // Security Group - HTTPS only from internet
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: 'myapp-webserver-production',
      description: 'Security group for MyApp web server - HTTPS only',
      allowAllOutbound: true, // Unrestricted egress as required
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // IAM Role with minimal S3 permissions
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      roleName: 'myapp-ec2role-production',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for MyApp EC2 instances with S3 read-only access',
      inlinePolicies: {
        S3ReadOnlyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:Get*', 's3:List*'],
              resources: ['*'], // All S3 buckets as specified
            }),
          ],
        }),
      },
    });

    // Instance Profile for EC2
    const instanceProfile = new iam.InstanceProfile(this, 'InstanceProfile', {
      instanceProfileName: 'myapp-instanceprofile-production',
      role: ec2Role,
    });

    // Get Amazon Linux 2023 AMI via SSM Parameter
    const amiId = ec2.MachineImage.fromSsmParameter(
      '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64'
    );

    // EC2 Instance in public subnet
    const instance = new ec2.Instance(this, 'WebServerInstance', {
      instanceName: 'myapp-webserver-production',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Public subnet as required
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: amiId,
      securityGroup,
      role: ec2Role,
      keyName: undefined, // No SSH key pair for security
    });

    // Outputs
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      description: 'Security Group ID',
    });

    new cdk.CfnOutput(this, 'InstanceProfileArn', {
      value: instanceProfile.instanceProfileArn,
      description: 'Instance Profile ARN',
    });
  }
}
```

## CloudFormation YAML Template

Here's the equivalent CloudFormation template that accepts a parameter for the public subnet ID:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'MyApp production infrastructure with existing VPC'

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
    Default: vpc-0bb1c79de3EXAMPLE
    Description: 'Existing VPC ID'
  
  PublicSubnetId:
    Type: AWS::EC2::Subnet::Id
    Description: 'Public subnet ID within the existing VPC'

Resources:
  # Security Group - HTTPS only from internet
  MyAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: myapp-webserver-production
      GroupDescription: 'Security group for MyApp web server - HTTPS only'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: myapp-webserver-production

  # IAM Role with minimal S3 permissions
  MyAppEc2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: myapp-ec2role-production
      Description: 'IAM role for MyApp EC2 instances with S3 read-only access'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3ReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:Get*
                  - s3:List*
                Resource: '*'

  # Instance Profile
  MyAppInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: myapp-instanceprofile-production
      Roles:
        - !Ref MyAppEc2Role

  # EC2 Instance
  MyAppWebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      InstanceType: t3.micro
      SubnetId: !Ref PublicSubnetId
      SecurityGroupIds:
        - !Ref MyAppSecurityGroup
      IamInstanceProfile: !Ref MyAppInstanceProfile
      Tags:
        - Key: Name
          Value: myapp-webserver-production

Outputs:
  InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref MyAppWebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-InstanceId'

  SecurityGroupId:
    Description: 'Security Group ID'
    Value: !Ref MyAppSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'

  InstanceProfileArn:
    Description: 'Instance Profile ARN'
    Value: !GetAtt MyAppInstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-InstanceProfileArn'
```

## Key Design Decisions

1. **Security Group**: Only allows HTTPS (port 443) inbound traffic from anywhere, with unrestricted egress as specified.

2. **IAM Role**: Follows principle of least privilege with only `s3:Get*` and `s3:List*` permissions on all S3 buckets.

3. **EC2 Instance**: Uses Amazon Linux 2023 AMI via SSM Parameter Store for automatic updates, placed in public subnet as required.

4. **Naming Convention**: All resources follow `myapp-<component>-production` pattern.

5. **CloudFormation Template**: Includes a parameter for public subnet ID to make it reusable across different environments while referencing the existing VPC.

## Deployment Instructions

1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Deploy: `cdk deploy`

The CloudFormation template can be deployed directly through the AWS Console or CLI, requiring only the public subnet ID parameter.