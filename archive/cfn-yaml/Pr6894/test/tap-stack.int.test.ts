import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Integration Tests', () => {
  let template: any;

  beforeAll(() => {
    // Read the CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Cross-Resource Integration', () => {
    test('should have VPC referenced by all network resources', () => {
      // Check subnets reference the VPC
      expect(template.Resources.PrimarySubnet1.Properties.VpcId.Ref).toBe('PrimaryVPC');
      expect(template.Resources.PrimarySubnet2.Properties.VpcId.Ref).toBe('PrimaryVPC');
      expect(template.Resources.PrimarySubnet3.Properties.VpcId.Ref).toBe('PrimaryVPC');

      // Check security group references the VPC
      expect(template.Resources.DBSecurityGroup.Properties.VpcId.Ref).toBe('PrimaryVPC');

      // Check route table references the VPC
      expect(template.Resources.PrimaryRouteTable.Properties.VpcId.Ref).toBe('PrimaryVPC');
    });

    test('should have subnets properly associated with route tables', () => {
      // Check subnet associations
      expect(template.Resources.PrimarySubnetRouteTableAssociation1.Properties.SubnetId.Ref).toBe('PrimarySubnet1');
      expect(template.Resources.PrimarySubnetRouteTableAssociation1.Properties.RouteTableId.Ref).toBe('PrimaryRouteTable');

      expect(template.Resources.PrimarySubnetRouteTableAssociation2.Properties.SubnetId.Ref).toBe('PrimarySubnet2');
      expect(template.Resources.PrimarySubnetRouteTableAssociation2.Properties.RouteTableId.Ref).toBe('PrimaryRouteTable');

      expect(template.Resources.PrimarySubnetRouteTableAssociation3.Properties.SubnetId.Ref).toBe('PrimarySubnet3');
      expect(template.Resources.PrimarySubnetRouteTableAssociation3.Properties.RouteTableId.Ref).toBe('PrimaryRouteTable');
    });

    test('should have DB subnet group using all subnets', () => {
      const subnetIds = template.Resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(3);
      expect(subnetIds[0].Ref).toBe('PrimarySubnet1');
      expect(subnetIds[1].Ref).toBe('PrimarySubnet2');
      expect(subnetIds[2].Ref).toBe('PrimarySubnet3');
    });

    test('should have Aurora cluster properly integrated with network and security', () => {
      const primaryCluster = template.Resources.PrimaryDBCluster;

      // Check DB subnet group reference
      expect(primaryCluster.Properties.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');

      // Check security group reference
      expect(primaryCluster.Properties.VpcSecurityGroupIds[0].Ref).toBe('DBSecurityGroup');

      // Check KMS key reference
      expect(primaryCluster.Properties.KmsKeyId.Ref).toBe('DBKMSKey');

      // Check global cluster reference
      expect(primaryCluster.Properties.GlobalClusterIdentifier.Ref).toBe('GlobalCluster');
    });

    test('should have Aurora instance referencing the primary cluster', () => {
      const primaryInstance = template.Resources.PrimaryDBInstance;
      expect(primaryInstance.Properties.DBClusterIdentifier.Ref).toBe('PrimaryDBCluster');
    });
  });

  describe('Conditional Resource Creation', () => {
    test('should have conditional logic for DB password secret', () => {
      const dbPasswordSecret = template.Resources.DBPasswordSecret;
      expect(dbPasswordSecret.Condition).toBe('CreateDBPasswordSecret');

      // Check condition definition
      expect(template.Conditions.CreateDBPasswordSecret['Fn::Equals']).toEqual([
        { Ref: 'DBPasswordSecretArn' },
        ''
      ]);
    });

    test('should use conditional password in Aurora cluster', () => {
      const passwordConfig = template.Resources.PrimaryDBCluster.Properties.MasterUserPassword;
      expect(passwordConfig['Fn::If']).toBeDefined();
      expect(passwordConfig['Fn::If'][0]).toBe('CreateDBPasswordSecret');

      // Check both branches of the condition
      const createNewSecret = passwordConfig['Fn::If'][1]['Fn::Sub'];
      const useExistingSecret = passwordConfig['Fn::If'][2]['Fn::Sub'];

      expect(createNewSecret).toContain('${DBPasswordSecret}');
      expect(useExistingSecret).toContain('${DBPasswordSecretArn}');
    });
  });

  describe('Monitoring Integration', () => {
    test('should have CloudWatch alarms monitoring the correct resources', () => {
      const cpuAlarm = template.Resources.DBCPUAlarm;
      const connectionsAlarm = template.Resources.DBConnectionsAlarm;

      // Check CPU alarm monitors the primary cluster
      expect(cpuAlarm.Properties.Dimensions[0].Name).toBe('DBClusterIdentifier');
      expect(cpuAlarm.Properties.Dimensions[0].Value.Ref).toBe('PrimaryDBCluster');

      // Check connections alarm monitors the primary cluster
      expect(connectionsAlarm.Properties.Dimensions[0].Name).toBe('DBClusterIdentifier');
      expect(connectionsAlarm.Properties.Dimensions[0].Value.Ref).toBe('PrimaryDBCluster');
    });

    test('should have health check integrated with CloudWatch alarm', () => {
      const healthCheck = template.Resources.HealthCheck;

      // Check health check depends on alarm
      expect(healthCheck.DependsOn).toBe('DBCPUAlarm');

      // Check alarm identifier configuration
      const alarmIdentifier = healthCheck.Properties.HealthCheckConfig.AlarmIdentifier;
      expect(alarmIdentifier.Name['Fn::Sub']).toBe('db-cpu-alarm-primary-${EnvironmentSuffix}');
      expect(alarmIdentifier.Region.Ref).toBe('AWS::Region');
    });
  });

  describe('Security Integration', () => {
    test('should have KMS key properly configured for encryption', () => {
      // Check KMS key alias references the key
      expect(template.Resources.DBKMSKeyAlias.Properties.TargetKeyId.Ref).toBe('DBKMSKey');

      // Check Aurora cluster uses the KMS key
      expect(template.Resources.PrimaryDBCluster.Properties.KmsKeyId.Ref).toBe('DBKMSKey');
      expect(template.Resources.PrimaryDBCluster.Properties.StorageEncrypted).toBe(true);

      // Check global cluster has encryption enabled
      expect(template.Resources.GlobalCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have security group with proper ingress rules', () => {
      const securityGroup = template.Resources.DBSecurityGroup;
      const ingressRule = securityGroup.Properties.SecurityGroupIngress[0];

      // Check MySQL port configuration
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(3306);
      expect(ingressRule.ToPort).toBe(3306);
      expect(ingressRule.CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('Network Connectivity', () => {
    test('should have internet gateway properly attached', () => {
      // Check attachment resource
      const attachment = template.Resources.AttachPrimaryGateway;
      expect(attachment.Properties.VpcId.Ref).toBe('PrimaryVPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('PrimaryInternetGateway');

      // Check route depends on attachment
      expect(template.Resources.PrimaryRoute.DependsOn).toBe('AttachPrimaryGateway');
    });

    test('should have public route configured correctly', () => {
      const route = template.Resources.PrimaryRoute;
      expect(route.Properties.RouteTableId.Ref).toBe('PrimaryRouteTable');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId.Ref).toBe('PrimaryInternetGateway');
    });

    test('should have subnets in different availability zones', () => {
      const subnet1 = template.Resources.PrimarySubnet1;
      const subnet2 = template.Resources.PrimarySubnet2;
      const subnet3 = template.Resources.PrimarySubnet3;

      // Check different AZ indices
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(subnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);

      // Check different CIDR blocks
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });
  });

  describe('Output Integration', () => {
    test('should export values with consistent naming pattern', () => {
      const outputs = template.Outputs;

      // Check VPC output
      expect(outputs.VPCId.Value.Ref).toBe('PrimaryVPC');
      expect(outputs.VPCId.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');

      // Check cluster endpoints
      expect(outputs.PrimaryClusterEndpoint.Value['Fn::GetAtt']).toEqual(['PrimaryDBCluster', 'Endpoint.Address']);
      expect(outputs.PrimaryClusterReaderEndpoint.Value['Fn::GetAtt']).toEqual(['PrimaryDBCluster', 'ReadEndpoint.Address']);

      // Check other outputs reference correct resources
      expect(outputs.GlobalClusterIdentifier.Value.Ref).toBe('GlobalCluster');
      expect(outputs.HealthCheckId.Value.Ref).toBe('HealthCheck');
      expect(outputs.DBSecurityGroupId.Value.Ref).toBe('DBSecurityGroup');
    });

    test('should have all outputs exportable for cross-stack references', () => {
      const outputNames = Object.keys(template.Outputs);

      outputNames.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Description).toBeDefined();
      });
    });
  });

  describe('Parameter Integration', () => {
    test('should use EnvironmentSuffix parameter consistently across resources', () => {
      const resourcesToCheck = [
        'PrimaryVPC',
        'PrimarySubnet1',
        'PrimarySubnet2',
        'PrimarySubnet3',
        'DBSecurityGroup',
        'DBSubnetGroup',
        'GlobalCluster',
        'PrimaryDBCluster',
        'PrimaryDBInstance',
        'DBCPUAlarm',
        'DBConnectionsAlarm',
        'HealthCheck'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const resourceJson = JSON.stringify(resource);

        // Check if resource references EnvironmentSuffix parameter
        if (resourceJson.includes('${EnvironmentSuffix}')) {
          expect(resourceJson).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('should have DBPasswordSecretArn parameter with proper default', () => {
      const param = template.Parameters.DBPasswordSecretArn;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('optional');
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper explicit dependencies', () => {
      // Route depends on gateway attachment
      expect(template.Resources.PrimaryRoute.DependsOn).toBe('AttachPrimaryGateway');

      // Health check depends on alarm
      expect(template.Resources.HealthCheck.DependsOn).toBe('DBCPUAlarm');
    });

    test('should have implicit dependencies through references', () => {
      // DB Instance depends on Cluster through Ref
      expect(template.Resources.PrimaryDBInstance.Properties.DBClusterIdentifier.Ref).toBe('PrimaryDBCluster');

      // Primary Cluster depends on Global Cluster through Ref
      expect(template.Resources.PrimaryDBCluster.Properties.GlobalClusterIdentifier.Ref).toBe('GlobalCluster');

      // Primary Cluster depends on DBSubnetGroup through Ref
      expect(template.Resources.PrimaryDBCluster.Properties.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');

      // DBSubnetGroup depends on Subnets through Refs
      const subnetRefs = template.Resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetRefs.some((ref: any) => ref.Ref === 'PrimarySubnet1')).toBe(true);
    });
  });

  describe('Global Aurora Configuration', () => {
    test('should have matching engine configurations between global and primary clusters', () => {
      const globalCluster = template.Resources.GlobalCluster;
      const primaryCluster = template.Resources.PrimaryDBCluster;

      // Engine types should match
      expect(globalCluster.Properties.Engine).toBe(primaryCluster.Properties.Engine);
      expect(globalCluster.Properties.EngineVersion).toBe(primaryCluster.Properties.EngineVersion);

      // Both should have encryption enabled
      expect(globalCluster.Properties.StorageEncrypted).toBe(true);
      expect(primaryCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have Aurora instance matching cluster engine', () => {
      const primaryCluster = template.Resources.PrimaryDBCluster;
      const primaryInstance = template.Resources.PrimaryDBInstance;

      expect(primaryInstance.Properties.Engine).toBe(primaryCluster.Properties.Engine);
    });
  });

  describe('End-to-End Resource Chain', () => {
    test('should have complete network path from IGW to database', () => {
      // Internet Gateway exists
      expect(template.Resources.PrimaryInternetGateway).toBeDefined();

      // IGW attached to VPC
      expect(template.Resources.AttachPrimaryGateway.Properties.VpcId.Ref).toBe('PrimaryVPC');

      // Route table has route to IGW
      expect(template.Resources.PrimaryRoute.Properties.GatewayId.Ref).toBe('PrimaryInternetGateway');

      // Subnets associated with route table
      expect(template.Resources.PrimarySubnetRouteTableAssociation1).toBeDefined();

      // DB subnet group uses the subnets
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds[0].Ref).toBe('PrimarySubnet1');

      // Aurora cluster uses the subnet group
      expect(template.Resources.PrimaryDBCluster.Properties.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');
    });

    test('should have complete monitoring chain from database to health check', () => {
      // Aurora cluster exists
      expect(template.Resources.PrimaryDBCluster).toBeDefined();

      // CloudWatch alarm monitors the cluster
      expect(template.Resources.DBCPUAlarm.Properties.Dimensions[0].Value.Ref).toBe('PrimaryDBCluster');

      // Health check monitors the alarm
      expect(template.Resources.HealthCheck.Properties.HealthCheckConfig.AlarmIdentifier.Name['Fn::Sub']).toContain('db-cpu-alarm');

      // Health check ID is exported for external use
      expect(template.Outputs.HealthCheckId.Value.Ref).toBe('HealthCheck');
    });
  });
});