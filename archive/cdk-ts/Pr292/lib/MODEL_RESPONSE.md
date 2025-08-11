```yaml
import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3, aws_ec2 as ec2, aws_iam as iam } from 'aws-cdk-lib';

class TapStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment suffix from context
    const envSuffix = this.node.tryGetContext('environmentSuffix') || 'dev';

    // Add standard tags
    cdk.Tags.of(this).add('Environment', envSuffix);
    cdk.Tags.of(this).add('Repository', 'cloud-infra');
    cdk.Tags.of(this).add('Owner', 'CloudTeam');

    // 1. S3 Bucket Configuration
    const bucket = new s3.Bucket(this, 'DataBucket', {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(bucket).add('Purpose', 'DataStorage');

    // 2. Security Group Configuration
    const allowedSshIp = new cdk.CfnParameter(this, 'AllowedSshIp', {
      type: 'String',
      description: 'IP address allowed SSH access to EC2 instance',
    });

    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc: ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true }),
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshIp.valueAsString),
      ec2.Port.tcp(22),
      'Allow SSH from specific IP'
    );

    // 3. IAM Role Configuration
    const instanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    bucket.grantReadWrite(instanceRole);

    // 4. EC2 Instance Setup
    const instance = new ec2.Instance(this, 'MainInstance', {
      vpc: ec2.Vpc.fromLookup(this, 'VPCLookup', { isDefault: true }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2, ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: securityGroup,
      role: instanceRole,
    });
    cdk.Tags.of(instance).add('Name', `MainServer-${envSuffix}`);

    // 5. Elastic IP Association
    const eip = new ec2.CfnEIP(this, 'InstanceEIP', {
      domain: 'vpc',
      instanceId: instance.instanceId,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'InstanceId', { value: instance.instanceId });
    new cdk.CfnOutput(this, 'ElasticIP', { value: eip.ref });
  }
}

// App Initialization
const app = new cdk.App();
const env = app.node.tryGetContext('environmentSuffix') || 'dev';
new TapStack(app, `TapStack${env}`, {
  env: { region: 'us-east-1' },
});
```
