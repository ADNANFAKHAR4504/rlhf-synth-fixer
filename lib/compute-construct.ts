import { Construct } from 'constructs';
import { SecurityConstruct } from './security-construct';
import { VpcConstruct } from './vpc-construct';
import { Instance } from '../.gen/providers/aws/instance';
import { SecurityGroup } from '../.gen/providers/aws/security-group';
import { CloudwatchLogGroup } from '../.gen/providers/aws/cloudwatch-log-group';
import { LambdaFunction } from '../.gen/providers/aws/lambda-function';

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
      const publicSg = new SecurityGroup(this, `${props.prefix}-public-sg-${region}`, {
        provider: vpc.provider,
        name: `${props.prefix}-public-sg-${region}`,
        description: 'Allow HTTP/HTTPS from internet, SSH from VPC',
        vpcId: vpc.id,
        ingress: [
          { fromPort: 80, toPort: 80, protocol: 'tcp', cidrBlocks: ['0.0.0.0/0'] },
          { fromPort: 443, toPort: 443, protocol: 'tcp', cidrBlocks: ['0.0.0.0/0'] },
          { fromPort: 22, toPort: 22, protocol: 'tcp', cidrBlocks: [vpc.cidrBlock] },
        ],
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          Name: `${props.prefix}-public-sg-${region}`,
          Environment: props.prefix,
        },
      });
      // EC2 Instance in public subnet
      new Instance(this, `${props.prefix}-ec2-public-${region}`, {
        provider: vpc.provider,
        ami: 'ami-0c02fb55956c7d316', // Amazon Linux 2, update as needed
        instanceType: 't3.micro',
        subnetId: props.vpc.publicSubnets[region]?.[0]?.id,
        vpcSecurityGroupIds: [publicSg.id],
        iamInstanceProfile: props.security.iamRoles[region]?.name,
        userData: '#!/bin/bash\nyum update -y\nyum install -y awslogs\nsystemctl start awslogsd\nsystemctl enable awslogsd\n',
        tags: {
          Name: `${props.prefix}-ec2-public-${region}`,
          Environment: props.prefix,
        },
      });
      // Security Group for Lambda/private EC2
      const privateSg = new SecurityGroup(this, `${props.prefix}-private-sg-${region}`, {
        provider: vpc.provider,
        name: `${props.prefix}-private-sg-${region}`,
        description: 'Allow all traffic from VPC',
        vpcId: vpc.id,
        ingress: [
          { fromPort: 0, toPort: 65535, protocol: 'tcp', cidrBlocks: [vpc.cidrBlock] },
        ],
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          Name: `${props.prefix}-private-sg-${region}`,
          Environment: props.prefix,
        },
      });
      // Lambda Log Group
      const lambdaLogGroup = new CloudwatchLogGroup(this, `${props.prefix}-lambda-logs-${region}`, {
        provider: vpc.provider,
        name: `/aws/lambda/${props.prefix}-lambda-${region}`,
        retentionInDays: 14,
        kmsKeyId: kmsKey.arn,
        tags: {
          Name: `${props.prefix}-lambda-logs-${region}`,
          Environment: props.prefix,
        },
      });
      // Lambda Function
      new LambdaFunction(this, `${props.prefix}-lambda-${region}`, {
        provider: vpc.provider,
        functionName: `${props.prefix}-lambda-${region}`,
        role: props.security.iamRoles[region]?.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        filename: 'lambda.zip', // Replace with actual deployment artifact
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
