import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Migration Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the template
    // Run: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description about migration infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Migration Infrastructure');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have VPN configuration parameters', () => {
      expect(template.Parameters.OnPremisesCIDR).toBeDefined();
      expect(template.Parameters.CustomerGatewayIP).toBeDefined();

      const onPremCIDR = template.Parameters.OnPremisesCIDR;
      expect(onPremCIDR.Type).toBe('String');
      expect(onPremCIDR.Default).toBe('192.168.0.0/16');

      const cgwIP = template.Parameters.CustomerGatewayIP;
      expect(cgwIP.Type).toBe('String');
      expect(cgwIP.AllowedPattern).toMatch(/\d/);
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Resources.DBMasterPasswordSecret).toBeDefined();
      expect(template.Parameters.OnPremisesDBEndpoint).toBeDefined();
      expect(template.Parameters.OnPremisesDBPort).toBeDefined();
      expect(template.Parameters.OnPremisesDBName).toBeDefined();
      expect(template.Parameters.OnPremisesDBUsername).toBeDefined();
      expect(template.Parameters.OnPremisesDBPassword).toBeDefined();
    });

    test('password parameters should have NoEcho enabled', () => {
      expect(template.Resources.DBMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Parameters.OnPremisesDBPassword.NoEcho).toBe(true);
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC with correct CIDR block', () => {
      expect(template.Resources.MigrationVPC).toBeDefined();
      const vpc = template.Resources.MigrationVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('should have two public subnets in different AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets in different AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('should have NAT Gateway for private subnets', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();

      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');

      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should have proper route tables configuration', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();

      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');

      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('VPN Configuration', () => {
    test('should have VPN Gateway', () => {
      expect(template.Resources.VPNGateway).toBeDefined();
      const vpnGateway = template.Resources.VPNGateway;
      expect(vpnGateway.Type).toBe('AWS::EC2::VPNGateway');
      expect(vpnGateway.Properties.Type).toBe('ipsec.1');
    });

    test('should have Customer Gateway', () => {
      expect(template.Resources.CustomerGateway).toBeDefined();
      const cgw = template.Resources.CustomerGateway;
      expect(cgw.Type).toBe('AWS::EC2::CustomerGateway');
      expect(cgw.Properties.Type).toBe('ipsec.1');
      expect(cgw.Properties.BgpAsn).toBe(65000);
    });

    test('should have VPN Connection', () => {
      expect(template.Resources.VPNConnection).toBeDefined();
      const vpnConn = template.Resources.VPNConnection;
      expect(vpnConn.Type).toBe('AWS::EC2::VPNConnection');
      expect(vpnConn.Properties.Type).toBe('ipsec.1');
      expect(vpnConn.Properties.StaticRoutesOnly).toBe(true);
    });

    test('should have VPN Connection Route', () => {
      expect(template.Resources.VPNConnectionRoute).toBeDefined();
      const route = template.Resources.VPNConnectionRoute;
      expect(route.Type).toBe('AWS::EC2::VPNConnectionRoute');
    });

    test('should have VPN Gateway Route Propagation', () => {
      expect(template.Resources.VPNGatewayRoutePropagation).toBeDefined();
      const propagation = template.Resources.VPNGatewayRoutePropagation;
      expect(propagation.Type).toBe('AWS::EC2::VPNGatewayRoutePropagation');
    });

    test('should attach VPN Gateway to VPC', () => {
      expect(template.Resources.AttachVPNGateway).toBeDefined();
      const attachment = template.Resources.AttachVPNGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443)).toBe(true);
    });

    test('should have web tier security group', () => {
      expect(template.Resources.WebTierSecurityGroup).toBeDefined();
      const sg = template.Resources.WebTierSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.length).toBeGreaterThanOrEqual(2);
    });

    test('should have database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.every((rule: any) => rule.FromPort === 3306)).toBe(true);
      expect(ingress.every((rule: any) => rule.ToPort === 3306)).toBe(true);
    });

    test('should have DMS security group', () => {
      expect(template.Resources.DMSSecurityGroup).toBeDefined();
      const sg = template.Resources.DMSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('all security groups should have EnvironmentSuffix in name', () => {
      const securityGroups = [
        'ALBSecurityGroup',
        'WebTierSecurityGroup',
        'DatabaseSecurityGroup',
        'DMSSecurityGroup',
      ];

      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.GroupName).toEqual({
          'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
        });
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should have Aurora database credentials secret', () => {
      expect(template.Resources.AuroraDBSecret).toBeDefined();
      const secret = template.Resources.AuroraDBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': expect.stringContaining('aurora-credentials'),
      });
    });

    test('should have on-premises database credentials secret', () => {
      expect(template.Resources.OnPremisesDBSecret).toBeDefined();
      const secret = template.Resources.OnPremisesDBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': expect.stringContaining('onprem-db-credentials'),
      });
    });

    test('secrets should reference parameters', () => {
      const auroraSecret = template.Resources.AuroraDBSecret;
      expect(auroraSecret.Properties.SecretString).toEqual({
        'Fn::Sub': expect.any(String),
      });
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have Aurora cluster', () => {
      expect(template.Resources.AuroraDBCluster).toBeDefined();
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.DatabaseName).toBe('appdb');
    });

    test('Aurora cluster should have serverless v2 scaling', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
      const scaling = cluster.Properties.ServerlessV2ScalingConfiguration;
      expect(scaling.MinCapacity).toBe(0.5);
      expect(scaling.MaxCapacity).toBe(1);
    });

    test('Aurora cluster should have deletion policy Delete', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
    });

    test('should have Aurora DB instance', () => {
      expect(template.Resources.AuroraDBInstance).toBeDefined();
      const instance = template.Resources.AuroraDBInstance;
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-mysql');
      expect(instance.Properties.DBInstanceClass).toBe('db.serverless');
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('Aurora instance should have deletion policy Delete', () => {
      const instance = template.Resources.AuroraDBInstance;
      expect(instance.DeletionPolicy).toBe('Delete');
    });

    test('Aurora cluster should have backup configuration', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
      expect(cluster.Properties.PreferredBackupWindow).toBeDefined();
      expect(cluster.Properties.PreferredMaintenanceWindow).toBeDefined();
    });
  });

  describe('DMS Resources', () => {
    test('should have DMS subnet group', () => {
      expect(template.Resources.DMSSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DMSSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::DMS::ReplicationSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have DMS replication instance', () => {
      expect(template.Resources.DMSReplicationInstance).toBeDefined();
      const instance = template.Resources.DMSReplicationInstance;
      expect(instance.Type).toBe('AWS::DMS::ReplicationInstance');
      expect(instance.Properties.ReplicationInstanceClass).toBe('dms.t3.medium');
      expect(instance.Properties.PubliclyAccessible).toBe(false);
      expect(instance.Properties.MultiAZ).toBe(false);
    });

    test('should have DMS source endpoint for on-premises', () => {
      expect(template.Resources.DMSSourceEndpoint).toBeDefined();
      const endpoint = template.Resources.DMSSourceEndpoint;
      expect(endpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(endpoint.Properties.EndpointType).toBe('source');
      expect(endpoint.Properties.EngineName).toBe('mysql');
    });

    test('should have DMS target endpoint for Aurora', () => {
      expect(template.Resources.DMSTargetEndpoint).toBeDefined();
      const endpoint = template.Resources.DMSTargetEndpoint;
      expect(endpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(endpoint.Properties.EndpointType).toBe('target');
      expect(endpoint.Properties.EngineName).toBe('aurora');
    });

    test('should have DMS replication task', () => {
      expect(template.Resources.DMSReplicationTask).toBeDefined();
      const task = template.Resources.DMSReplicationTask;
      expect(task.Type).toBe('AWS::DMS::ReplicationTask');
      expect(task.Properties.MigrationType).toBe('full-load-and-cdc');
    });

    test('DMS task should have table mappings', () => {
      const task = template.Resources.DMSReplicationTask;
      expect(task.Properties.TableMappings).toBeDefined();
      const mappings = JSON.parse(task.Properties.TableMappings);
      expect(mappings.rules).toBeDefined();
      expect(mappings.rules.length).toBeGreaterThan(0);
    });

    test('DMS task should have replication task settings', () => {
      const task = template.Resources.DMSReplicationTask;
      expect(task.Properties.ReplicationTaskSettings).toBeDefined();
      const settings = JSON.parse(task.Properties.ReplicationTaskSettings);
      expect(settings.Logging.EnableLogging).toBe(true);
      expect(settings.FullLoadSettings).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have ALB target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('ALB target group should have health check', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.Port).toBe(80);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have DMS replication lag alarm', () => {
      expect(template.Resources.DMSReplicationLagAlarm).toBeDefined();
      const alarm = template.Resources.DMSReplicationLagAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CDCLatencySource');
      expect(alarm.Properties.Namespace).toBe('AWS/DMS');
      expect(alarm.Properties.Threshold).toBe(300);
    });

    test('should have DMS task failed alarm', () => {
      expect(template.Resources.DMSReplicationTaskFailedAlarm).toBeDefined();
      const alarm = template.Resources.DMSReplicationTaskFailedAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ReplicationTaskStatus');
    });

    test('should have Aurora connections alarm', () => {
      expect(template.Resources.AuroraDBConnectionsAlarm).toBeDefined();
      const alarm = template.Resources.AuroraDBConnectionsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('should have Aurora CPU utilization alarm', () => {
      expect(template.Resources.AuroraCPUUtilizationAlarm).toBeDefined();
      const alarm = template.Resources.AuroraCPUUtilizationAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('all alarms should have EnvironmentSuffix in name', () => {
      const alarms = [
        'DMSReplicationLagAlarm',
        'DMSReplicationTaskFailedAlarm',
        'AuroraDBConnectionsAlarm',
        'AuroraCPUUtilizationAlarm',
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmName).toEqual({
          'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
        });
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix in naming', () => {
      const resourcesWithNames = [
        'MigrationVPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGateway',
        'VPNGateway',
        'CustomerGateway',
        'VPNConnection',
        'AuroraDBCluster',
        'AuroraDBInstance',
        'DMSReplicationInstance',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.Name ||
          resource.Properties.DBClusterIdentifier ||
          resource.Properties.DBInstanceIdentifier ||
          resource.Properties.ReplicationInstanceIdentifier;

        // Skip properties that are references to other resources
        if (nameProperty && !nameProperty.Ref) {
          expect(nameProperty).toEqual({
            'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
          });
        }

        // Check tags as fallback
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Name'
          );
          if (nameTag) {
            expect(nameTag.Value).toEqual({
              'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
            });
          }
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'VPNGatewayId',
        'CustomerGatewayId',
        'VPNConnectionId',
        'AuroraClusterEndpoint',
        'AuroraClusterReadEndpoint',
        'AuroraClusterPort',
        'AuroraDBSecretArn',
        'OnPremisesDBSecretArn',
        'DMSReplicationInstanceArn',
        'DMSReplicationTaskArn',
        'ApplicationLoadBalancerDNS',
        'ApplicationLoadBalancerArn',
        'ALBTargetGroupArn',
        'WebTierSecurityGroupId',
        'DatabaseSecurityGroupId',
        'CloudWatchDashboardURL',
        'EnvironmentSuffix',
        'StackName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description).not.toBe('');
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });

    test('VPN outputs should provide connection information', () => {
      expect(template.Outputs.VPNGatewayId.Value).toEqual({ Ref: 'VPNGateway' });
      expect(template.Outputs.CustomerGatewayId.Value).toEqual({
        Ref: 'CustomerGateway',
      });
      expect(template.Outputs.VPNConnectionId.Value).toEqual({
        Ref: 'VPNConnection',
      });
    });

    test('Aurora outputs should provide database connection information', () => {
      expect(template.Outputs.AuroraClusterEndpoint.Value).toEqual({
        'Fn::GetAtt': ['AuroraDBCluster', 'Endpoint.Address'],
      });
      expect(template.Outputs.AuroraClusterReadEndpoint.Value).toEqual({
        'Fn::GetAtt': ['AuroraDBCluster', 'ReadEndpoint.Address'],
      });
      expect(template.Outputs.AuroraClusterPort.Value).toEqual({
        'Fn::GetAtt': ['AuroraDBCluster', 'Endpoint.Port'],
      });
    });

    test('DMS outputs should provide replication information', () => {
      expect(template.Outputs.DMSReplicationInstanceArn.Value).toEqual({
        Ref: 'DMSReplicationInstance',
      });
      expect(template.Outputs.DMSReplicationTaskArn.Value).toEqual({
        Ref: 'DMSReplicationTask',
      });
    });

    test('ALB outputs should provide load balancer information', () => {
      expect(template.Outputs.ApplicationLoadBalancerDNS.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
      expect(template.Outputs.ApplicationLoadBalancerArn.Value).toEqual({
        Ref: 'ApplicationLoadBalancer',
      });
    });

    test('CloudWatch dashboard URL should be constructed correctly', () => {
      expect(template.Outputs.CloudWatchDashboardURL.Value).toEqual({
        'Fn::Sub': expect.stringContaining('cloudwatch'),
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have all major resource categories', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40);
    });

    test('should have sufficient parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(8);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(20);
    });

    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('no resources should have deletion protection enabled', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties?.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });

  describe('Dependencies and References', () => {
    test('VPN Gateway should be attached to VPC', () => {
      const attachment = template.Resources.AttachVPNGateway;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'MigrationVPC' });
      expect(attachment.Properties.VpnGatewayId).toEqual({ Ref: 'VPNGateway' });
    });

    test('NAT Gateway should depend on Internet Gateway attachment', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('DMS target endpoint should depend on Aurora instance', () => {
      const endpoint = template.Resources.DMSTargetEndpoint;
      expect(endpoint.DependsOn).toBe('AuroraDBInstance');
    });

    test('Aurora instance should reference Aurora cluster', () => {
      const instance = template.Resources.AuroraDBInstance;
      expect(instance.Properties.DBClusterIdentifier).toEqual({
        Ref: 'AuroraDBCluster',
      });
    });

    test('security groups should reference each other correctly', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSG.Properties.SecurityGroupIngress;

      const hasWebTierRef = ingress.some(
        (rule: any) =>
          rule.SourceSecurityGroupId &&
          rule.SourceSecurityGroupId.Ref === 'WebTierSecurityGroup'
      );
      const hasDMSRef = ingress.some(
        (rule: any) =>
          rule.SourceSecurityGroupId &&
          rule.SourceSecurityGroupId.Ref === 'DMSSecurityGroup'
      );

      expect(hasWebTierRef).toBe(true);
      expect(hasDMSRef).toBe(true);
    });
  });

  describe('Migration-Specific Requirements', () => {
    test('should support full-load-and-cdc migration', () => {
      const task = template.Resources.DMSReplicationTask;
      expect(task.Properties.MigrationType).toBe('full-load-and-cdc');
    });

    test('should have credentials stored in Secrets Manager', () => {
      expect(template.Resources.AuroraDBSecret).toBeDefined();
      expect(template.Resources.OnPremisesDBSecret).toBeDefined();
    });

    test('should have VPN for on-premises connectivity', () => {
      expect(template.Resources.VPNGateway).toBeDefined();
      expect(template.Resources.CustomerGateway).toBeDefined();
      expect(template.Resources.VPNConnection).toBeDefined();
    });

    test('should have monitoring via CloudWatch alarms', () => {
      const alarmCount = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      ).length;
      expect(alarmCount).toBeGreaterThanOrEqual(4);
    });

    test('should use Aurora Serverless for cost optimization', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();

      const instance = template.Resources.AuroraDBInstance;
      expect(instance.Properties.DBInstanceClass).toBe('db.serverless');
    });
  });
});
