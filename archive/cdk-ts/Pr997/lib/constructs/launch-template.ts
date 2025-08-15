import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface WebLaunchTemplateProps {
  stage: string;
  securityGroup: ec2.ISecurityGroup;
}

export class WebLaunchTemplate extends Construct {
  public readonly lt: ec2.LaunchTemplate;

  constructor(scope: Construct, id: string, props: WebLaunchTemplateProps) {
    super(scope, id);

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum -y update || dnf -y update || true',
      'yum -y install nginx || dnf -y install nginx || amazon-linux-extras install -y nginx1 || true',
      'systemctl enable nginx',
      `echo "<h1>${props.stage} - $(curl -s http://169.254.169.254/latest/meta-data/placement/region) - CDK Web</h1>" > /usr/share/nginx/html/index.html`,
      'systemctl start nginx'
    );

    this.lt = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `${props.stage}-${scope.node.tryGetContext('aws:region') || 'region'}-lt`,
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: new ec2.InstanceType('t3.micro'),
      securityGroup: props.securityGroup,
      userData,
    });
  }
}
