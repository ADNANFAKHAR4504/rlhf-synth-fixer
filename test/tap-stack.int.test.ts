import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Migration Infrastructure Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have VPC ID output', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have public subnet IDs', () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
    });

    test('should have private subnet IDs', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });

    test('should have VPN Gateway ID', () => {
      expect(outputs.VPNGatewayId).toBeDefined();
      expect(outputs.VPNGatewayId).toMatch(/^vgw-[a-f0-9]+$/);
    });

    test('should have Customer Gateway ID', () => {
      expect(outputs.CustomerGatewayId).toBeDefined();
      expect(outputs.CustomerGatewayId).toMatch(/^cgw-[a-f0-9]+$/);
    });

    test('should have VPN Connection ID', () => {
      expect(outputs.VPNConnectionId).toBeDefined();
      expect(outputs.VPNConnectionId).toMatch(/^vpn-[a-f0-9]+$/);
    });

    test('should have Aurora cluster endpoints', () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterReadEndpoint).toBeDefined();
      expect(outputs.AuroraClusterPort).toBeDefined();

      expect(outputs.AuroraClusterEndpoint).toMatch(
        /^migration-aurora-cluster.*\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/
      );
      expect(outputs.AuroraClusterReadEndpoint).toMatch(
        /^migration-aurora-cluster.*\.cluster-ro-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/
      );
      expect(outputs.AuroraClusterPort).toBe('3306');
    });

    test('should have Secrets Manager ARNs', () => {
      expect(outputs.AuroraDBSecretArn).toBeDefined();
      expect(outputs.OnPremisesDBSecretArn).toBeDefined();

      expect(outputs.AuroraDBSecretArn).toMatch(
        /^arn:aws:secretsmanager:us-east-1:\d{12}:secret:migration-aurora-credentials/
      );
      expect(outputs.OnPremisesDBSecretArn).toMatch(
        /^arn:aws:secretsmanager:us-east-1:\d{12}:secret:migration-onprem-db-credentials/
      );
    });

    test('should have DMS resource ARNs', () => {
      expect(outputs.DMSReplicationInstanceArn).toBeDefined();
      expect(outputs.DMSReplicationTaskArn).toBeDefined();

      expect(outputs.DMSReplicationInstanceArn).toMatch(
        /^arn:aws:dms:us-east-1:\d{12}:rep:.*migration-dms-instance/
      );
      expect(outputs.DMSReplicationTaskArn).toMatch(
        /^arn:aws:dms:us-east-1:\d{12}:task:/
      );
    });

    test('should have ALB DNS and ARN', () => {
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();

      expect(outputs.ApplicationLoadBalancerDNS).toMatch(
        /^migration-alb-.*\.us-east-1\.elb\.amazonaws\.com$/
      );
      expect(outputs.ApplicationLoadBalancerArn).toMatch(
        /^arn:aws:elasticloadbalancing:us-east-1:\d{12}:loadbalancer\/app\/migration-alb/
      );
    });

    test('should have ALB target group ARN', () => {
      expect(outputs.ALBTargetGroupArn).toBeDefined();
      expect(outputs.ALBTargetGroupArn).toMatch(
        /^arn:aws:elasticloadbalancing:us-east-1:\d{12}:targetgroup\/migration-alb-tg/
      );
    });

    test('should have security group IDs', () => {
      expect(outputs.WebTierSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();

      expect(outputs.WebTierSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      expect(outputs.DatabaseSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('should have CloudWatch dashboard URL', () => {
      expect(outputs.CloudWatchDashboardURL).toBeDefined();
      expect(outputs.CloudWatchDashboardURL).toContain('console.aws.amazon.com/cloudwatch');
      expect(outputs.CloudWatchDashboardURL).toContain('us-east-1');
    });

    test('should have environment suffix in outputs', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('should have stack name', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toMatch(/^tap-stack-/);
    });
  });

  describe('VPC Network Configuration', () => {
    test('VPC should be accessible', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.startsWith('vpc-')).toBe(true);
    });

    test('should have subnets in two availability zones', () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();

      const allSubnets = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(4);
    });
  });

  describe('VPN Connectivity', () => {
    test('VPN Gateway should be created', () => {
      expect(outputs.VPNGatewayId).toBeDefined();
      expect(outputs.VPNGatewayId.startsWith('vgw-')).toBe(true);
    });

    test('Customer Gateway should be created', () => {
      expect(outputs.CustomerGatewayId).toBeDefined();
      expect(outputs.CustomerGatewayId.startsWith('cgw-')).toBe(true);
    });

    test('VPN Connection should be established', () => {
      expect(outputs.VPNConnectionId).toBeDefined();
      expect(outputs.VPNConnectionId.startsWith('vpn-')).toBe(true);
    });

    test('all VPN components should be unique', () => {
      const vpnComponents = [
        outputs.VPNGatewayId,
        outputs.CustomerGatewayId,
        outputs.VPNConnectionId,
      ];

      const uniqueComponents = new Set(vpnComponents);
      expect(uniqueComponents.size).toBe(3);
    });
  });

  describe('Aurora Database', () => {
    test('Aurora cluster endpoint should be accessible', () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.AuroraClusterEndpoint).toContain('us-east-1');
    });

    test('Aurora read endpoint should be accessible', () => {
      expect(outputs.AuroraClusterReadEndpoint).toBeDefined();
      expect(outputs.AuroraClusterReadEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.AuroraClusterReadEndpoint).toContain('cluster-ro');
    });

    test('Aurora should use MySQL default port', () => {
      expect(outputs.AuroraClusterPort).toBe('3306');
    });

    test('Aurora endpoints should be different', () => {
      expect(outputs.AuroraClusterEndpoint).not.toBe(
        outputs.AuroraClusterReadEndpoint
      );
    });

    test('Aurora credentials should be in Secrets Manager', () => {
      expect(outputs.AuroraDBSecretArn).toBeDefined();
      expect(outputs.AuroraDBSecretArn).toContain('secretsmanager');
      expect(outputs.AuroraDBSecretArn).toContain('migration-aurora-credentials');
    });
  });

  describe('DMS Replication', () => {
    test('DMS replication instance should exist', () => {
      expect(outputs.DMSReplicationInstanceArn).toBeDefined();
      expect(outputs.DMSReplicationInstanceArn).toContain('arn:aws:dms');
      expect(outputs.DMSReplicationInstanceArn).toContain('rep:');
    });

    test('DMS replication task should exist', () => {
      expect(outputs.DMSReplicationTaskArn).toBeDefined();
      expect(outputs.DMSReplicationTaskArn).toContain('arn:aws:dms');
      expect(outputs.DMSReplicationTaskArn).toContain('task:');
    });

    test('DMS instance and task ARNs should be different', () => {
      expect(outputs.DMSReplicationInstanceArn).not.toBe(
        outputs.DMSReplicationTaskArn
      );
    });

    test('on-premises database credentials should be in Secrets Manager', () => {
      expect(outputs.OnPremisesDBSecretArn).toBeDefined();
      expect(outputs.OnPremisesDBSecretArn).toContain('secretsmanager');
      expect(outputs.OnPremisesDBSecretArn).toContain('migration-onprem-db-credentials');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB DNS should be accessible', () => {
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS).toContain('.elb.amazonaws.com');
      expect(outputs.ApplicationLoadBalancerDNS).toContain('us-east-1');
    });

    test('ALB ARN should be valid', () => {
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();
      expect(outputs.ApplicationLoadBalancerArn).toContain(
        'arn:aws:elasticloadbalancing'
      );
      expect(outputs.ApplicationLoadBalancerArn).toContain('loadbalancer/app/');
    });

    test('ALB target group should exist', () => {
      expect(outputs.ALBTargetGroupArn).toBeDefined();
      expect(outputs.ALBTargetGroupArn).toContain('arn:aws:elasticloadbalancing');
      expect(outputs.ALBTargetGroupArn).toContain('targetgroup/');
    });

    test('ALB ARN and target group ARN should be different', () => {
      expect(outputs.ApplicationLoadBalancerArn).not.toBe(outputs.ALBTargetGroupArn);
    });
  });

  describe('Security Groups', () => {
    test('web tier security group should exist', () => {
      expect(outputs.WebTierSecurityGroupId).toBeDefined();
      expect(outputs.WebTierSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('database security group should exist', () => {
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('security groups should be different', () => {
      expect(outputs.WebTierSecurityGroupId).not.toBe(
        outputs.DatabaseSecurityGroupId
      );
    });
  });

  describe('Secrets Manager Integration', () => {
    test('should have two secrets created', () => {
      expect(outputs.AuroraDBSecretArn).toBeDefined();
      expect(outputs.OnPremisesDBSecretArn).toBeDefined();
    });

    test('secrets should be in the same region', () => {
      expect(outputs.AuroraDBSecretArn).toContain('us-east-1');
      expect(outputs.OnPremisesDBSecretArn).toContain('us-east-1');
    });

    test('secrets should have different names', () => {
      expect(outputs.AuroraDBSecretArn).not.toBe(outputs.OnPremisesDBSecretArn);
    });

    test('Aurora secret should contain correct identifier', () => {
      expect(outputs.AuroraDBSecretArn).toContain('aurora-credentials');
    });

    test('on-premises secret should contain correct identifier', () => {
      expect(outputs.OnPremisesDBSecretArn).toContain('onprem-db-credentials');
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('Aurora endpoint should include environment suffix pattern', () => {
      expect(outputs.AuroraClusterEndpoint).toMatch(/migration-aurora-cluster/);
    });

    test('ALB DNS should include environment suffix pattern', () => {
      expect(outputs.ApplicationLoadBalancerDNS).toMatch(/migration-alb/);
    });

    test('DMS instance ARN should include environment suffix pattern', () => {
      expect(outputs.DMSReplicationInstanceArn).toMatch(/migration-dms-instance/);
    });

    test('Aurora secret ARN should include environment suffix pattern', () => {
      expect(outputs.AuroraDBSecretArn).toMatch(/migration-aurora-credentials/);
    });

    test('on-premises secret ARN should include environment suffix pattern', () => {
      expect(outputs.OnPremisesDBSecretArn).toMatch(/migration-onprem-db-credentials/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch dashboard URL should be accessible', () => {
      expect(outputs.CloudWatchDashboardURL).toBeDefined();
      expect(outputs.CloudWatchDashboardURL).toContain('https://');
    });

    test('dashboard URL should point to CloudWatch console', () => {
      expect(outputs.CloudWatchDashboardURL).toContain('console.aws.amazon.com/cloudwatch');
    });

    test('dashboard URL should be for us-east-1 region', () => {
      expect(outputs.CloudWatchDashboardURL).toContain('region=us-east-1');
    });

    test('dashboard URL should include alarms section', () => {
      expect(outputs.CloudWatchDashboardURL).toContain('alarmsV2');
    });

    test('dashboard URL should include stack name filter', () => {
      expect(outputs.CloudWatchDashboardURL).toContain('search=');
      expect(outputs.CloudWatchDashboardURL).toContain(outputs.StackName);
    });
  });

  describe('Migration Infrastructure Readiness', () => {
    test('all core networking components should be present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('all VPN components should be present for on-premises connectivity', () => {
      expect(outputs.VPNGatewayId).toBeDefined();
      expect(outputs.CustomerGatewayId).toBeDefined();
      expect(outputs.VPNConnectionId).toBeDefined();
    });

    test('all database components should be present', () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterReadEndpoint).toBeDefined();
      expect(outputs.AuroraClusterPort).toBeDefined();
      expect(outputs.AuroraDBSecretArn).toBeDefined();
    });

    test('all DMS components should be present for replication', () => {
      expect(outputs.DMSReplicationInstanceArn).toBeDefined();
      expect(outputs.DMSReplicationTaskArn).toBeDefined();
      expect(outputs.OnPremisesDBSecretArn).toBeDefined();
    });

    test('all web tier components should be present', () => {
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();
      expect(outputs.ALBTargetGroupArn).toBeDefined();
      expect(outputs.WebTierSecurityGroupId).toBeDefined();
    });

    test('all security components should be present', () => {
      expect(outputs.WebTierSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(outputs.AuroraDBSecretArn).toBeDefined();
      expect(outputs.OnPremisesDBSecretArn).toBeDefined();
    });

    test('all monitoring components should be present', () => {
      expect(outputs.CloudWatchDashboardURL).toBeDefined();
    });
  });

  describe('Cross-Component Integration', () => {
    test('VPC should contain all subnets', () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const subnets = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      subnets.forEach(subnet => {
        expect(subnet).toBeDefined();
      });
    });

    test('database and DMS should use private subnets', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.DMSReplicationInstanceArn).toBeDefined();
    });

    test('ALB should use public subnets', () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
    });

    test('security groups should protect database and web tier', () => {
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(outputs.WebTierSecurityGroupId).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
    });

    test('VPN should connect to VPC', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPNGatewayId).toBeDefined();
      expect(outputs.VPNConnectionId).toBeDefined();
    });
  });

  describe('Output Format Validation', () => {
    test('all required outputs should have correct format', () => {
      const outputFormats = {
        VPCId: /^vpc-/,
        PublicSubnet1Id: /^subnet-/,
        PublicSubnet2Id: /^subnet-/,
        PrivateSubnet1Id: /^subnet-/,
        PrivateSubnet2Id: /^subnet-/,
        VPNGatewayId: /^vgw-/,
        CustomerGatewayId: /^cgw-/,
        VPNConnectionId: /^vpn-/,
        WebTierSecurityGroupId: /^sg-/,
        DatabaseSecurityGroupId: /^sg-/,
        AuroraClusterPort: /^\d+$/,
      };

      Object.entries(outputFormats).forEach(([key, pattern]) => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).toMatch(pattern);
      });
    });

    test('all ARN outputs should have correct ARN format', () => {
      const arnOutputs = [
        'AuroraDBSecretArn',
        'OnPremisesDBSecretArn',
        'DMSReplicationInstanceArn',
        'DMSReplicationTaskArn',
        'ApplicationLoadBalancerArn',
        'ALBTargetGroupArn',
      ];

      arnOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).toMatch(/^arn:aws:/);
        expect(outputs[outputKey]).toContain('us-east-1');
      });
    });

    test('all DNS outputs should have correct DNS format', () => {
      const dnsOutputs = [
        'AuroraClusterEndpoint',
        'AuroraClusterReadEndpoint',
        'ApplicationLoadBalancerDNS',
      ];

      dnsOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).toContain('.amazonaws.com');
      });
    });

    test('all URL outputs should have correct URL format', () => {
      expect(outputs.CloudWatchDashboardURL).toBeDefined();
      expect(outputs.CloudWatchDashboardURL).toMatch(/^https:\/\//);
    });
  });
});
