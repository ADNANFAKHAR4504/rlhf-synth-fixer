import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import {
  DatabaseMigrationStack,
  DatabaseMigrationStackProps,
} from './database-migration-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create DMS VPC management role with environment-specific name to avoid conflicts
    const dmsVpcRole = new iam.Role(this, 'DmsVpcRole', {
      roleName: `dms-vpc-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonDMSVPCManagementRole'
        ),
      ],
    });

    // Pass the role (or roleArn) into the DatabaseMigrationStack
    const dmProps: DatabaseMigrationStackProps = {
      environmentSuffix,
      dmsVpcRole, // add this prop to DatabaseMigrationStack props (or dmsVpcRoleArn: dmsVpcRole.roleArn)
    };

    const dbMigration = new DatabaseMigrationStack(
      this,
      'DatabaseMigration',
      dmProps
    );

    // ==============================
    // Stack Outputs
    // ==============================

    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: dbMigration.auroraClusterEndpoint,
      description: 'Aurora MySQL cluster writer endpoint',
      exportName: `aurora-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DmsTaskArn', {
      value: dbMigration.dmsTaskArn,
      description: 'DMS migration task ARN',
      exportName: `dms-task-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ValidationLambdaArn', {
      value: dbMigration.validationLambdaArn,
      description: 'Data validation Lambda function ARN',
      exportName: `validation-lambda-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DmsVpcRoleArn', {
      value: dmsVpcRole.roleArn,
      description: 'DMS VPC management role ARN',
      exportName: `dms-vpc-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: cdk.Stack.of(this).region,
      description: 'AWS region where stack is deployed',
    });
  }
}
