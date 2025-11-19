import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Document Management System Migration', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ============================================
  // Template Structure Tests
  // ============================================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for migration infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Document Management System Migration Infrastructure');
      expect(template.Description).toContain('DMS');
      expect(template.Description).toContain('DataSync');
    });

    test('should have all required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct number of parameters', () => {
      expect(Object.keys(template.Parameters).length).toBe(12);
    });

    test('should have correct number of resources', () => {
      expect(Object.keys(template.Resources).length).toBe(49);
    });

    test('should have correct number of outputs', () => {
      expect(Object.keys(template.Outputs).length).toBe(12);
    });
  });

  // ============================================
  // Parameters Tests
  // ============================================
  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(param.Description).toContain('Unique suffix for resource names');
    });

    test('should have VPC networking parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PublicSubnetCIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.NoEcho).toBe(true);
    });

    test('should have source system parameters for migration', () => {
      expect(template.Parameters.SourceDatabaseEndpoint).toBeDefined();
      expect(template.Parameters.SourceDatabaseName).toBeDefined();
      expect(template.Parameters.SourceDatabaseUsername).toBeDefined();
      expect(template.Parameters.SourceDatabasePassword).toBeDefined();
      expect(template.Parameters.SourceDatabasePort).toBeDefined();
    });

    test('should have AlertEmailAddress parameter with email validation', () => {
      const param = template.Parameters.AlertEmailAddress;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toContain('@');
    });

    test('all sensitive parameters should have NoEcho enabled', () => {
      const sensitiveParams = [
        'DBMasterUsername',
        'SourceDatabaseUsername',
        'SourceDatabasePassword'
      ];
      sensitiveParams.forEach(paramName => {
        expect(template.Parameters[paramName].NoEcho).toBe(true);
      });
    });
  });

  // ============================================
  // VPC and Network Infrastructure Tests
  // ============================================
  describe('VPC and Network Infrastructure', () => {
    test('should have VPC resource with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should have InternetGateway attached to VPC', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');

      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have public subnet with correct availability zone', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets for DMS and database resources', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateway with Elastic IP', () => {
      const natEip = template.Resources.NATGatewayEIP;
      expect(natEip).toBeDefined();
      expect(natEip.Type).toBe('AWS::EC2::EIP');
      expect(natEip.Properties.Domain).toBe('vpc');

      const natGw = template.Resources.NATGateway;
      expect(natGw).toBeDefined();
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw.Properties.AllocationId).toBeDefined();
    });

    test('should have public route table with internet gateway route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      const route = template.Resources.DefaultPublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have private route table with NAT gateway route', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      const route = template.Resources.DefaultPrivateRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('all subnets should be associated with route tables', () => {
      const associations = Object.entries(template.Resources)
        .filter(([_, res]: any) => res.Type === 'AWS::EC2::SubnetRouteTableAssociation');
      expect(associations.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================
  // KMS Encryption Tests
  // ============================================
  describe('KMS Encryption Keys', () => {
    test('should have RDS encryption key', () => {
      const key = template.Resources.RDSEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.KeyPolicy).toBeDefined();
    });

    test('should have EFS encryption key', () => {
      const key = template.Resources.EFSEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.KeyPolicy).toBeDefined();
    });

    test('should have KMS key aliases', () => {
      const rdsAlias = template.Resources.RDSEncryptionKeyAlias;
      const efsAlias = template.Resources.EFSEncryptionKeyAlias;
      expect(rdsAlias).toBeDefined();
      expect(rdsAlias.Type).toBe('AWS::KMS::Alias');
      expect(efsAlias).toBeDefined();
      expect(efsAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  // ============================================
  // Security Groups Tests
  // ============================================
  describe('Security Groups', () => {
    test('should have RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have DMS security group', () => {
      const sg = template.Resources.DMSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have EFS security group', () => {
      const sg = template.Resources.EFSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DataSync security group', () => {
      const sg = template.Resources.DataSyncSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS security group should allow MySQL from DMS', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);
      const mysqlRule = ingress.find((rule: any) =>
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'DMSSecurityGroup' });
    });
  });

  // ============================================
  // RDS Aurora MySQL Tests
  // ============================================
  describe('RDS Aurora MySQL Cluster', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
    });

    test('should have Aurora cluster with encryption', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('should have Aurora instances across availability zones', () => {
      const instances = Object.entries(template.Resources)
        .filter(([_, res]: any) => res.Type === 'AWS::RDS::DBInstance');
      expect(instances.length).toBeGreaterThanOrEqual(2);

      instances.forEach(([name, instance]: any) => {
        expect(instance.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraCluster' });
        expect(instance.Properties.Engine).toBe('aurora-mysql');
      });
    });

    test('Aurora cluster should reference master username', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.MasterUsername).toEqual({ Ref: 'DBMasterUsername' });
    });

  });

  // ============================================
  // EFS File System Tests
  // ============================================
  describe('EFS File System', () => {
    test('should have EFS file system with encryption', () => {
      const efs = template.Resources.FileSystem;
      expect(efs).toBeDefined();
      expect(efs.Type).toBe('AWS::EFS::FileSystem');
      expect(efs.Properties.Encrypted).toBe(true);
      expect(efs.Properties.KmsKeyId).toBeDefined();
    });

    test('should have lifecycle policy for IA transition', () => {
      const efs = template.Resources.FileSystem;
      expect(efs.Properties.LifecyclePolicies).toBeDefined();
      const iaPolicy = efs.Properties.LifecyclePolicies.find(
        (p: any) => p.TransitionToIA === 'AFTER_30_DAYS'
      );
      expect(iaPolicy).toBeDefined();
    });

    test('should have mount targets in private subnets', () => {
      const mountTargets = Object.entries(template.Resources)
        .filter(([_, res]: any) => res.Type === 'AWS::EFS::MountTarget');
      expect(mountTargets.length).toBeGreaterThanOrEqual(2);

      mountTargets.forEach(([_, mt]: any) => {
        expect(mt.Properties.FileSystemId).toEqual({ Ref: 'FileSystem' });
        expect(mt.Properties.SecurityGroups).toContainEqual({ Ref: 'EFSSecurityGroup' });
      });
    });
  });

  // ============================================
  // DMS Resources Tests
  // ============================================
  describe('DMS Resources', () => {
    test('should have DMS subnet group', () => {
      const subnetGroup = template.Resources.DMSSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::DMS::ReplicationSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
    });

    test('should have DMS replication instance', () => {
      const instance = template.Resources.DMSReplicationInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::DMS::ReplicationInstance');
      expect(instance.Properties.ReplicationInstanceClass).toBe('dms.r5.large');
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have source and target DMS endpoints', () => {
      const sourceEndpoint = template.Resources.DMSSourceEndpoint;
      const targetEndpoint = template.Resources.DMSTargetEndpoint;
      expect(sourceEndpoint).toBeDefined();
      expect(sourceEndpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(targetEndpoint).toBeDefined();
      expect(targetEndpoint.Type).toBe('AWS::DMS::Endpoint');
    });

    test('should have DMS replication task with full-load and CDC', () => {
      const task = template.Resources.DMSReplicationTask;
      expect(task).toBeDefined();
      expect(task.Type).toBe('AWS::DMS::ReplicationTask');
      expect(task.Properties.MigrationType).toBe('full-load-and-cdc');
    });

  });

  // ============================================
  // CloudWatch and Monitoring Tests
  // ============================================
  describe('CloudWatch and Monitoring', () => {
    test('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.MigrationDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('should have CloudWatch alarms for migration monitoring', () => {
      const alarms = Object.entries(template.Resources)
        .filter(([_, res]: any) => res.Type === 'AWS::CloudWatch::Alarm');
      expect(alarms.length).toBeGreaterThanOrEqual(3);
    });

    test('CloudWatch alarms should publish to SNS topic', () => {
      const alarms = Object.entries(template.Resources)
        .filter(([_, res]: any) => res.Type === 'AWS::CloudWatch::Alarm');
      alarms.forEach(([_, alarm]: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'MigrationAlertTopic' });
      });
    });
  });

  // ============================================
  // SNS Topic Tests
  // ============================================
  describe('SNS Topic', () => {
    test('should have migration alerts SNS topic', () => {
      const topic = template.Resources.MigrationAlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have email subscription for alerts', () => {
      const subscription = template.Resources.MigrationAlertSubscription;
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.Endpoint).toEqual({ Ref: 'AlertEmailAddress' });
    });

  });

  // ============================================
  // SSM Parameters Tests
  // ============================================
  describe('SSM Parameters', () => {
    test('should have SSM parameters for configuration management', () => {
      const ssmParams = Object.entries(template.Resources)
        .filter(([_, res]: any) => res.Type === 'AWS::SSM::Parameter');
      expect(ssmParams.length).toBe(6);
    });

    test('should have RDS endpoint SSM parameters', () => {
      const params = ['SSMRDSEndpoint', 'SSMRDSPort', 'SSMRDSUsername'];
      params.forEach(paramName => {
        const param = template.Resources[paramName];
        expect(param).toBeDefined();
        expect(param.Type).toBe('AWS::SSM::Parameter');
      });
    });

    test('should have EFS and DMS SSM parameters', () => {
      expect(template.Resources.SSMEFSId).toBeDefined();
      expect(template.Resources.SSMDMSInstanceArn).toBeDefined();
      expect(template.Resources.SSMMigrationStatus).toBeDefined();
    });

    test('SSM parameters should use String type (not SecureString)', () => {
      const ssmParams = Object.entries(template.Resources)
        .filter(([_, res]: any) => res.Type === 'AWS::SSM::Parameter');
      ssmParams.forEach(([_, param]: any) => {
        expect(param.Properties.Type).toBe('String');
      });
    });

  });

  // ============================================
  // Resource Tagging Tests
  // ============================================
  describe('Resource Tagging', () => {
    test('VPC should have all required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();

      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('MigrationPhase');
      expect(tagKeys).toContain('DataClassification');
    });

    test('RDS cluster should have environment tag', () => {
      const cluster = template.Resources.AuroraCluster;
      const tags = cluster.Properties.Tags;
      expect(tags).toBeDefined();
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('EFS should have environment tag', () => {
      const efs = template.Resources.FileSystem;
      const tags = efs.Properties.FileSystemTags;
      expect(tags).toBeDefined();
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
    });
  });

  // ============================================
  // Outputs Tests
  // ============================================
  describe('Outputs', () => {
    test('should have all required stack outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetIds',
        'AuroraClusterEndpoint',
        'AuroraClusterPort',
        'EFSFileSystemId',
        'DMSReplicationInstanceArn',
        'DMSReplicationTaskArn',
        'SNSTopicArn',
        'CloudWatchDashboardURL',
        'RDSEncryptionKeyId',
        'EFSEncryptionKeyId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Description).toBeDefined();
    });

    test('RDS outputs should reference cluster attributes', () => {
      const endpoint = template.Outputs.AuroraClusterEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Value).toBeDefined();

      const port = template.Outputs.AuroraClusterPort;
      expect(port).toBeDefined();
      expect(port.Value).toBeDefined();
    });

    test('EFS output should reference file system ID', () => {
      const output = template.Outputs.EFSFileSystemId;
      expect(output.Value).toEqual({ Ref: 'FileSystem' });
    });

    test('all outputs should have descriptions', () => {
      Object.entries(template.Outputs).forEach(([name, output]: any) => {
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // Environment Suffix Compliance Tests
  // ============================================
  describe('Environment Suffix Compliance', () => {
    test('all named resources should include environment suffix', () => {
      const namedResources = [
        'VPC',
        'InternetGateway',
        'AuroraCluster',
        'DMSReplicationInstance',
        'FileSystem',
        'MigrationAlertTopic',
        'RDSSecurityGroup',
        'DMSSecurityGroup',
        'EFSSecurityGroup',
        'DataSyncSecurityGroup'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        const nameProperty = resource.Properties.Name ||
                            resource.Properties.TopicName ||
                            resource.Properties.DBClusterIdentifier ||
                            resource.Properties.ReplicationInstanceIdentifier ||
                            resource.Properties.GroupName;

        if (nameProperty && nameProperty.Sub) {
          expect(nameProperty.Sub).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  // ============================================
  // No Retain Policy Tests
  // ============================================
  describe('Deletion Policy Compliance', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.entries(template.Resources).forEach(([name, resource]: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });
  });
});
