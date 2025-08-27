import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  lambdaSecurityGroup: ec2.SecurityGroup;
}

export class ComputeStack extends cdk.Stack {
  public readonly ec2Instances: ec2.Instance[] = [];
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // IAM Instance Profile for EC2
    new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: ['EC2Role'], // Reference to role created in SecurityStack
    });

    // Launch Template with IMDSv2 enforcement
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'SecureLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: props.securityGroup,
        userData: ec2.UserData.forLinux(),
        requireImdsv2: true, // Enforce IMDSv2
        httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
        httpEndpoint: true,
        httpProtocolIpv6: false,
        instanceMetadataTags: true,
      }
    );

    // Add user data to install CloudWatch agent
    launchTemplate.userData?.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent'
    );

    // Create EC2 instances in private subnets
    const privateSubnets = props.vpc.privateSubnets;
    for (let i = 0; i < Math.min(2, privateSubnets.length); i++) {
      const instance = new ec2.Instance(this, `SecureInstance${i + 1}`, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        vpc: props.vpc,
        vpcSubnets: {
          subnets: [privateSubnets[i]],
        },
        securityGroup: props.securityGroup,
        userData: ec2.UserData.forLinux(),
        requireImdsv2: true, // Enforce IMDSv2
        userDataCausesReplacement: true,
      });

      // Configure user data for CloudWatch monitoring
      instance.userData.addCommands(
        'yum update -y',
        'yum install -y amazon-cloudwatch-agent',
        'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
        JSON.stringify(
          {
            metrics: {
              namespace: 'CWAgent',
              metrics_collected: {
                cpu: {
                  measurement: [
                    'cpu_usage_idle',
                    'cpu_usage_iowait',
                    'cpu_usage_user',
                    'cpu_usage_system',
                  ],
                  metrics_collection_interval: 60,
                },
                disk: {
                  measurement: ['used_percent'],
                  metrics_collection_interval: 60,
                  resources: ['*'],
                },
                mem: {
                  measurement: ['mem_used_percent'],
                  metrics_collection_interval: 60,
                },
              },
            },
          },
          null,
          2
        ),
        'EOF',
        '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s',
        'systemctl enable amazon-cloudwatch-agent',
        'systemctl start amazon-cloudwatch-agent'
      );

      this.ec2Instances.push(instance);
    }

    // Lambda function without internet access (in private subnet)
    this.lambdaFunction = new lambda.Function(this, 'SecureLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3

def handler(event, context):
    # Lambda function code here
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from secure Lambda!')
    }
      `),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      description: 'Secure Lambda function running in private subnet',
    });

    // Output instance IDs
    this.ec2Instances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `Instance${index + 1}Id`, {
        value: instance.instanceId,
        description: `EC2 Instance ${index + 1} ID`,
      });
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda Function Name',
    });
  }
}
