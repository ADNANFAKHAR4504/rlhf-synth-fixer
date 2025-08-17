import { Construct } from 'constructs';
import { SecurityConstruct } from './security-construct';
import { VpcConstruct } from './vpc-construct';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';

interface ComputeConstructProps {
  prefix: string;
  vpc: VpcConstruct;
  security: SecurityConstruct;
}

export class ComputeConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);
    // For each region, create EC2 and Lambda with logging and public access restrictions
    Object.keys(props.vpc.vpcs).forEach(region => {
      const vpc = props.vpc.vpcs[region];
      const kmsKey = props.security.kmsKeys[region];
      // Import at top-level instead of require
      // Security Group for public EC2
      const publicSg = new SecurityGroup(
        this,
        `${props.prefix}-public-sg-${region}`,
        {
          provider: vpc.provider,
          name: `${props.prefix}-public-sg-${region}`,
          description: 'Allow HTTP/HTTPS from internet, SSH from VPC',
          vpcId: vpc.id,
          ingress: [
            {
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
            },
            {
              fromPort: 443,
              toPort: 443,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
            },
            {
              fromPort: 22,
              toPort: 22,
              protocol: 'tcp',
              cidrBlocks: [vpc.cidrBlock],
            },
          ],
          egress: [
            {
              fromPort: 0,
              toPort: 0,
              protocol: '-1',
              cidrBlocks: ['0.0.0.0/0'],
            },
          ],
          tags: {
            Name: `${props.prefix}-public-sg-${region}`,
            Environment: props.prefix,
          },
        }
      );
      // EC2 Instance in public subnet
      new Instance(this, `${props.prefix}-ec2-public-${region}`, {
        provider: vpc.provider,
        ami: amiMap[region],
        instanceType: 't3.micro',
        subnetId: props.vpc.publicSubnets[region]?.[0]?.id,
        vpcSecurityGroupIds: [publicSg.id],
        iamInstanceProfile: props.security.iamRoles[`${region}-profile`]?.name,
        userData:
          '#!/bin/bash\nyum update -y\nyum install -y awslogs\nsystemctl start awslogsd\nsystemctl enable awslogsd\n',
        tags: {
          Name: `${props.prefix}-ec2-public-${region}`,
          Environment: props.prefix,
        },
      });
      // Security Group for Lambda/private EC2
      const privateSg = new SecurityGroup(
        this,
        `${props.prefix}-private-sg-${region}`,
        {
          provider: vpc.provider,
          name: `${props.prefix}-private-sg-${region}`,
          description: 'Allow all traffic from VPC',
          vpcId: vpc.id,
          ingress: [
            {
              fromPort: 0,
              protocol: 'tcp',
              cidrBlocks: [vpc.cidrBlock],
            },
          ],
          egress: [
            {
              fromPort: 0,
              toPort: 0,
              protocol: '-1',
              cidrBlocks: ['0.0.0.0/0'],
            },
          ],
          tags: {
            Name: `${props.prefix}-private-sg-${region}`,
            Environment: props.prefix,
          },
        }
      );
      // Lambda Log Group
      const lambdaLogSuffix = Math.random().toString(36).substring(2, 8);
      const lambdaLogGroup = new CloudwatchLogGroup(
        this,
        `${props.prefix}-lambda-logs-${region}-${lambdaLogSuffix}`,
        {
          provider: vpc.provider,
          name: `/aws/lambda/${props.prefix}-lambda-${region}-${lambdaLogSuffix}`,
          retentionInDays: 14,
          kmsKeyId: kmsKey.arn,
          tags: {
            Name: `${props.prefix}-lambda-logs-${region}-${lambdaLogSuffix}`,
            Environment: props.prefix,
          },
        }
      );
      // Lambda Function
      new LambdaFunction(this, `${props.prefix}-lambda-${region}`, {
        provider: vpc.provider,
        functionName: `${props.prefix}-lambda-${region}`,
        role: props.security.iamRoles[`${region}-lambda`]?.arn,
        handler: 'lambda.handler',
        runtime: 'nodejs18.x',
        filename: 'lib/lambda.zip', // use correct path to deployment package
        sourceCodeHash: 'placeholder', // Replace with actual hash
        environment: {
          variables: {
            ENVIRONMENT: props.prefix,
            KMS_KEY_ID: kmsKey.arn,
          },
        },
        vpcConfig: {
          subnetIds: props.vpc.privateSubnets[region]?.map(s => s.id) || [],
          securityGroupIds: [privateSg.id],
        },
        dependsOn: [lambdaLogGroup],
        tags: {
          Name: `${props.prefix}-lambda-${region}`,
          Environment: props.prefix,
        },
      });
    });
  }
}

const amiMap: Record<string, string> = {
  'us-west-1': 'ami-024203a193af5aa51', // valid
  // ...other regions
};
