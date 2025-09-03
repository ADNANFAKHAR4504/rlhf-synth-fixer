// Integration tests for Terraform Multi-Region HA Infrastructure
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let deploymentOutputs: any = {};

if (fs.existsSync(outputsPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('Multi-Region HA Infrastructure Integration Tests', () => {
  
  describe('Deployment Outputs Validation', () => {
    test('should have deployment outputs available', () => {
      expect(Object.keys(deploymentOutputs).length).toBeGreaterThan(0);
    });

    test('should have primary ALB DNS', () => {
      expect(deploymentOutputs.primary_alb_dns).toBeDefined();
      expect(deploymentOutputs.primary_alb_dns).toMatch(/\.elb\.amazonaws\.com$/);
    });

    test('should have secondary ALB DNS', () => {
      expect(deploymentOutputs.secondary_alb_dns).toBeDefined();
      expect(deploymentOutputs.secondary_alb_dns).toMatch(/\.elb\.amazonaws\.com$/);
    });

    test('should have Route53 zone name', () => {
      expect(deploymentOutputs.route53_zone_name).toBeDefined();
      expect(deploymentOutputs.route53_zone_name).toMatch(/\.internal\.local$/);
    });

    test('should have SNS topic ARNs', () => {
      expect(deploymentOutputs.sns_topic_arn_primary).toBeDefined();
      expect(deploymentOutputs.sns_topic_arn_primary).toMatch(/^arn:aws:sns:/);
      expect(deploymentOutputs.sns_topic_arn_secondary).toBeDefined();
      expect(deploymentOutputs.sns_topic_arn_secondary).toMatch(/^arn:aws:sns:/);
    });

    test('should have ARC control plane resources', () => {
      expect(deploymentOutputs.arc_cluster_arn).toBeDefined();
      expect(deploymentOutputs.arc_cluster_arn).toMatch(/^arn:aws:route53-recovery-control/);
      expect(deploymentOutputs.arc_control_panel_arn).toBeDefined();
      expect(deploymentOutputs.primary_routing_control_arn).toBeDefined();
      expect(deploymentOutputs.secondary_routing_control_arn).toBeDefined();
    });
  });

  describe('Multi-Region Architecture Validation', () => {
    test('primary and secondary ALBs should be in different regions', () => {
      // Extract region from ALB DNS: mrha-synthtrainr861-p-alb-1454636751.us-west-2.elb.amazonaws.com
      const primaryRegion = deploymentOutputs.primary_alb_dns?.split('.')[1];
      const secondaryRegion = deploymentOutputs.secondary_alb_dns?.split('.')[1];
      
      expect(primaryRegion).toBeDefined();
      expect(secondaryRegion).toBeDefined();
      expect(primaryRegion).not.toBe(secondaryRegion);
    });

    test('should have resources in us-west-2 and us-east-1', () => {
      const primaryAlb = deploymentOutputs.primary_alb_dns || '';
      const secondaryAlb = deploymentOutputs.secondary_alb_dns || '';
      
      expect(primaryAlb).toContain('us-west-2');
      expect(secondaryAlb).toContain('us-east-1');
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multiple Route53 name servers for redundancy', () => {
      // Parse JSON string to get array of name servers
      const nameServersRaw = deploymentOutputs.route53_name_servers || '[]';
      const nameServers = JSON.parse(nameServersRaw);
      expect(nameServers.length).toBeGreaterThanOrEqual(4);
      
      // Check that name servers are from different TLDs for redundancy
      const tlds = nameServers.map((ns: string) => ns.split('.').pop());
      const uniqueTlds = [...new Set(tlds)];
      expect(uniqueTlds.length).toBeGreaterThanOrEqual(3);
    });

    test('should have proper application URL configured', () => {
      expect(deploymentOutputs.application_url).toBeDefined();
      expect(deploymentOutputs.application_url).toMatch(/^http:\/\//);
      expect(deploymentOutputs.application_url).toContain('.internal.local');
    });
  });

  describe('Disaster Recovery Components', () => {
    test('should have ARC routing controls for both regions', () => {
      expect(deploymentOutputs.primary_routing_control_arn).toBeDefined();
      expect(deploymentOutputs.secondary_routing_control_arn).toBeDefined();
      
      // Both should be part of the same control panel
      const primaryPanel = deploymentOutputs.primary_routing_control_arn?.split('/')[1];
      const secondaryPanel = deploymentOutputs.secondary_routing_control_arn?.split('/')[1];
      expect(primaryPanel).toBe(secondaryPanel);
    });

    test('should have ARC cluster configured', () => {
      expect(deploymentOutputs.arc_cluster_arn).toBeDefined();
      expect(deploymentOutputs.arc_cluster_arn).toMatch(/cluster\/[a-f0-9-]+$/);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS topics in both regions', () => {
      const primaryTopic = deploymentOutputs.sns_topic_arn_primary || '';
      const secondaryTopic = deploymentOutputs.sns_topic_arn_secondary || '';
      
      expect(primaryTopic).toContain('us-west-2');
      expect(secondaryTopic).toContain('us-east-1');
      
      // Both should have the same topic name pattern
      expect(primaryTopic).toContain('-alerts');
      expect(secondaryTopic).toContain('-alerts');
    });
  });

  describe('Infrastructure Connectivity Tests', () => {
    test('ALB endpoints should have valid DNS format', async () => {
      const primaryDns = deploymentOutputs.primary_alb_dns;
      const secondaryDns = deploymentOutputs.secondary_alb_dns;
      
      if (primaryDns) {
        // Check DNS format
        const dnsPattern = /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/;
        expect(primaryDns).toMatch(dnsPattern);
      }
      
      if (secondaryDns) {
        const dnsPattern = /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/;
        expect(secondaryDns).toMatch(dnsPattern);
      }
    });

    test('should have consistent resource naming', () => {
      const primaryAlb = deploymentOutputs.primary_alb_dns || '';
      const secondaryAlb = deploymentOutputs.secondary_alb_dns || '';
      
      // Extract resource prefix from ALB names
      const primaryPrefix = primaryAlb.split('-')[0] + '-' + primaryAlb.split('-')[1];
      const secondaryPrefix = secondaryAlb.split('-')[0] + '-' + secondaryAlb.split('-')[1];
      
      // Both should have the same prefix
      expect(primaryPrefix).toBe(secondaryPrefix);
    });
  });

  describe('Resource Tagging and Organization', () => {
    test('should have environment suffix in resource names', () => {
      const primaryAlb = deploymentOutputs.primary_alb_dns || '';
      const zone = deploymentOutputs.route53_zone_name || '';
      
      // Check that resources contain the environment suffix pattern
      expect(primaryAlb).toMatch(/synthtrainr861/);
      expect(zone).toMatch(/synthtrainr861/);
    });

    test('should have consistent resource prefix across outputs', () => {
      const outputs = Object.values(deploymentOutputs).filter(v => typeof v === 'string');
      const mrhaResources = outputs.filter((output: any) => 
        output.includes('mrha-synthtrainr861')
      );
      
      // Most string outputs should contain our resource prefix
      expect(mrhaResources.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Region Failover Readiness', () => {
    test('should have failover components properly configured', () => {
      // Check that we have all necessary components for failover
      const requiredComponents = [
        'primary_alb_dns',
        'secondary_alb_dns',
        'primary_routing_control_arn',
        'secondary_routing_control_arn',
        'arc_control_panel_arn',
        'route53_zone_name'
      ];
      
      requiredComponents.forEach(component => {
        expect(deploymentOutputs[component]).toBeDefined();
      });
    });

    test('routing controls should be associated with the same control panel', () => {
      const primaryControl = deploymentOutputs.primary_routing_control_arn || '';
      const secondaryControl = deploymentOutputs.secondary_routing_control_arn || '';
      const controlPanel = deploymentOutputs.arc_control_panel_arn || '';
      
      // Extract control panel ID from ARN
      const panelId = controlPanel.split('/').pop();
      
      // Both routing controls should reference the same panel
      expect(primaryControl).toContain(panelId);
      expect(secondaryControl).toContain(panelId);
    });
  });

  describe('DNS and Route53 Configuration', () => {
    test('should have valid Route53 hosted zone', () => {
      const zoneName = deploymentOutputs.route53_zone_name;
      expect(zoneName).toBeDefined();
      
      // Should be a valid domain name
      const domainPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;
      expect(zoneName).toMatch(domainPattern);
    });

    test('should have diverse name servers', () => {
      // Parse JSON string to get array of name servers
      const nameServersRaw = deploymentOutputs.route53_name_servers || '[]';
      const nameServers = JSON.parse(nameServersRaw);
      
      // Should have at least 4 name servers
      expect(nameServers.length).toBeGreaterThanOrEqual(4);
      
      // Each should be a valid AWS name server
      nameServers.forEach((ns: string) => {
        expect(ns.trim()).toMatch(/^ns-\d+\.awsdns-\d+\.(org|com|net|co\.uk)$/);
      });
    });
  });

  describe('Security and Compliance', () => {
    test('should use internal domain for private infrastructure', () => {
      const zoneName = deploymentOutputs.route53_zone_name || '';
      const appUrl = deploymentOutputs.application_url || '';
      
      // Should use .internal.local for private zones
      expect(zoneName).toContain('.internal.local');
      expect(appUrl).toContain('.internal.local');
    });

    test('ARNs should belong to the same AWS account', () => {
      const arns = Object.values(deploymentOutputs)
        .filter((v: any) => typeof v === 'string' && v.startsWith('arn:aws:'));
      
      const accountIds = arns.map((arn: any) => {
        const parts = arn.split(':');
        return parts[4]; // Account ID is the 5th part
      });
      
      // All ARNs should belong to the same account
      const uniqueAccounts = [...new Set(accountIds)];
      expect(uniqueAccounts.length).toBe(1);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('ALBs should have proper naming convention', () => {
      const primaryAlb = deploymentOutputs.primary_alb_dns || '';
      const secondaryAlb = deploymentOutputs.secondary_alb_dns || '';
      
      // Check for abbreviated naming (p for primary, s for secondary)
      expect(primaryAlb).toMatch(/mrha-synthtrainr861-p-alb/);
      expect(secondaryAlb).toMatch(/mrha-synthtrainr861-s-alb/);
    });

    test('ALBs should be internet-facing', () => {
      // ELB DNS names for internet-facing load balancers follow this pattern
      const primaryAlb = deploymentOutputs.primary_alb_dns || '';
      const secondaryAlb = deploymentOutputs.secondary_alb_dns || '';
      
      // Should not contain 'internal' in the DNS name
      expect(primaryAlb).not.toContain('internal');
      expect(secondaryAlb).not.toContain('internal');
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('should have complete multi-region setup', () => {
      // Verify we have all components for a complete multi-region setup
      const essentialOutputs = [
        'primary_alb_dns',
        'secondary_alb_dns',
        'route53_zone_name',
        'arc_cluster_arn',
        'sns_topic_arn_primary',
        'sns_topic_arn_secondary'
      ];
      
      const missingOutputs = essentialOutputs.filter(
        output => !deploymentOutputs[output]
      );
      
      expect(missingOutputs).toEqual([]);
    });

    test('should have consistent regional distribution', () => {
      // Primary resources in us-west-2
      const primaryResources = Object.entries(deploymentOutputs)
        .filter(([key, value]: [string, any]) => 
          key.includes('primary') && typeof value === 'string'
        );
      
      // Secondary resources in us-east-1
      const secondaryResources = Object.entries(deploymentOutputs)
        .filter(([key, value]: [string, any]) => 
          key.includes('secondary') && typeof value === 'string'
        );
      
      // Should have resources in both regions
      expect(primaryResources.length).toBeGreaterThan(0);
      expect(secondaryResources.length).toBeGreaterThan(0);
    });
  });
});