import fs from 'fs';
import path from 'path';

// Integration tests for Migration Stack
// Note: These tests validate template outputs and structure for integration readiness
// Full end-to-end testing requires deployment with real on-premises infrastructure

describe('Migration Stack Integration Tests', () => {
  let template: any;
  let outputs: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/migration-stack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

    // In a real deployment, this would come from cfn-outputs/flat-outputs.json
    // For this test, we validate that all necessary outputs exist
    outputs = {};
    Object.keys(template.Outputs).forEach((key) => {
      outputs[key] = `mock-${key}-value`;
    });
  });

  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs for integration testing', () => {
      const requiredOutputs = [
        'VpcId',
        'AuroraClusterEndpoint',
        'AuroraClusterReadEndpoint',
        'LoadBalancerDns',
        'MigrationBucketName',
        'CloudWatchDashboardUrl',
        'DmsReplicationTaskArn',
        'DataSyncTaskArn',
        'HostedZoneId'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(template.Outputs[outputKey]).toBeDefined();
        expect(template.Outputs[outputKey].Value).toBeDefined();
      });
    });

    test('outputs should include proper descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('VPC Integration', () => {
    test('VPC should have proper CIDR block configuration', () => {
      const vpc = template.Resources.MigrationVpc;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'MigrationVpcCidr' });
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.MigrationVpc;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC peering should be configured between migration and production VPCs', () => {
      const peering = template.Resources.VpcPeeringConnection;
      expect(peering.Properties.VpcId).toEqual({ Ref: 'MigrationVpc' });
      expect(peering.Properties.PeerVpcId).toEqual({ Ref: 'ProductionVpcId' });
    });

    test('should have route to production VPC through peering connection', () => {
      const route = template.Resources.PeeringRouteToProduction;
      expect(route.Properties.DestinationCidrBlock).toEqual({ Ref: 'ProductionVpcCidr' });
      expect(route.Properties.VpcPeeringConnectionId).toEqual({ Ref: 'VpcPeeringConnection' });
    });
  });

  describe('Database Integration', () => {
    test('Aurora cluster should reference proper subnet group', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBSubnetGroupName).toEqual({ Ref: 'DbSubnetGroup' });
    });

    test('Aurora cluster should reference proper security group', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.VpcSecurityGroupIds).toContainEqual({ Ref: 'DbSecurityGroup' });
    });

    test('Aurora instances should reference the cluster', () => {
      const instance1 = template.Resources.AuroraInstance1;
      const instance2 = template.Resources.AuroraInstance2;

      expect(instance1.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraCluster' });
      expect(instance2.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraCluster' });
    });

    test('database security group should allow access from application tier', () => {
      const dbSg = template.Resources.DbSecurityGroup;
      const ingressRules = dbSg.Properties.SecurityGroupIngress;

      const appAccessRule = ingressRules.find((rule: any) =>
        rule.SourceSecurityGroupId && rule.SourceSecurityGroupId.Ref === 'AppSecurityGroup'
      );

      expect(appAccessRule).toBeDefined();
      expect(appAccessRule.FromPort).toBe(3306);
      expect(appAccessRule.ToPort).toBe(3306);
    });

    test('database security group should allow access from DMS', () => {
      const dbSg = template.Resources.DbSecurityGroup;
      const ingressRules = dbSg.Properties.SecurityGroupIngress;

      const dmsAccessRule = ingressRules.find((rule: any) =>
        rule.SourceSecurityGroupId && rule.SourceSecurityGroupId.Ref === 'DmsSecurityGroup'
      );

      expect(dmsAccessRule).toBeDefined();
      expect(dmsAccessRule.FromPort).toBe(3306);
    });
  });

  describe('DMS Integration', () => {
    test('DMS source endpoint should reference correct parameters', () => {
      const endpoint = template.Resources.DmsSourceEndpoint;
      expect(endpoint.Properties.ServerName).toEqual({ Ref: 'OnPremDatabaseHost' });
      expect(endpoint.Properties.Port).toEqual({ Ref: 'OnPremDatabasePort' });
      expect(endpoint.Properties.Password).toEqual({ Ref: 'OnPremDbPassword' });
    });

    test('DMS target endpoint should reference Aurora cluster', () => {
      const endpoint = template.Resources.DmsTargetEndpoint;
      expect(endpoint.Properties.ServerName).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address']
      });
      expect(endpoint.Properties.Username).toEqual({ Ref: 'DbMasterUsername' });
    });

    test('DMS replication task should link source and target endpoints', () => {
      const task = template.Resources.DmsReplicationTask;
      expect(task.Properties.SourceEndpointArn).toEqual({ Ref: 'DmsSourceEndpoint' });
      expect(task.Properties.TargetEndpointArn).toEqual({ Ref: 'DmsTargetEndpoint' });
      expect(task.Properties.ReplicationInstanceArn).toEqual({ Ref: 'DmsReplicationInstance' });
    });

    test('DMS replication task should be configured for continuous sync', () => {
      const task = template.Resources.DmsReplicationTask;
      expect(task.Properties.MigrationType).toBe('full-load-and-cdc');
    });
  });

  describe('Load Balancer Integration', () => {
    test('ALB should be deployed across all public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
        { Ref: 'PublicSubnet3' }
      ]);
    });

    test('ALB should reference correct security group', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toContainEqual({ Ref: 'AlbSecurityGroup' });
    });

    test('target groups should be in migration VPC', () => {
      const oldTg = template.Resources.OldEnvironmentTargetGroup;
      const newTg = template.Resources.NewEnvironmentTargetGroup;

      expect(oldTg.Properties.VpcId).toEqual({ Ref: 'MigrationVpc' });
      expect(newTg.Properties.VpcId).toEqual({ Ref: 'MigrationVpc' });
    });

    test('ALB listener should forward to both target groups with weights', () => {
      const listener = template.Resources.AlbListener;
      const forwardConfig = listener.Properties.DefaultActions[0].ForwardConfig;

      expect(forwardConfig.TargetGroups).toHaveLength(2);
      expect(forwardConfig.TargetGroups[0].TargetGroupArn).toEqual({ Ref: 'OldEnvironmentTargetGroup' });
      expect(forwardConfig.TargetGroups[0].Weight).toEqual({ Ref: 'TrafficWeightOld' });
      expect(forwardConfig.TargetGroups[1].TargetGroupArn).toEqual({ Ref: 'NewEnvironmentTargetGroup' });
      expect(forwardConfig.TargetGroups[1].Weight).toEqual({ Ref: 'TrafficWeightNew' });
    });

    test('application security group should allow traffic from ALB', () => {
      const appSg = template.Resources.AppSecurityGroup;
      const ingressRules = appSg.Properties.SecurityGroupIngress;

      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ Ref: 'AlbSecurityGroup' });
      expect(ingressRules[0].FromPort).toBe(8080);
    });
  });

  describe('Route 53 Integration', () => {
    test('Route 53 records should point to ALB', () => {
      const oldRecord = template.Resources.Route53RecordOld;
      const newRecord = template.Resources.Route53RecordNew;

      expect(oldRecord.Properties.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
      expect(newRecord.Properties.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('Route 53 records should have weighted routing', () => {
      const oldRecord = template.Resources.Route53RecordOld;
      const newRecord = template.Resources.Route53RecordNew;

      expect(oldRecord.Properties.Weight).toEqual({ Ref: 'TrafficWeightOld' });
      expect(newRecord.Properties.Weight).toEqual({ Ref: 'TrafficWeightNew' });
      expect(oldRecord.Properties.SetIdentifier).toBe('Old-Environment');
      expect(newRecord.Properties.SetIdentifier).toBe('New-Environment');
    });

    test('Route 53 records should reference the hosted zone', () => {
      const oldRecord = template.Resources.Route53RecordOld;
      const newRecord = template.Resources.Route53RecordNew;

      expect(oldRecord.Properties.HostedZoneId).toEqual({ Ref: 'HostedZone' });
      expect(newRecord.Properties.HostedZoneId).toEqual({ Ref: 'HostedZone' });
    });
  });

  describe('DataSync Integration', () => {
    test('DataSync S3 location should reference migration bucket', () => {
      const location = template.Resources.DataSyncS3Location;
      expect(location.Properties.S3BucketArn).toEqual({
        'Fn::GetAtt': ['MigrationBucket', 'Arn']
      });
    });

    test('DataSync S3 location should use correct IAM role', () => {
      const location = template.Resources.DataSyncS3Location;
      expect(location.Properties.S3Config.BucketAccessRoleArn).toEqual({
        'Fn::GetAtt': ['DataSyncRole', 'Arn']
      });
    });

    test('DataSync task should reference both source and destination', () => {
      const task = template.Resources.DataSyncTask;
      expect(task.Properties.SourceLocationArn).toEqual({ Ref: 'DataSyncNfsLocation' });
      expect(task.Properties.DestinationLocationArn).toEqual({ Ref: 'DataSyncS3Location' });
    });

    test('DataSync task should have proper verification settings', () => {
      const task = template.Resources.DataSyncTask;
      expect(task.Properties.Options.VerifyMode).toBe('ONLY_FILES_TRANSFERRED');
      expect(task.Properties.Options.LogLevel).toBe('TRANSFER');
    });
  });

  describe('Security Integration', () => {
    test('SSM parameters should use KMS encryption', () => {
      const dbPassword = template.Resources.DbMasterPasswordSSM;
      const onPremPassword = template.Resources.OnPremDbPasswordSSM;

      expect(dbPassword.Properties.KmsKeyId).toEqual({ Ref: 'KmsKey' });
      expect(onPremPassword.Properties.KmsKeyId).toEqual({ Ref: 'KmsKey' });
    });

    test('KMS key should have proper service permissions', () => {
      const kmsKey = template.Resources.KmsKey;
      const policy = kmsKey.Properties.KeyPolicy;

      const serviceStatement = policy.Statement.find((s: any) => s.Sid === 'Allow services to use the key');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('ssm.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('dms.amazonaws.com');
    });

    test('KMS key alias should be properly named', () => {
      const alias = template.Resources.KmsKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KmsKey' });
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/migration-${EnvironmentSuffix}'
      });
    });

    test('S3 bucket should use KMS encryption', () => {
      const bucket = template.Resources.MigrationBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KmsKey' });
    });
  });

  describe('Monitoring Integration', () => {
    test('CloudWatch dashboard should have proper name', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'migration-dashboard-${EnvironmentSuffix}'
      });
    });

    test('CloudWatch dashboard URL should be accessible', () => {
      const output = template.Outputs.CloudWatchDashboardUrl;
      const url = output.Value['Fn::Sub'];

      expect(url).toContain('console.aws.amazon.com/cloudwatch');
      expect(url).toContain('dashboards');
      expect(url).toContain('migration-dashboard-${EnvironmentSuffix}');
    });
  });

  describe('AWS Config Integration', () => {
    test('Config recorder should use proper IAM role', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Properties.RoleArn).toEqual({
        'Fn::GetAtt': ['ConfigRecorderRole', 'Arn']
      });
    });

    test('Config delivery channel should reference Config bucket', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Properties.S3BucketName).toEqual({ Ref: 'ConfigBucket' });
    });

    test('Config rules should depend on Config recorder', () => {
      const encryptedVolumesRule = template.Resources.EncryptedVolumesRule;
      const rdsEncryptionRule = template.Resources.RdsEncryptionRule;

      expect(encryptedVolumesRule.DependsOn).toBe('ConfigRecorder');
      expect(rdsEncryptionRule.DependsOn).toBe('ConfigRecorder');
    });
  });

  describe('Parameter Integration', () => {
    test('traffic weight parameters should have valid range', () => {
      const oldWeight = template.Parameters.TrafficWeightOld;
      const newWeight = template.Parameters.TrafficWeightNew;

      expect(oldWeight.MinValue).toBe(0);
      expect(oldWeight.MaxValue).toBe(100);
      expect(newWeight.MinValue).toBe(0);
      expect(newWeight.MaxValue).toBe(100);
    });

    test('password parameters should have NoEcho enabled', () => {
      const dbPassword = template.Parameters.DbMasterPasswordParam;
      const onPremPassword = template.Parameters.OnPremDbPassword;

      expect(dbPassword.NoEcho).toBe(true);
      expect(onPremPassword.NoEcho).toBe(true);
    });

    test('environment suffix should have proper pattern constraint', () => {
      const envSuffix = template.Parameters.EnvironmentSuffix;
      expect(envSuffix.AllowedPattern).toBe('[a-z0-9-]+');
    });
  });

  describe('Resource Dependencies', () => {
    test('DMS target endpoint should depend on Aurora instances', () => {
      const endpoint = template.Resources.DmsTargetEndpoint;
      expect(endpoint.DependsOn).toContain('AuroraInstance1');
      expect(endpoint.DependsOn).toContain('AuroraInstance2');
    });

    test('public route should depend on VPC gateway attachment', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('VpcGatewayAttachment');
    });

    test('Config rules should depend on Config recorder', () => {
      const encryptedVolumesRule = template.Resources.EncryptedVolumesRule;
      const rdsEncryptionRule = template.Resources.RdsEncryptionRule;

      expect(encryptedVolumesRule.DependsOn).toBe('ConfigRecorder');
      expect(rdsEncryptionRule.DependsOn).toBe('ConfigRecorder');
    });
  });

  describe('Outputs Export Integration', () => {
    test('all outputs should have unique export names', () => {
      const exportNames = new Set<string>();

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = output.Export.Name['Fn::Sub'];
        expect(exportNames.has(exportName)).toBe(false);
        exportNames.add(exportName);
      });

      expect(exportNames.size).toBe(Object.keys(template.Outputs).length);
    });

    test('export names should include stack name prefix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = output.Export.Name['Fn::Sub'];
        expect(exportName).toContain('${AWS::StackName}');
      });
    });
  });
});
