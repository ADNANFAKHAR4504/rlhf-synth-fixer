import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PodcastCdnStack } from '../lib/podcast-cdn-stack';
import { PodcastDnsStack } from '../lib/podcast-dns-stack';
import { PodcastStorageStack } from '../lib/podcast-storage-stack';
import { PodcastSubscriberStack } from '../lib/podcast-subscriber-stack';

describe('Step 4: DNS Stack Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: PodcastStorageStack;
  let subscriberStack: PodcastSubscriberStack;
  let cdnStack: PodcastCdnStack;
  let dnsStack: PodcastDnsStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    storageStack = new PodcastStorageStack(stack, 'PodcastStorage', {
      environmentSuffix: 'test'
    });
    subscriberStack = new PodcastSubscriberStack(stack, 'PodcastSubscriber', {
      environmentSuffix: 'test'
    });
    cdnStack = new PodcastCdnStack(stack, 'PodcastCdn', {
      audioBucket: storageStack.audioBucket,
      subscriberTable: subscriberStack.subscriberTable,
      environmentSuffix: 'test'
    });
    dnsStack = new PodcastDnsStack(stack, 'PodcastDns', {
      distribution: cdnStack.distribution,
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  test('Step 4.1: DNS stack is created', () => {
    expect(dnsStack).toBeDefined();
    expect(dnsStack.hostedZone).toBeDefined();
  });

  test('Step 4.2: Route53 hosted zone is created with trailing dot', () => {
    const resources = template.toJSON().Resources;
    const hostedZone = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::Route53::HostedZone'
    ) as any;
    
    expect(hostedZone).toBeDefined();
    expect(hostedZone.Properties.Name).toBe('test.podcast-platform.cloud.');
  });

  test('Step 4.3: Hosted zone has correct comment', () => {
    const resources = template.toJSON().Resources;
    const hostedZone = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::Route53::HostedZone'
    ) as any;
    
    expect(hostedZone.Properties.HostedZoneConfig.Comment).toBe('Hosted zone for podcast platform test');
  });

  test('Step 4.4: A record is created for CloudFront', () => {
    const resources = template.toJSON().Resources;
    const aRecord = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
    ) as any;
    
    expect(aRecord).toBeDefined();
    expect(aRecord.Properties.Name).toBe('cdn.test.podcast-platform.cloud.');
  });

  test('Step 4.5: A record has alias target', () => {
    const resources = template.toJSON().Resources;
    const aRecord = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
    ) as any;
    
    expect(aRecord.Properties.AliasTarget).toBeDefined();
    expect(aRecord.Properties.AliasTarget.DNSName).toBeDefined();
  });

  test('Step 4.6: AAAA record is created for IPv6', () => {
    const resources = template.toJSON().Resources;
    const aaaaRecord = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
    ) as any;
    
    expect(aaaaRecord).toBeDefined();
    expect(aaaaRecord.Properties.Name).toBe('cdn.test.podcast-platform.cloud.');
  });

  test('Step 4.7: AAAA record has alias target', () => {
    const resources = template.toJSON().Resources;
    const aaaaRecord = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
    ) as any;
    
    expect(aaaaRecord.Properties.AliasTarget).toBeDefined();
    expect(aaaaRecord.Properties.AliasTarget.DNSName).toBeDefined();
  });

  test('Step 4.8: Both records point to same CloudFront distribution', () => {
    const resources = template.toJSON().Resources;
    const aRecord = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
    ) as any;
    const aaaaRecord = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
    ) as any;
    
    expect(aRecord.Properties.AliasTarget.DNSName).toEqual(aaaaRecord.Properties.AliasTarget.DNSName);
  });

  test('Step 4.9: Stack outputs include hosted zone ID', () => {
    const outputs = template.toJSON().Outputs;
    const hostedZoneIdOutput = Object.values(outputs).find(
      (o: any) => o.Description === 'Route 53 hosted zone ID'
    );
    
    expect(hostedZoneIdOutput).toBeDefined();
  });

  test('Step 4.10: Stack outputs include name servers', () => {
    const outputs = template.toJSON().Outputs;
    const nameServersOutput = Object.values(outputs).find(
      (o: any) => o.Description === 'Route 53 name servers'
    );
    
    expect(nameServersOutput).toBeDefined();
  });

  describe('Hosted Zone Configuration', () => {
    test('Step 4.11: Hosted zone name contains environment suffix', () => {
      const resources = template.toJSON().Resources;
      const hostedZone = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::HostedZone'
      ) as any;
      
      expect(hostedZone.Properties.Name).toContain('test');
    });

    test('Step 4.12: Hosted zone name contains podcast-platform', () => {
      const resources = template.toJSON().Resources;
      const hostedZone = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::HostedZone'
      ) as any;
      
      expect(hostedZone.Properties.Name).toContain('podcast-platform');
    });

    test('Step 4.13: Hosted zone is public', () => {
      const resources = template.toJSON().Resources;
      const hostedZone = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::HostedZone'
      ) as any;
      
      // Public hosted zones don't have VPCs property
      expect(hostedZone.Properties.VPCs).toBeUndefined();
    });

    test('Step 4.14: Hosted zone can be referenced', () => {
      expect(dnsStack.hostedZone.hostedZoneId).toBeDefined();
    });

    test('Step 4.15: Hosted zone name can be accessed', () => {
      expect(dnsStack.hostedZone.zoneName).toBeDefined();
      expect(dnsStack.hostedZone.zoneName).toContain('test');
    });
  });

  describe('DNS Records Configuration', () => {
    test('Step 4.16: Exactly 2 record sets are created', () => {
      template.resourceCountIs('AWS::Route53::RecordSet', 2);
    });

    test('Step 4.17: A record references hosted zone', () => {
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;
      
      expect(aRecord.Properties.HostedZoneId).toBeDefined();
    });

    test('Step 4.18: AAAA record references hosted zone', () => {
      const resources = template.toJSON().Resources;
      const aaaaRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
      ) as any;
      
      expect(aaaaRecord.Properties.HostedZoneId).toBeDefined();
    });

    test('Step 4.19: Both records use same hosted zone', () => {
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;
      const aaaaRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
      ) as any;
      
      expect(aRecord.Properties.HostedZoneId).toEqual(aaaaRecord.Properties.HostedZoneId);
    });

    test('Step 4.20: A record has cdn subdomain', () => {
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;
      
      expect(aRecord.Properties.Name).toContain('cdn');
    });

    test('Step 4.21: AAAA record has cdn subdomain', () => {
      const resources = template.toJSON().Resources;
      const aaaaRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
      ) as any;
      
      expect(aaaaRecord.Properties.Name).toContain('cdn');
    });

    test('Step 4.22: Both records have same name', () => {
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;
      const aaaaRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
      ) as any;
      
      expect(aRecord.Properties.Name).toBe(aaaaRecord.Properties.Name);
    });
  });

  describe('Alias Target Configuration', () => {
    test('Step 4.23: A record alias points to CloudFront', () => {
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;
      
      expect(aRecord.Properties.AliasTarget.HostedZoneId).toBeDefined();
    });

    test('Step 4.24: AAAA record alias points to CloudFront', () => {
      const resources = template.toJSON().Resources;
      const aaaaRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
      ) as any;
      
      expect(aaaaRecord.Properties.AliasTarget.HostedZoneId).toBeDefined();
    });

    test('Step 4.25: A record has evaluate target health disabled', () => {
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;
      
      // CloudFront targets typically don't evaluate target health
      expect(aRecord.Properties.AliasTarget.EvaluateTargetHealth).toBeFalsy();
    });

    test('Step 4.26: AAAA record has evaluate target health disabled', () => {
      const resources = template.toJSON().Resources;
      const aaaaRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
      ) as any;
      
      expect(aaaaRecord.Properties.AliasTarget.EvaluateTargetHealth).toBeFalsy();
    });
  });

  describe('Output Configuration', () => {
    test('Step 4.27: Hosted zone ID output has correct value', () => {
      const outputs = template.toJSON().Outputs;
      const hostedZoneIdOutput = Object.values(outputs).find(
        (o: any) => o.Description === 'Route 53 hosted zone ID'
      ) as any;
      
      expect(hostedZoneIdOutput.Value).toBeDefined();
      // The value is a reference to the hosted zone's ID
      expect(typeof hostedZoneIdOutput.Value).toBe('object');
    });

    test('Step 4.28: Name servers output uses Fn::Join', () => {
      const outputs = template.toJSON().Outputs;
      const nameServersOutput = Object.values(outputs).find(
        (o: any) => o.Description === 'Route 53 name servers'
      ) as any;
      
      expect(nameServersOutput.Value).toBeDefined();
      expect(nameServersOutput.Value['Fn::Join']).toBeDefined();
    });

    test('Step 4.29: Name servers output joins with comma and space', () => {
      const outputs = template.toJSON().Outputs;
      const nameServersOutput = Object.values(outputs).find(
        (o: any) => o.Description === 'Route 53 name servers'
      ) as any;
      
      expect(nameServersOutput.Value['Fn::Join'][0]).toBe(', ');
    });

    test('Step 4.30: Exactly 2 outputs are created', () => {
      const outputs = template.toJSON().Outputs;
      const dnsOutputs = Object.values(outputs).filter((o: any) =>
        o.Description.includes('Route 53') || o.Description.includes('hosted zone')
      );
      
      expect(dnsOutputs.length).toBe(2);
    });
  });

  describe('Environment Suffix Integration', () => {
    test('Step 4.31: Stack can be created with different environment suffix', () => {
      const app2 = new cdk.App();
      const stack2 = new cdk.Stack(app2, 'TestStack2');
      const storageStack2 = new PodcastStorageStack(stack2, 'PodcastStorage', {
        environmentSuffix: 'prod'
      });
      const subscriberStack2 = new PodcastSubscriberStack(stack2, 'PodcastSubscriber', {
        environmentSuffix: 'prod'
      });
      const cdnStack2 = new PodcastCdnStack(stack2, 'PodcastCdn', {
        audioBucket: storageStack2.audioBucket,
        subscriberTable: subscriberStack2.subscriberTable,
        environmentSuffix: 'prod'
      });
      const dnsStack2 = new PodcastDnsStack(stack2, 'PodcastDns', {
        distribution: cdnStack2.distribution,
        environmentSuffix: 'prod'
      });
      
      expect(dnsStack2.hostedZone.zoneName).toContain('prod');
    });

    test('Step 4.32: Zone name changes with environment suffix', () => {
      const app2 = new cdk.App();
      const stack2 = new cdk.Stack(app2, 'TestStack2');
      const storageStack2 = new PodcastStorageStack(stack2, 'PodcastStorage', {
        environmentSuffix: 'staging'
      });
      const subscriberStack2 = new PodcastSubscriberStack(stack2, 'PodcastSubscriber', {
        environmentSuffix: 'staging'
      });
      const cdnStack2 = new PodcastCdnStack(stack2, 'PodcastCdn', {
        audioBucket: storageStack2.audioBucket,
        subscriberTable: subscriberStack2.subscriberTable,
        environmentSuffix: 'staging'
      });
      const dnsStack2 = new PodcastDnsStack(stack2, 'PodcastDns', {
        distribution: cdnStack2.distribution,
        environmentSuffix: 'staging'
      });
      const template2 = Template.fromStack(stack2);
      
      const resources = template2.toJSON().Resources;
      const hostedZone = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::HostedZone'
      ) as any;
      
      expect(hostedZone.Properties.Name).toContain('staging');
    });
  });

  describe('Resource Relationships', () => {
    test('Step 4.33: A record depends on hosted zone', () => {
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;
      
      expect(aRecord.Properties.HostedZoneId.Ref).toBeDefined();
    });

    test('Step 4.34: AAAA record depends on hosted zone', () => {
      const resources = template.toJSON().Resources;
      const aaaaRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'AAAA'
      ) as any;
      
      expect(aaaaRecord.Properties.HostedZoneId.Ref).toBeDefined();
    });

    test('Step 4.35: Records reference CloudFront distribution', () => {
      const resources = template.toJSON().Resources;
      const aRecord = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Route53::RecordSet' && r.Properties.Type === 'A'
      ) as any;
      
      expect(aRecord.Properties.AliasTarget.DNSName['Fn::GetAtt']).toBeDefined();
    });

    test('Step 4.36: Stack is a valid construct', () => {
      expect(dnsStack.node).toBeDefined();
      expect(dnsStack.node.id).toBe('PodcastDns');
    });

    test('Step 4.37: Hosted zone is accessible from stack', () => {
      expect(dnsStack.hostedZone).toBeDefined();
      expect(typeof dnsStack.hostedZone).toBe('object');
    });
  });

  describe('Resource Count Validation', () => {
    test('Step 4.38: Exactly 1 hosted zone is created', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
    });

    test('Step 4.39: No additional DNS resources are created', () => {
      const resources = template.toJSON().Resources;
      const dnsResources = Object.values(resources).filter(
        (r: any) => r.Type.startsWith('AWS::Route53::')
      );
      
      expect(dnsResources.length).toBe(3); // 1 hosted zone + 2 record sets
    });

    test('Step 4.40: Stack creates no unexpected resources', () => {
      const resources = template.toJSON().Resources;
      const allResourceTypes = Object.values(resources).map((r: any) => r.Type);
      const uniqueTypes = new Set(allResourceTypes);
      
      // DNS stack should only create Route53 resources (and dependencies from other stacks)
      const route53Resources = Array.from(uniqueTypes).filter(t => 
        t.startsWith('AWS::Route53::')
      );
      
      expect(route53Resources.length).toBe(2); // HostedZone and RecordSet
    });
  });

  describe('Stack Synthesis', () => {
    test('Step 4.41: Stack synthesizes without errors', () => {
      expect(() => template.toJSON()).not.toThrow();
    });

    test('Step 4.42: Template is valid CloudFormation', () => {
      const templateJson = template.toJSON();
      expect(templateJson).toBeDefined();
      expect(templateJson.Resources).toBeDefined();
    });

    test('Step 4.43: All resources have valid properties', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        expect(resource.Type).toBeDefined();
        expect(resource.Properties).toBeDefined();
      });
    });

    test('Step 4.44: DNS configuration is complete', () => {
      expect(dnsStack.hostedZone).toBeDefined();
      const resources = template.toJSON().Resources;
      const recordSets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Route53::RecordSet'
      );
      expect(recordSets.length).toBe(2);
    });

    test('Step 4.45: Stack can be deployed independently', () => {
      // Verify stack has all required dependencies
      expect(dnsStack).toBeDefined();
      expect(dnsStack.hostedZone).toBeDefined();
    });
  });
});

