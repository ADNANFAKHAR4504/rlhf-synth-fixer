// 6. RDS DATABASE with Multi-AZ and encryption
const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
vpc,
description: 'Subnet group for RDS database',
vpcSubnets: {
subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
},
});

// Fixed: Use a valid MySQL version
const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
engine: rds.DatabaseInstanceEngine.mysql({
version: rds.MysqlEngineVersion.VER_8_0_39, // Updated to valid version
}),
instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
vpc,
subnetGroup: dbSubnetGroup,
securityGroups: [rdsSecurityGroup],
multiAz: true, // High availability
storageEncrypted: true,
storageEncryptionKey: rdsKmsKey,
backupRetention: cdk.Duration.days(7),
deletionProtection: true,
databaseName: 'secureapp',
credentials: rds.Credentials.fromGeneratedSecret('admin', {
excludeCharacters: '"@/\\\'',
}),
monitoringInterval: cdk.Duration.seconds(60),
enablePerformanceInsights: true,
cloudwatchLogsExports: ['error', 'general', 'slow-query'],
});
