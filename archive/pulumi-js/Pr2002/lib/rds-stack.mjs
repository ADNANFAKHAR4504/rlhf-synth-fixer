import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class RdsStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:RdsStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        const vpcId = args.vpcId;
        const privateSubnetIds = args.privateSubnetIds;

        // Create DB subnet group
        const dbSubnetGroup = new aws.rds.SubnetGroup(`tap-db-subnet-group-${environmentSuffix}`, {
            subnetIds: privateSubnetIds,
            tags: {
                ...tags,
                Name: `tap-db-subnet-group-${environmentSuffix}`,
            },
        }, { parent: this });

        // Create security group for RDS
        const dbSecurityGroup = new aws.ec2.SecurityGroup(`tap-db-sg-${environmentSuffix}`, {
            vpcId: vpcId,
            description: "Security group for RDS instance",
            ingress: [
                {
                    fromPort: 3306,
                    toPort: 3306,
                    protocol: "tcp",
                    cidrBlocks: ["10.0.0.0/8"], // Allow from VPC
                },
            ],
            egress: [
                {
                    fromPort: 0,
                    toPort: 0,
                    protocol: "-1",
                    cidrBlocks: ["0.0.0.0/0"],
                },
            ],
            tags: {
                ...tags,
                Name: `tap-db-sg-${environmentSuffix}`,
            },
        }, { parent: this });

        // Use Aurora Serverless v2 for modern scaling capabilities
        const rdsCluster = new aws.rds.Cluster(`tap-aurora-cluster-${environmentSuffix}`, {
            engine: "aurora-mysql",
            engineMode: "provisioned", // Required for Serverless v2
            engineVersion: "8.0.mysql_aurora.3.04.0",
            databaseName: `tapapp${environmentSuffix}`,
            masterUsername: "admin",
            masterPassword: "TapApp123!", // In production, use AWS Secrets Manager
            dbSubnetGroupName: dbSubnetGroup.name,
            vpcSecurityGroupIds: [dbSecurityGroup.id],
            backupRetentionPeriod: 7, // Minimum 7 days as required
            preferredBackupWindow: "03:00-04:00",
            preferredMaintenanceWindow: "sun:04:00-sun:05:00",
            storageEncrypted: true,
            serverlessv2ScalingConfiguration: {
                maxCapacity: 2,
                minCapacity: 0.5, // Can scale to near-zero
            },
            skipFinalSnapshot: true,
            tags: {
                ...tags,
                Name: `tap-aurora-cluster-${environmentSuffix}`,
            },
        }, { parent: this });

        // Create Aurora Serverless v2 instance
        const rdsInstance = new aws.rds.ClusterInstance(`tap-aurora-instance-${environmentSuffix}`, {
            clusterIdentifier: rdsCluster.id,
            instanceClass: "db.serverless", // Serverless v2 instance class
            engine: rdsCluster.engine,
            engineVersion: rdsCluster.engineVersion,
            tags: {
                ...tags,
                Name: `tap-aurora-instance-${environmentSuffix}`,
            },
        }, { parent: this });

        this.rdsEndpoint = rdsCluster.endpoint;
        this.rdsPort = rdsCluster.port;

        this.registerOutputs({
            rdsEndpoint: this.rdsEndpoint,
            rdsPort: this.rdsPort,
            clusterId: rdsCluster.id,
        });
    }
}