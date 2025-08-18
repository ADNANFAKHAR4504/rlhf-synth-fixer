import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC Stack
    const vpcStack = new VpcStack(this, 'VpcStack', {
      stackName: `${this.stackName}-VpcStack`,
      environmentSuffix,
      env: props?.env,
    });

    // Create Compute Stack (depends on VPC)
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      stackName: `${this.stackName}-ComputeStack`,
      vpc: vpcStack.vpc,
      environmentSuffix,
      env: props?.env,
    });

    // Create Database Stack (depends on VPC and Compute)
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      stackName: `${this.stackName}-DatabaseStack`,
      vpc: vpcStack.vpc,
      ec2SecurityGroup: computeStack.ec2SecurityGroup,
      environmentSuffix,
      env: props?.env,
    });

    // Dependencies are handled implicitly by CDK through resource references
    // No need to add explicit dependencies when using nested stacks

    // Grant EC2 role access to read the database credentials
    // TODO: Currently commented to avoid circular dependencies between nested stacks
    // This would need to be handled differently, perhaps with a Lambda or post-deployment script
    // databaseStack.dbCredentials.grantRead(computeStack.ec2Role);

    // Stack-level outputs
    new cdk.CfnOutput(this, 'InfrastructureDeployed', {
      value: 'true',
      description: 'Infrastructure deployment status',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: environmentSuffix,
      description: 'Environment suffix',
    });

    new cdk.CfnOutput(this, 'ConnectToEc2', {
      value: `aws ssm start-session --target ${computeStack.ec2Instance.instanceId}`,
      description: 'Command to connect to EC2 instance via SSM',
    });

    new cdk.CfnOutput(this, 'DatabaseConnectionString', {
      value: `postgresql://dbadmin:<password>@${databaseStack.rdsInstance.instanceEndpoint.hostname}:5432/appdb`,
      description:
        'Database connection string template (replace <password> with actual password from secrets manager)',
    });
  }
}
