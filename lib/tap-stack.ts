import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { DatabaseMigrationStack, DatabaseMigrationStackProps } from './database-migration-stack';

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
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonDMSVPCManagementRole'),
      ],
    });

    // Pass the role (or roleArn) into the DatabaseMigrationStack
    const dmProps: DatabaseMigrationStackProps = {
      environmentSuffix,
      dmsVpcRole, // add this prop to DatabaseMigrationStack props (or dmsVpcRoleArn: dmsVpcRole.roleArn)
    };

    new DatabaseMigrationStack(this, 'DatabaseMigration', dmProps);
  }
}
