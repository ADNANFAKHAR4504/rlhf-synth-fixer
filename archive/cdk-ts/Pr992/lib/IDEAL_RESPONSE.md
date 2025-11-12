# AWS CDK v2 TypeScript Security Configuration - Complete Solution

This document provides the complete production-ready AWS CDK v2 TypeScript project and equivalent CloudFormation YAML template for the security configuration requirements.

## AWS CDK v2 TypeScript Solution

### Project Structure
```
myapp-project/
├── bin/
│   └── myapp.ts
├── lib/
│   └── myapp-stack.ts
├── package.json
├── cdk.json
└── tsconfig.json
```

### File Contents

#### `package.json`
```json
{
  "name": "myapp-project",
  "version": "1.0.0",
  "description": "AWS CDK project for MyApp security configuration",
  "main": "bin/myapp.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.117.0",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.117.0",
    "constructs": "^10.0.0"
  }
}
```

#### `cdk.json`
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-sns:restrictPublishProtocols": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true
  }
}
```

#### `tsconfig.json`
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

#### `bin/myapp.ts`
```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyappStack } from '../lib/myapp-stack';

const app = new cdk.App();

new MyappStack(app, 'MyappStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  },
  description: 'MyApp Production Security Configuration Stack'
});
```

#### `lib/myapp-stack.ts`
```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MyappStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
      vpcId: 'vpc-0bb1c79de3EXAMPLE'
    });

    // Security Group - HTTPS only from internet
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: 'myapp-webserver-production',
      description: 'Security group for MyApp web server - HTTPS only',
      allowAllOutbound: true, // Unrestricted egress as required
    });

    // Add HTTPS ingress rule
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
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: amiId,
      securityGroup,
      role: ec2Role,
      // No SSH key pair for enhanced security
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: 'MyappInstanceId'
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      description: 'Security Group ID',
      exportName: 'MyappSecurityGroupId'
    });

    new cdk.CfnOutput(this, 'InstanceProfileArn', {
      value: instanceProfile.instanceProfileArn,
      description: 'Instance Profile ARN',
      exportName: 'MyappInstanceProfileArn'
    });
  }
}
```

---

## Equivalent CloudFormation YAML Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'MyApp Production Security Configuration - CloudFormation Template'

Parameters:
  VpcId:
    Type: 'AWS::EC2::VPC::Id'
    Default: 'vpc-0bb1c79de3EXAMPLE'
    Description: 'ID of the existing VPC to deploy resources into'
  
  PublicSubnetId:
    Type: 'AWS::EC2::Subnet::Id'
    Description: 'ID of the public subnet within the VPC to launch the EC2 instance'

Resources:
  # Security Group - HTTPS only from internet
  MyappSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: 'myapp-webserver-production'
      GroupDescription: 'Security group for MyApp web server - HTTPS only'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: 'Name'
          Value: 'myapp-webserver-production'

  # IAM Role with S3 read-only permissions
  MyappEc2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: 'myapp-ec2role-production'
      Description: 'IAM role for MyApp EC2 instances with S3 read-only access'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: 'S3ReadOnlyPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:Get*'
                  - 's3:List*'
                Resource: '*'
      Tags:
        - Key: 'Name'
          Value: 'myapp-ec2role-production'

  # Instance Profile for EC2
  MyappInstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: 'myapp-instanceprofile-production'
      Roles:
        - !Ref MyappEc2Role

  # EC2 Instance in public subnet
  MyappWebServerInstance:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: 't3.micro'
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      SubnetId: !Ref PublicSubnetId
      SecurityGroupIds:
        - !Ref MyappSecurityGroup
      IamInstanceProfile: !Ref MyappInstanceProfile
      # No KeyName for enhanced security - no SSH access
      Tags:
        - Key: 'Name'
          Value: 'myapp-webserver-production'

Outputs:
  InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref MyappWebServerInstance
    Export:
      Name: 'MyappInstanceId'

  SecurityGroupId:
    Description: 'Security Group ID'
    Value: !Ref MyappSecurityGroup
    Export:
      Name: 'MyappSecurityGroupId'

  InstanceProfileArn:
    Description: 'Instance Profile ARN'
    Value: !GetAtt MyappInstanceProfile.Arn
    Export:
      Name: 'MyappInstanceProfileArn'
```

---

## Key Design Decisions

1. **Security First**: Only HTTPS (port 443) access allowed, no SSH access
2. **Least Privilege IAM**: Role contains only required S3 read-only permissions (`s3:Get*`, `s3:List*`)
3. **Resource Naming**: Follows `myapp-<component>-production` convention
4. **Public Subnet Placement**: Instance deployed in public subnet as specified
5. **AMI Selection**: Uses Amazon Linux 2023 via SSM parameter for latest patched image
6. **No Key Pairs**: Enhanced security by not allowing SSH access
7. **CloudFormation Compatibility**: Template accepts VPC ID and public subnet ID as parameters

This solution provides production-ready infrastructure with security best practices and minimal required permissions.