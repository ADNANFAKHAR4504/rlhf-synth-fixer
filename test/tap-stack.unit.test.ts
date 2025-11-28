import path from 'path';
import fs from 'fs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('DMS Migration CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description for DMS migration', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('DMS Database Migration');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(42);
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(17);
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
    });

    test('should have subnet CIDR parameters', () => {
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet3CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet3CIDR).toBeDefined();
    });

    test('should have on-premises database parameters', () => {
      expect(template.Parameters.OnPremisesDatabaseEndpoint).toBeDefined();
      expect(template.Parameters.OnPremisesDatabasePort).toBeDefined();
      expect(template.Parameters.OnPremisesDatabasePort.Default).toBe(5432);
      expect(template.Parameters.OnPremisesDatabaseName).toBeDefined();
      expect(template.Parameters.OnPremisesDatabaseUsername).toBeDefined();
      expect(template.Parameters.OnPremisesDatabasePassword).toBeDefined();
      expect(template.Parameters.OnPremisesDatabasePassword.NoEcho).toBe(true);
    });

    test('should have Aurora database parameters', () => {
      expect(template.Parameters.AuroraDBUsername).toBeDefined();
      expect(template.Parameters.AuroraDBPassword).toBeDefined();
      expect(template.Parameters.AuroraDBPassword.NoEcho).toBe(true);
    });

    test('should have Route53 and alert parameters', () => {
      expect(template.Parameters.Route53HostedZoneName).toBeDefined();
      expect(template.Parameters.AlertEmail).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with proper configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should create 3 public subnets in different AZs', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.Properties.AvailabilityZone['Fn::Select'][0]).toBe(index);
      });
    });

    test('should create 3 private subnets in different AZs', () => {
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.AvailabilityZone['Fn::Select'][0]).toBe(index);
      });
    });

    test('should create public route table with internet route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      const route = template.Resources.PublicRoute;

      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should create private route table', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should associate all public subnets with public route table', () => {
      ['PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation', 'PublicSubnet3RouteTableAssociation'].forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association).toBeDefined();
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });

    test('should associate all private subnets with private route table', () => {
      ['PrivateSubnet1RouteTableAssociation', 'PrivateSubnet2RouteTableAssociation', 'PrivateSubnet3RouteTableAssociation'].forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association).toBeDefined();
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should create customer-managed KMS key', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(3);

      // Check IAM root permissions
      expect(keyPolicy.Statement[0].Sid).toBe('Enable IAM User Permissions');
      expect(keyPolicy.Statement[0].Action).toBe('kms:*');

      // Check RDS service permissions
      expect(keyPolicy.Statement[1].Sid).toBe('Allow RDS to use the key');
      expect(keyPolicy.Statement[1].Principal.Service).toBe('rds.amazonaws.com');

      // Check DMS service permissions
      expect(keyPolicy.Statement[2].Sid).toBe('Allow DMS to use the key');
      expect(keyPolicy.Statement[2].Principal.Service).toBe('dms.amazonaws.com');
    });

    test('should create KMS key alias with environment suffix', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should validate KMS encryption is used', () => {
      const kmsKey = template.Resources.KMSKey;
      const auroraCluster = template.Resources.AuroraDBCluster;
      const dmsInstance = template.Resources.DMSReplicationInstance;

      expect(kmsKey).toBeDefined();
      expect(auroraCluster).toBeDefined();
      expect(dmsInstance).toBeDefined();

      // Check Aurora cluster uses KMS encryption
      expect(auroraCluster.Properties.StorageEncrypted).toBe(true);
      expect(auroraCluster.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });

      // Check DMS instance uses KMS encryption
      expect(dmsInstance.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('SSM Parameter Store', () => {
    test('should store on-premises database password in Parameter Store', () => {
      const param = template.Resources.OnPremDBPasswordParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should store Aurora database password in Parameter Store', () => {
      const param = template.Resources.AuroraDBPasswordParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Aurora RDS Resources', () => {
    test('should create Aurora DB subnet group with 3 subnets', () => {
      const subnetGroup = template.Resources.AuroraDBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('should create Aurora security group', () => {
      const sg = template.Resources.AuroraSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(5432);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(5432);
    });

    test('should create Aurora cluster parameter group with SSL enforcement', () => {
      const paramGroup = template.Resources.AuroraDBClusterParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBClusterParameterGroup');
      expect(paramGroup.Properties.Family).toBe('aurora-postgresql15');
      expect(paramGroup.Properties.Parameters['rds.force_ssl']).toBe('1');
    });

    test('should create Aurora cluster with encryption', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.EngineVersion).toBe('15.10');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('Aurora cluster should have Snapshot deletion policy', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.DeletionPolicy).toBe('Snapshot');
      expect(cluster.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('Aurora cluster should have CloudWatch logs enabled', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('should create 3 Aurora DB instances', () => {
      ['AuroraDBInstance1', 'AuroraDBInstance2', 'AuroraDBInstance3'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        expect(instance).toBeDefined();
        expect(instance.Type).toBe('AWS::RDS::DBInstance');
        expect(instance.Properties.Engine).toBe('aurora-postgresql');
        expect(instance.Properties.DBInstanceClass).toBe('db.r5.large');
        expect(instance.Properties.PubliclyAccessible).toBe(false);
        expect(instance.DeletionPolicy).toBe('Snapshot');
        expect(instance.UpdateReplacePolicy).toBe('Snapshot');
      });
    });
  });

  describe('DMS Resources', () => {
    test('should create DMS security group', () => {
      const sg = template.Resources.DMSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(2);
    });

    test('should create DMS replication subnet group with 3 subnets', () => {
      const subnetGroup = template.Resources.DMSReplicationSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::DMS::ReplicationSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('should create DMS replication instance with t3.medium', () => {
      const instance = template.Resources.DMSReplicationInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::DMS::ReplicationInstance');
      expect(instance.Properties.ReplicationInstanceClass).toBe('dms.t3.medium');
      expect(instance.Properties.AllocatedStorage).toBe(100);
      expect(instance.Properties.PubliclyAccessible).toBe(false);
      expect(instance.Properties.MultiAZ).toBe(false);
      // EngineVersion was removed - DMS uses default version
    });

    test('DMS replication instance should use KMS encryption', () => {
      const instance = template.Resources.DMSReplicationInstance;
      expect(instance.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('should create DMS source endpoint with SSL', () => {
      const endpoint = template.Resources.DMSSourceEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(endpoint.Properties.EndpointType).toBe('source');
      expect(endpoint.Properties.EngineName).toBe('postgres');
      expect(endpoint.Properties.SslMode).toBe('require');
    });

    test('should create DMS target endpoint with SSL', () => {
      const endpoint = template.Resources.DMSTargetEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(endpoint.Properties.EndpointType).toBe('target');
      expect(endpoint.Properties.EngineName).toBe('aurora-postgresql');
      expect(endpoint.Properties.SslMode).toBe('require');
    });

    test('should create DMS replication task with full-load-and-cdc', () => {
      const task = template.Resources.DMSReplicationTask;
      expect(task).toBeDefined();
      expect(task.Type).toBe('AWS::DMS::ReplicationTask');
      expect(task.Properties.MigrationType).toBe('full-load-and-cdc');
    });

    test('DMS replication task should have validation enabled', () => {
      const task = template.Resources.DMSReplicationTask;
      const settings = JSON.parse(task.Properties.ReplicationTaskSettings);
      expect(settings.ValidationSettings.EnableValidation).toBe(true);
      expect(settings.ValidationSettings.ValidationMode).toBe('ROW_LEVEL');
    });

    test('DMS replication task should have logging enabled', () => {
      const task = template.Resources.DMSReplicationTask;
      const settings = JSON.parse(task.Properties.ReplicationTaskSettings);
      expect(settings.Logging.EnableLogging).toBe(true);
    });

    test('should validate DMS configuration', () => {
      const replicationInstance = template.Resources.DMSReplicationInstance;
      const sourceEndpoint = template.Resources.DMSSourceEndpoint;
      const targetEndpoint = template.Resources.DMSTargetEndpoint;
      const replicationTask = template.Resources.DMSReplicationTask;

      expect(replicationInstance).toBeDefined();
      expect(replicationInstance.Properties.ReplicationInstanceClass).toBe('dms.t3.medium');
      expect(sourceEndpoint).toBeDefined();
      expect(sourceEndpoint.Properties.EndpointType).toBe('source');
      expect(targetEndpoint).toBeDefined();
      expect(targetEndpoint.Properties.EndpointType).toBe('target');
      expect(replicationTask).toBeDefined();
      expect(replicationTask.Properties.MigrationType).toBe('full-load-and-cdc');
    });
  });

  describe('Route 53 Resources', () => {
    test('should create Route 53 hosted zone', () => {
      const hostedZone = template.Resources.Route53HostedZone;
      expect(hostedZone).toBeDefined();
      expect(hostedZone.Type).toBe('AWS::Route53::HostedZone');
    });

    test('should create on-premises record set with weight 100', () => {
      const recordSet = template.Resources.Route53OnPremRecordSet;
      expect(recordSet).toBeDefined();
      expect(recordSet.Type).toBe('AWS::Route53::RecordSet');
      expect(recordSet.Properties.Type).toBe('CNAME');
      expect(recordSet.Properties.Weight).toBe(100);
      expect(recordSet.Properties.SetIdentifier).toBe('OnPremises');
      expect(recordSet.Properties.TTL).toBe('60');
    });

    test('should create Aurora record set with weight 0', () => {
      const recordSet = template.Resources.Route53AuroraRecordSet;
      expect(recordSet).toBeDefined();
      expect(recordSet.Properties.Type).toBe('CNAME');
      expect(recordSet.Properties.Weight).toBe(0);
      expect(recordSet.Properties.SetIdentifier).toBe('Aurora');
      expect(recordSet.Properties.TTL).toBe('60');
    });

    test('should validate Route53 weighted routing', () => {
      const onPremRecord = template.Resources.Route53OnPremRecordSet;
      const auroraRecord = template.Resources.Route53AuroraRecordSet;

      expect(onPremRecord).toBeDefined();
      expect(onPremRecord.Properties.Weight).toBe(100);
      expect(onPremRecord.Properties.SetIdentifier).toBe('OnPremises');
      expect(auroraRecord).toBeDefined();
      expect(auroraRecord.Properties.Weight).toBe(0);
      expect(auroraRecord.Properties.SetIdentifier).toBe('Aurora');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create SNS topic for alerts', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should create CloudWatch alarm for replication lag', () => {
      const alarm = template.Resources.DMSReplicationLagAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CDCLatencySource');
      expect(alarm.Properties.Namespace).toBe('AWS/DMS');
      expect(alarm.Properties.Threshold).toBe(300);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.DependsOn).toBe('DMSReplicationTask');
    });

    test('CloudWatch alarm should have proper dimensions', () => {
      const alarm = template.Resources.DMSReplicationLagAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(2);
      expect(alarm.Properties.Dimensions[0].Name).toBe('ReplicationInstanceIdentifier');
      expect(alarm.Properties.Dimensions[1].Name).toBe('ReplicationTaskIdentifier');
    });

    test('should create CloudWatch dashboard', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('CloudWatch dashboard should include DMS and Aurora metrics', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'][0];
      expect(bodyTemplate).toContain('CDCLatencySource');
      expect(bodyTemplate).toContain('CDCLatencyTarget');
      expect(bodyTemplate).toContain('CDCIncomingChanges');
      expect(bodyTemplate).toContain('FullLoadThroughputRowsSource');
      expect(bodyTemplate).toContain('CPUUtilization');
      expect(bodyTemplate).toContain('DatabaseConnections');
    });
  });

  describe('Outputs', () => {
    test('should have DMSTaskARN output', () => {
      const output = template.Outputs.DMSTaskARN;
      expect(output).toBeDefined();
      expect(output.Description).toContain('DMS replication task');
      expect(output.Value).toEqual({ Ref: 'DMSReplicationTask' });
    });

    test('should have AuroraClusterEndpoint output', () => {
      const output = template.Outputs.AuroraClusterEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('cluster write endpoint');
      expect(output.Value['Fn::GetAtt'][0]).toBe('AuroraDBCluster');
    });

    test('should have AuroraReaderEndpoint output', () => {
      const output = template.Outputs.AuroraReaderEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('reader endpoint');
      expect(output.Value['Fn::GetAtt'][0]).toBe('AuroraDBCluster');
    });

    test('should have Route53HostedZoneId output', () => {
      const output = template.Outputs.Route53HostedZoneId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'Route53HostedZone' });
    });

    test('should have DMSReplicationInstanceARN output', () => {
      const output = template.Outputs.DMSReplicationInstanceARN;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DMSReplicationInstance' });
    });

    test('should have KMSKeyId output', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'KMSKey' });
    });

    test('should have SNSTopicARN output', () => {
      const output = template.Outputs.SNSTopicARN;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
    });

    test('should have CloudWatchDashboardURL output', () => {
      const output = template.Outputs.CloudWatchDashboardURL;
      expect(output).toBeDefined();
      expect(output.Value['Fn::Sub']).toContain('cloudwatch');
      expect(output.Value['Fn::Sub']).toContain('dashboards');
    });

    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('all outputs should have export names', () => {
      const outputsWithExports = ['DMSTaskARN', 'AuroraClusterEndpoint', 'AuroraReaderEndpoint',
        'Route53HostedZoneId', 'DMSReplicationInstanceARN', 'KMSKeyId', 'SNSTopicARN', 'VPCId'];

      outputsWithExports.forEach(outputName => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix in names', () => {
      const resourcesWithNames = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
        'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3', 'PublicRouteTable',
        'PrivateRouteTable', 'KMSKeyAlias', 'OnPremDBPasswordParameter',
        'AuroraDBPasswordParameter', 'AuroraDBSubnetGroup', 'AuroraSecurityGroup',
        'AuroraDBCluster', 'AuroraDBInstance1', 'AuroraDBInstance2', 'AuroraDBInstance3',
        'DMSSecurityGroup', 'DMSReplicationSubnetGroup', 'DMSReplicationInstance',
        'DMSSourceEndpoint', 'DMSTargetEndpoint', 'DMSReplicationTask',
        'Route53HostedZone', 'SNSTopic', 'DMSReplicationLagAlarm', 'CloudWatchDashboard'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        // Check if resource has Tags or Name properties that include EnvironmentSuffix
        const hasEnvironmentSuffix = JSON.stringify(resource).includes('${EnvironmentSuffix}') ||
                                     JSON.stringify(resource).includes('EnvironmentSuffix');
        expect(hasEnvironmentSuffix).toBe(true);
      });
    });
  });

  describe('Security Validation', () => {
    test('all database passwords should have NoEcho enabled', () => {
      expect(template.Parameters.OnPremisesDatabasePassword.NoEcho).toBe(true);
      expect(template.Parameters.AuroraDBPassword.NoEcho).toBe(true);
    });

    test('Aurora cluster should enforce SSL', () => {
      const paramGroup = template.Resources.AuroraDBClusterParameterGroup;
      expect(paramGroup.Properties.Parameters['rds.force_ssl']).toBe('1');
    });

    test('DMS endpoints should require SSL', () => {
      expect(template.Resources.DMSSourceEndpoint.Properties.SslMode).toBe('require');
      expect(template.Resources.DMSTargetEndpoint.Properties.SslMode).toBe('require');
    });

    test('Aurora instances should not be publicly accessible', () => {
      ['AuroraDBInstance1', 'AuroraDBInstance2', 'AuroraDBInstance3'].forEach(instanceName => {
        expect(template.Resources[instanceName].Properties.PubliclyAccessible).toBe(false);
      });
    });

    test('DMS replication instance should not be publicly accessible', () => {
      expect(template.Resources.DMSReplicationInstance.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('High Availability', () => {
    test('should use 3 availability zones', () => {
      const subnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      subnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.AvailabilityZone['Fn::Select'][0]).toBe(index);
      });
    });

    test('Aurora should have 3 instances for read scaling', () => {
      expect(template.Resources.AuroraDBInstance1).toBeDefined();
      expect(template.Resources.AuroraDBInstance2).toBeDefined();
      expect(template.Resources.AuroraDBInstance3).toBeDefined();
    });

    test('Aurora cluster should have backup retention', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should validate Multi-AZ deployment', () => {
      const privateSubnets = [
        template.Resources.PrivateSubnet1,
        template.Resources.PrivateSubnet2,
        template.Resources.PrivateSubnet3,
      ];

      expect(privateSubnets.every(subnet => subnet !== undefined)).toBe(true);

      const auroraInstances = [
        template.Resources.AuroraDBInstance1,
        template.Resources.AuroraDBInstance2,
        template.Resources.AuroraDBInstance3,
      ];

      expect(auroraInstances.every(instance => instance !== undefined)).toBe(true);
    });
  });

  describe('Deletion Policies', () => {
    test('should validate deletion policies for Aurora resources', () => {
      const auroraCluster = template.Resources.AuroraDBCluster;
      const auroraInstance1 = template.Resources.AuroraDBInstance1;
      const auroraInstance2 = template.Resources.AuroraDBInstance2;
      const auroraInstance3 = template.Resources.AuroraDBInstance3;

      expect(auroraCluster.DeletionPolicy).toBe('Snapshot');
      expect(auroraCluster.UpdateReplacePolicy).toBe('Snapshot');
      expect(auroraInstance1.DeletionPolicy).toBe('Snapshot');
      expect(auroraInstance1.UpdateReplacePolicy).toBe('Snapshot');
      expect(auroraInstance2.DeletionPolicy).toBe('Snapshot');
      expect(auroraInstance2.UpdateReplacePolicy).toBe('Snapshot');
      expect(auroraInstance3.DeletionPolicy).toBe('Snapshot');
      expect(auroraInstance3.UpdateReplacePolicy).toBe('Snapshot');
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 42 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(42);
    });

    test('should have exactly 17 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(17);
    });

    test('should have exactly 9 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });
});
