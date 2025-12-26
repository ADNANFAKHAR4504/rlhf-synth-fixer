import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class EC2InstancesConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { vpc, securityGroup, instanceProfile, cloudWatchConfig, isLocalStack } = props;

    // Get Amazon Linux 2 AMI
    const amzn2Ami = ec2.MachineImage.latestAmazonLinux2({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64
    });

    // Get availability zones
    const availabilityZones = vpc.availabilityZones.slice(0, 2); // Use first 2 AZs

    // User data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd amazon-cloudwatch-agent',

      // Configure CloudWatch agent
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'`,
      JSON.stringify(cloudWatchConfig, null, 2),
      'EOF',

      // Start and enable services
      'systemctl start httpd',
      'systemctl enable httpd',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',

      // Create a simple index page
      'echo "<h1>Secure Web Application</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" > /var/www/html/index.html',

      // Set proper permissions
      'chown -R apache:apache /var/www/html',
      'chmod -R 755 /var/www/html',

      // Configure log rotation
      'cat > /etc/logrotate.d/webapp << EOF',
      '/var/log/httpd/*log {',
      '    daily',
      '    missingok',
      '    rotate 52',
      '    compress',
      '    delaycompress',
      '    notifempty',
      '    create 640 apache apache',
      '    postrotate',
      '        /bin/systemctl reload httpd.service > /dev/null 2>/dev/null || true',
      '    endscript',
      '}',
      'EOF'
    );

    this.instances = [];

    // Create EC2 instances in different AZs
    // Note: requireImdsv2 creates a LaunchTemplate which doesn't work in LocalStack/CI
    availabilityZones.forEach((az, index) => {
      const instanceProps = {
        vpc: vpc,
        vpcSubnets: { 
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [az]
        },
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        machineImage: amzn2Ami,
        userData: userData,
        role: instanceProfile.role,
        securityGroup: securityGroup,
        blockDevices: [{
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: true
          })
        }]
      };
      
      // Only enable requireImdsv2 in real AWS (not LocalStack/CI)
      // This avoids LaunchTemplate creation which fails in LocalStack
      if (!isLocalStack) {
        instanceProps.requireImdsv2 = true;
      }
      
      const instance = new ec2.Instance(this, `WebAppInstance${index + 1}`, instanceProps);

      // Store configuration in Systems Manager Parameter Store
      new ssm.StringParameter(this, `InstanceConfig${index + 1}`, {
        parameterName: `/secure-webapp/instance-${index + 1}/config`,
        stringValue: JSON.stringify({
          instanceId: instance.instanceId,
          availabilityZone: az,
          role: 'webserver'
        }),
        description: `Configuration for secure webapp instance ${index + 1}`,
        tier: ssm.ParameterTier.STANDARD
      });

      this.instances.push(instance);
    });
  }
}
