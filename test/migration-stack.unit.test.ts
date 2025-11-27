import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Migration Stack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/migration-stack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Zero-downtime payment system migration');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.MigrationVpcCidr).toBeDefined();
      expect(template.Parameters.MigrationVpcCidr.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.ProductionVpcId).toBeDefined();
      expect(template.Parameters.ProductionVpcCidr).toBeDefined();
      expect(template.Parameters.ProductionVpcCidr.Default).toBe('10.1.0.0/16');
    });

    test('should have traffic weight parameters', () => {
      expect(template.Parameters.TrafficWeightOld).toBeDefined();
      expect(template.Parameters.TrafficWeightOld.Type).toBe('Number');
      expect(template.Parameters.TrafficWeightOld.Default).toBe(100);
      expect(template.Parameters.TrafficWeightOld.MinValue).toBe(0);
      expect(template.Parameters.TrafficWeightOld.MaxValue).toBe(100);

      expect(template.Parameters.TrafficWeightNew).toBeDefined();
      expect(template.Parameters.TrafficWeightNew.Type).toBe('Number');
      expect(template.Parameters.TrafficWeightNew.Default).toBe(0);
    });

    test('should have database parameters', () => {
      expect(template.Parameters.DbMasterUsername).toBeDefined();
      expect(template.Parameters.DbMasterUsername.Default).toBe('admin');
      expect(template.Parameters.DbMasterPasswordParam).toBeDefined();
      expect(template.Parameters.DbMasterPasswordParam.NoEcho).toBe(true);
    });

    test('should have on-premises parameters', () => {
      expect(template.Parameters.OnPremDatabaseHost).toBeDefined();
      expect(template.Parameters.OnPremDatabasePort).toBeDefined();
      expect(template.Parameters.OnPremDatabasePort.Default).toBe(3306);
      expect(template.Parameters.OnPremNfsServerHost).toBeDefined();
      expect(template.Parameters.OnPremDbPassword).toBeDefined();
      expect(template.Parameters.OnPremDbPassword.NoEcho).toBe(true);
    });

    test('should have hosted zone parameter', () => {
      expect(template.Parameters.HostedZoneName).toBeDefined();
      expect(template.Parameters.HostedZoneName.Default).toBe('migration.example.com');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key', () => {
      const kmsKey = template.Resources.KmsKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
    });

    test('KMS key should have correct policy', () => {
      const kmsKey = template.Resources.KmsKey;
      const policy = kmsKey.Properties.KeyPolicy;
      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Sid).toBe('Enable IAM policies');
      expect(policy.Statement[1].Sid).toBe('Allow services to use the key');
    });

    test('should have KMS key alias with environment suffix', () => {
      const alias = template.Resources.KmsKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/migration-${EnvironmentSuffix}'
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have migration VPC', () => {
      const vpc = template.Resources.MigrationVpc;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should use CIDR from parameter', () => {
      const vpc = template.Resources.MigrationVpc;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'MigrationVpcCidr' });
    });

    test('should have internet gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC gateway attachment', () => {
      const attachment = template.Resources.VpcGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'MigrationVpc' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have 3 public subnets in different AZs', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
      });
    });

    test('should have 3 private subnets in different AZs', () => {
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
      });
    });

    test('should have public route table with internet gateway route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.DependsOn).toBe('VpcGatewayAttachment');
    });

    test('should have private route table', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have VPC peering connection', () => {
      const peering = template.Resources.VpcPeeringConnection;
      expect(peering).toBeDefined();
      expect(peering.Type).toBe('AWS::EC2::VPCPeeringConnection');
      expect(peering.Properties.VpcId).toEqual({ Ref: 'MigrationVpc' });
      expect(peering.Properties.PeerVpcId).toEqual({ Ref: 'ProductionVpcId' });
    });

    test('should have peering route to production VPC', () => {
      const route = template.Resources.PeeringRouteToProduction;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toEqual({ Ref: 'ProductionVpcCidr' });
      expect(route.Properties.VpcPeeringConnectionId).toEqual({ Ref: 'VpcPeeringConnection' });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.AlbSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.Properties.SecurityGroupIngress[1].FromPort).toBe(443);
    });

    test('should have application security group', () => {
      const sg = template.Resources.AppSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(8080);
    });

    test('should have database security group', () => {
      const sg = template.Resources.DbSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(3);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
    });

    test('should have DMS security group', () => {
      const sg = template.Resources.DmsSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('all security groups should include environment suffix in name', () => {
      ['AlbSecurityGroup', 'AppSecurityGroup', 'DbSecurityGroup', 'DmsSecurityGroup'].forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.GroupName).toEqual({
          'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}')
        });
      });
    });
  });

  describe('RDS Aurora Resources', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DbSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('Aurora cluster should have 7-day backup retention', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('Aurora cluster should be encrypted', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'KmsKey' });
    });

    test('Aurora cluster should enable CloudWatch logs', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('should have 2 Aurora instances', () => {
      const instance1 = template.Resources.AuroraInstance1;
      const instance2 = template.Resources.AuroraInstance2;

      expect(instance1).toBeDefined();
      expect(instance1.Type).toBe('AWS::RDS::DBInstance');
      expect(instance1.Properties.Engine).toBe('aurora-mysql');
      expect(instance1.Properties.DBInstanceClass).toBe('db.r5.large');

      expect(instance2).toBeDefined();
      expect(instance2.Type).toBe('AWS::RDS::DBInstance');
      expect(instance2.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraCluster' });
    });

    test('Aurora instances should not be publicly accessible', () => {
      const instance1 = template.Resources.AuroraInstance1;
      const instance2 = template.Resources.AuroraInstance2;

      expect(instance1.Properties.PubliclyAccessible).toBe(false);
      expect(instance2.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('DMS Resources', () => {
    test('should have DMS subnet group', () => {
      const subnetGroup = template.Resources.DmsSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::DMS::ReplicationSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('should have DMS replication instance', () => {
      const instance = template.Resources.DmsReplicationInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::DMS::ReplicationInstance');
      expect(instance.Properties.ReplicationInstanceClass).toBe('dms.t3.medium');
      expect(instance.Properties.AllocatedStorage).toBe(100);
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have DMS source endpoint', () => {
      const endpoint = template.Resources.DmsSourceEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(endpoint.Properties.EndpointType).toBe('source');
      expect(endpoint.Properties.EngineName).toBe('mysql');
      expect(endpoint.Properties.ServerName).toEqual({ Ref: 'OnPremDatabaseHost' });
      expect(endpoint.Properties.Port).toEqual({ Ref: 'OnPremDatabasePort' });
    });

    test('should have DMS target endpoint', () => {
      const endpoint = template.Resources.DmsTargetEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(endpoint.Properties.EndpointType).toBe('target');
      expect(endpoint.Properties.EngineName).toBe('aurora');
      expect(endpoint.Properties.SslMode).toBe('require');
      expect(endpoint.DependsOn).toContain('AuroraInstance1');
      expect(endpoint.DependsOn).toContain('AuroraInstance2');
    });

    test('should have DMS replication task', () => {
      const task = template.Resources.DmsReplicationTask;
      expect(task).toBeDefined();
      expect(task.Type).toBe('AWS::DMS::ReplicationTask');
      expect(task.Properties.MigrationType).toBe('full-load-and-cdc');
      expect(task.Properties.SourceEndpointArn).toEqual({ Ref: 'DmsSourceEndpoint' });
      expect(task.Properties.TargetEndpointArn).toEqual({ Ref: 'DmsTargetEndpoint' });
    });

    test('DMS replication task should have correct table mappings', () => {
      const task = template.Resources.DmsReplicationTask;
      const tableMappings = JSON.parse(task.Properties.TableMappings);
      expect(tableMappings.rules).toHaveLength(1);
      expect(tableMappings.rules[0]['rule-type']).toBe('selection');
      expect(tableMappings.rules[0]['rule-action']).toBe('include');
    });
  });

  describe('DataSync Resources', () => {
    test('should have S3 bucket for migration', () => {
      const bucket = template.Resources.MigrationBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.MigrationBucket;
      const config = bucket.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should have DataSync IAM role', () => {
      const role = template.Resources.DataSyncRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonS3FullAccess');
    });

    test('should have DataSync S3 location', () => {
      const location = template.Resources.DataSyncS3Location;
      expect(location).toBeDefined();
      expect(location.Type).toBe('AWS::DataSync::LocationS3');
      expect(location.Properties.Subdirectory).toBe('/migrated-data');
    });

    test('should have DataSync NFS location', () => {
      const location = template.Resources.DataSyncNfsLocation;
      expect(location).toBeDefined();
      expect(location.Type).toBe('AWS::DataSync::LocationNFS');
      expect(location.Properties.ServerHostname).toEqual({ Ref: 'OnPremNfsServerHost' });
      expect(location.Properties.Subdirectory).toBe('/exports/payment-data');
    });

    test('should have DataSync task', () => {
      const task = template.Resources.DataSyncTask;
      expect(task).toBeDefined();
      expect(task.Type).toBe('AWS::DataSync::Task');
      expect(task.Properties.Options.VerifyMode).toBe('ONLY_FILES_TRANSFERRED');
      expect(task.Properties.Options.OverwriteMode).toBe('ALWAYS');
      expect(task.Properties.Options.LogLevel).toBe('TRANSFER');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(3);
    });

    test('should have old environment target group', () => {
      const tg = template.Resources.OldEnvironmentTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(8080);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.TargetType).toBe('ip');
    });

    test('should have new environment target group', () => {
      const tg = template.Resources.NewEnvironmentTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
    });

    test('should have ALB listener with weighted forwarding', () => {
      const listener = template.Resources.AlbListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');

      const forwardConfig = listener.Properties.DefaultActions[0].ForwardConfig;
      expect(forwardConfig.TargetGroups).toHaveLength(2);
      expect(forwardConfig.TargetGroups[0].Weight).toEqual({ Ref: 'TrafficWeightOld' });
      expect(forwardConfig.TargetGroups[1].Weight).toEqual({ Ref: 'TrafficWeightNew' });
    });
  });

  describe('Route 53 Resources', () => {
    test('should have hosted zone', () => {
      const hostedZone = template.Resources.HostedZone;
      expect(hostedZone).toBeDefined();
      expect(hostedZone.Type).toBe('AWS::Route53::HostedZone');
      expect(hostedZone.Properties.Name).toEqual({ Ref: 'HostedZoneName' });
    });

    test('should have Route 53 record for old environment', () => {
      const record = template.Resources.Route53RecordOld;
      expect(record).toBeDefined();
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.SetIdentifier).toBe('Old-Environment');
      expect(record.Properties.Weight).toEqual({ Ref: 'TrafficWeightOld' });
    });

    test('should have Route 53 record for new environment', () => {
      const record = template.Resources.Route53RecordNew;
      expect(record).toBeDefined();
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.SetIdentifier).toBe('New-Environment');
      expect(record.Properties.Weight).toEqual({ Ref: 'TrafficWeightNew' });
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('CloudWatch dashboard should include DMS and RDS metrics', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'][0];
      expect(dashboardBody).toContain('AWS/DMS');
      expect(dashboardBody).toContain('AWS/RDS');
      expect(dashboardBody).toContain('AWS/ApplicationELB');
    });
  });

  describe('AWS Config Resources', () => {
    test('should have Config recorder IAM role', () => {
      const role = template.Resources.ConfigRecorderRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('should have Config S3 bucket', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have Config recorder', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
    });

    test('should have Config delivery channel', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('should have encrypted volumes config rule', () => {
      const rule = template.Resources.EncryptedVolumesRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('ENCRYPTED_VOLUMES');
      expect(rule.DependsOn).toBe('ConfigRecorder');
    });

    test('should have RDS encryption config rule', () => {
      const rule = template.Resources.RdsEncryptionRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('RDS_STORAGE_ENCRYPTED');
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      const output = template.Outputs.VpcId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'MigrationVpc' });
      expect(output.Export).toBeDefined();
    });

    test('should have Aurora cluster endpoints', () => {
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.AuroraClusterReadEndpoint).toBeDefined();
    });

    test('should have Load Balancer DNS output', () => {
      const output = template.Outputs.LoadBalancerDns;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('should have migration bucket output', () => {
      const output = template.Outputs.MigrationBucketName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'MigrationBucket' });
    });

    test('should have CloudWatch dashboard URL', () => {
      const output = template.Outputs.CloudWatchDashboardUrl;
      expect(output).toBeDefined();
      expect(output.Value['Fn::Sub']).toContain('cloudwatch');
      expect(output.Value['Fn::Sub']).toContain('migration-dashboard-${EnvironmentSuffix}');
    });

    test('should have DMS task ARN output', () => {
      const output = template.Outputs.DmsReplicationTaskArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DmsReplicationTask' });
    });

    test('should have DataSync task ARN output', () => {
      const output = template.Outputs.DataSyncTaskArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DataSyncTask' });
    });

    test('should have hosted zone ID output', () => {
      const output = template.Outputs.HostedZoneId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'HostedZone' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include environment suffix', () => {
      const resourcesWithNames = [
        'MigrationVpc', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
        'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3', 'PublicRouteTable', 'PrivateRouteTable',
        'VpcPeeringConnection', 'AlbSecurityGroup', 'AppSecurityGroup', 'DbSecurityGroup', 'DmsSecurityGroup',
        'DbSubnetGroup', 'AuroraCluster', 'AuroraInstance1', 'AuroraInstance2',
        'DmsSubnetGroup', 'DmsReplicationInstance', 'DmsSourceEndpoint', 'DmsTargetEndpoint',
        'DmsReplicationTask', 'MigrationBucket', 'DataSyncRole', 'ApplicationLoadBalancer',
        'OldEnvironmentTargetGroup', 'NewEnvironmentTargetGroup', 'CloudWatchDashboard',
        'ConfigRecorderRole', 'ConfigBucket', 'ConfigRecorder', 'ConfigDeliveryChannel'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const hasNameProperty =
            resource.Properties.TableName ||
            resource.Properties.BucketName ||
            resource.Properties.DBClusterIdentifier ||
            resource.Properties.DBInstanceIdentifier ||
            resource.Properties.ReplicationInstanceIdentifier ||
            resource.Properties.EndpointIdentifier ||
            resource.Properties.ReplicationTaskIdentifier ||
            resource.Properties.ReplicationSubnetGroupIdentifier ||
            resource.Properties.DBSubnetGroupName ||
            resource.Properties.GroupName ||
            resource.Properties.Name ||
            resource.Properties.DashboardName ||
            resource.Properties.RoleName;

          if (hasNameProperty) {
            const nameValue = hasNameProperty;
            if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
              expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
            }
          }
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });

    test('Aurora cluster should not have deletion protection', () => {
      const cluster = template.Resources.AuroraCluster;
      // Deletion protection is not set, which defaults to false
      expect(cluster.Properties.DeletionProtection).not.toBe(true);
    });

    test('S3 buckets should be destroyable', () => {
      const migrationBucket = template.Resources.MigrationBucket;
      const configBucket = template.Resources.ConfigBucket;

      expect(migrationBucket.DeletionPolicy).not.toBe('Retain');
      expect(configBucket.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Resource Count', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // Count all resources defined in template
      expect(resourceCount).toBeGreaterThan(50);
      expect(resourceCount).toBeLessThan(60);
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(13);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });
});
