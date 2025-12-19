import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
// import { GetAmiResult } from '@pulumi/aws/ec2';

// Define the arguments for the ComputeInfrastructure component
interface ComputeInfrastructureArgs {
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  securityGroupId: pulumi.Input<string>;
  environment: pulumi.Input<string>;
  region: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeInfrastructure extends pulumi.ComponentResource {
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly autoscalingGroup: aws.autoscaling.Group;
  public readonly instanceIds: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: ComputeInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:ComputeInfrastructure', name, args, opts);

    // Get the latest Amazon Linux 2 AMI for the specific region
    const amiResult = pulumi.output(
      aws.ec2.getAmi(
        {
          mostRecent: true,
          owners: ['amazon'],
          filters: [
            { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
            { name: 'state', values: ['available'] },
          ],
        },
        { parent: this, provider: opts?.provider }
      )
    );

    const amiId = amiResult.id;
    const instanceType = 't3.micro';

    // Define user data to install a web server on the instances
    const userData = `#!/bin/bash
sudo yum update -y
sudo yum install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd
echo "<h1>Hello from Pulumi!</h1>" > /var/www/html/index.html
`;

    // Create a Launch Template for the EC2 instances
    const launchTemplateTags = pulumi.output(args.tags).apply(tags => ({
      ...tags,
      Name: `${name}-launch-template`,
    }));

    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${name}-launch-template`,
      {
        namePrefix: `${name}-lt-`,
        imageId: amiId,
        instanceType: instanceType,
        userData: pulumi
          .output(userData)
          .apply(data => Buffer.from(data).toString('base64')),
        vpcSecurityGroupIds: [args.securityGroupId],
        tags: launchTemplateTags,
      },
      { parent: this }
    );

    // Create an Auto Scaling Group
    const asgTags = pulumi.output(args.tags).apply(tags =>
      Object.entries({ ...tags, Name: `${name}-asg-instance` }).map(
        ([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })
      )
    );

    this.autoscalingGroup = new aws.autoscaling.Group(
      `${name}-asg`,
      {
        vpcZoneIdentifiers: args.privateSubnetIds,
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 1,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        tags: asgTags,
      },
      { parent: this }
    );

    // Export key outputs
    // We return the ASG ARN as a list to match the Python script's output structure
    this.instanceIds = this.autoscalingGroup.arn.apply(arn => [arn]);
    this.registerOutputs({
      instanceIds: this.instanceIds,
    });
  }
}
