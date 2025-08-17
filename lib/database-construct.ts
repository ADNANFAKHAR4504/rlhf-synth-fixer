import { Construct } from 'constructs';
import { SecurityConstruct } from './security-construct';
import { VpcConstruct } from './vpc-construct';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

interface DatabaseConstructProps {
  prefix: string;
  vpc: VpcConstruct;
  security: SecurityConstruct;
}

export class DatabaseConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);
    // For each region, create encrypted RDS, DynamoDB, etc.
    Object.keys(props.vpc.vpcs).forEach(region => {
      const kmsKey = props.security.kmsKeys[region];
      const vpc = props.vpc.vpcs[region];
      const privateSubnets =
        props.vpc.privateSubnets[region]?.map(subnet => subnet.id) || [];
      // Ensure security group IDs are properly referenced
      const securityGroupIds =
        props.security.securityGroups?.[region]?.map(sg => sg.id) || [];

      // Create DB Subnet Group for RDS
      const subnetGroupName = `${props.prefix}-rds-subnet-group-${region}`;
      const dbSubnetGroup = new DbSubnetGroup(this, subnetGroupName, {
        provider: vpc.provider,
        name: subnetGroupName,
        subnetIds: privateSubnets,
        tags: {
          Name: subnetGroupName,
          Environment: props.prefix,
        },
      });

      const rdsSuffix = Math.random().toString(36).substring(2, 8);
      new DbInstance(
        this,
        `${props.prefix}-rds-instance-${region}-${rdsSuffix}`,
        {
          provider: vpc.provider,
          identifier: `${props.prefix}-rds-${region}-${rdsSuffix}`,
          instanceClass: 'db.t3.micro',
          engine: 'mysql',
          engineVersion: '8.0',
          allocatedStorage: 20,
          username: 'admin',
          password: process.env.RDS_ADMIN_PASSWORD || 'ValidP@ssw0rd123!',
          dbName: `${props.prefix}_db_${region}`,
          vpcSecurityGroupIds: securityGroupIds, // Reference actual security groups
          storageEncrypted: true,
          kmsKeyId: kmsKey.arn,
          publiclyAccessible: false,
          dbSubnetGroupName: dbSubnetGroup.name,
          tags: {
            Name: `${props.prefix}-rds-instance-${region}-${rdsSuffix}`,
            Environment: props.prefix,
          },
        }
      );
      // DynamoDB Table handled in DynamoDbConstruct
    });
  }
}
