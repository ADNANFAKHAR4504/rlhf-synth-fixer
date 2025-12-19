import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface WebServerProps {
  readonly vpc: ec2.Vpc;
  readonly securityGroup: ec2.SecurityGroup;
  readonly logBucket: s3.Bucket;
  readonly instanceType?: ec2.InstanceType;
  readonly keyName?: string;
}

export class WebServer extends Construct {
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: WebServerProps) {
    super(scope, id);

    // Create IAM role for EC2 instance
    const instanceRole = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Grant write access to log bucket
    props.logBucket.grantWrite(instanceRole);

    // User data script to install web server and CloudWatch agent
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Production Web Server</h1>" > /var/www/html/index.html',

      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',

      // Configure log forwarding to S3
      `aws logs create-log-group --log-group-name /aws/ec2/webserver --region ${props.vpc.stack.region}`,
      `aws s3 sync /var/log/httpd/ s3://${props.logBucket.bucketName}/httpd-logs/`
    );

    // Create EC2 instance
    this.instance = new ec2.Instance(this, 'WebServerInstance', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: props.securityGroup,
      instanceType:
        props.instanceType ||
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData: userData,
      role: instanceRole,
      keyName: props.keyName,
    });

    // Apply tags
    cdk.Tags.of(this.instance).add('Environment', 'Production');
    cdk.Tags.of(instanceRole).add('Environment', 'Production');
  }
}
