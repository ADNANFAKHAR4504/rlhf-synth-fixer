import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebAlb } from './constructs/alb';
import { WebAsg } from './constructs/asg';
import { WebLaunchTemplate } from './constructs/launch-template';
import { WebSecurityGroups } from './constructs/security-groups';
import { WebVpc } from './constructs/vpc';

interface TapStackProps extends StackProps {
  stage: string;
  certificateArn: string | undefined;
}

export class TapStack extends Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const region = this.region;
    const stage = props?.stage || 'dev';

    const vpc = new WebVpc(this, 'WebVpc', { stage }).vpc;

    const sgs = new WebSecurityGroups(this, 'SecurityGroups', { vpc, stage });

    const lt = new WebLaunchTemplate(this, 'WebLaunchTemplate', {
      stage,
      securityGroup: sgs.appSg,
    }).lt;

    const asg = new WebAsg(this, 'WebAsg', { vpc, launchTemplate: lt }).asg;

    if (!props?.certificateArn) {
      throw new Error(
        `certificateArn is required to create HTTPS listener in ${region}`
      );
    }

    const alb = new WebAlb(this, 'WebAlb', {
      vpc,
      albSecurityGroup: sgs.albSg,
      appAsg: asg,
      stage,
      certificateArn: props.certificateArn,
    });

    // Global tags / naming convention
    Tags.of(this).add('Stage', stage);
    Tags.of(this).add('Region', region);
    Tags.of(this).add(
      'ProblemID',
      'Web_Application_Deployment_CDK_Typescript_04o8y7hfeks8'
    );
  }
}
