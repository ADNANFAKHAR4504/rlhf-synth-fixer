import { Construct } from "constructs";
// Import RDS, DynamoDB, etc. from @cdktf/provider-aws as needed
import { SecurityConstruct } from "./security-construct";
import { VpcConstruct } from "./vpc-construct";

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
      const { DbInstance } = require("@cdktf/provider-aws");
      new DbInstance(this, `${props.prefix}-rds-instance-${region}`, {
        provider: vpc.provider,
        identifier: `${props.prefix}-rds-${region}`,
        instanceClass: "db.t3.micro",
        engine: "mysql",
        engineVersion: "8.0",
        allocatedStorage: 20,
        username: "admin",
        password: "securepassword123!", // Use secrets manager in production
        dbName: `${props.prefix}_db_${region}`,
        vpcSecurityGroupIds: [], // Should reference security groups
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        publiclyAccessible: false,
        tags: {
          Name: `${props.prefix}-rds-instance-${region}`,
          Environment: props.prefix,
        },
      });
      // DynamoDB Table handled in DynamoDbConstruct
    });
  }
}
