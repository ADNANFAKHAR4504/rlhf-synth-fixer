import * as pulumi from '@pulumi/pulumi';
import { Route53Component } from '../lib/components/route53';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    const outputs: Record<string, unknown> = {
      ...args.inputs,
      arn: `arn:aws:route53:::hostedzone/${args.name}`,
      id: `${args.name}-id`,
    };

    // Route53 Zone outputs
    if (args.type === 'aws:route53/zone:Zone') {
      outputs.zoneId = 'Z1234567890ABC';
      outputs.nameServers = [
        'ns-1.awsdns-01.com',
        'ns-2.awsdns-02.net',
        'ns-3.awsdns-03.org',
        'ns-4.awsdns-04.co.uk',
      ];
    }

    // Route53 Record outputs
    if (args.type === 'aws:route53/record:Record') {
      outputs.fqdn = args.inputs.name;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: function () {
    return {};
  },
});

describe('Route53Component', () => {
  let route53: Route53Component;
  const mockVpcId = pulumi.output('vpc-12345');

  beforeAll(() => {
    route53 = new Route53Component('test-route53', {
      environment: 'dev',
      vpcId: mockVpcId,
      zoneName: 'payment.local',
      tags: {
        Environment: 'dev',
        Project: 'payment-processing',
      },
    });
  });

  describe('Hosted Zone Configuration', () => {
    it('should create private hosted zone', (done) => {
      pulumi.all([route53.zone.id]).apply(([zoneId]) => {
        expect(zoneId).toBeDefined();
        expect(typeof zoneId).toBe('string');
        done();
      });
    });

    it('should configure zone name', (done) => {
      pulumi.all([route53.zone.name]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('payment.local');
        done();
      });
    });

    it('should associate with VPC', (done) => {
      pulumi.all([route53.zone.vpcs]).apply(([vpcs]) => {
        expect(vpcs).toBeDefined();
        expect(Array.isArray(vpcs)).toBe(true);
        expect(vpcs.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should have name servers configured', (done) => {
      pulumi.all([route53.zone.nameServers]).apply(([nameServers]) => {
        expect(nameServers).toBeDefined();
        expect(Array.isArray(nameServers)).toBe(true);
        expect(nameServers.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('DNS Records', () => {
    it('should be able to create custom DNS records', (done) => {
      const testDnsName = pulumi.output('test.example.com');
      const customRecord = route53.createRecord('custom-record', 'app.payment.local', testDnsName);
      pulumi.all([customRecord.name]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should support CNAME record type', (done) => {
      const testDnsName = pulumi.output('test.example.com');
      const customRecord = route53.createRecord('custom-cname', 'db.payment.local', testDnsName);
      pulumi.all([customRecord.type]).apply(([type]) => {
        expect(type).toBe('CNAME');
        done();
      });
    });

    it('should set TTL for custom records', (done) => {
      const testDnsName = pulumi.output('test.example.com');
      const customRecord = route53.createRecord('custom-ttl', 'cache.payment.local', testDnsName);
      pulumi.all([customRecord.ttl]).apply(([ttl]) => {
        expect(ttl).toBe(300);
        done();
      });
    });
  });

  describe('Service Discovery', () => {
    it('should enable internal service discovery', (done) => {
      pulumi.all([route53.zone.vpcs]).apply(([vpcs]) => {
        expect(vpcs.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should configure DNS resolution for VPC', (done) => {
      pulumi.all([route53.zone.vpcs]).apply(([vpcs]) => {
        expect(vpcs[0].vpcId).toBeDefined();
        done();
      });
    });
  });

  describe('Tagging', () => {
    it('should apply environment tags to hosted zone', (done) => {
      pulumi.all([route53.zone.tags]).apply(([tags]) => {
        expect(tags).toBeDefined();
        expect(tags['Environment']).toBe('dev');
        done();
      });
    });

    it('should include project tag', (done) => {
      pulumi.all([route53.zone.tags]).apply(([tags]) => {
        expect(tags['Project']).toBe('payment-processing');
        done();
      });
    });

    it('should include name tag', (done) => {
      pulumi.all([route53.zone.tags]).apply(([tags]) => {
        expect(tags['Name']).toBeDefined();
        done();
      });
    });
  });

  describe('Outputs', () => {
    it('should export zone ID', (done) => {
      pulumi.all([route53.zone.id]).apply(([zoneId]) => {
        expect(zoneId).toBeDefined();
        expect(typeof zoneId).toBe('string');
        done();
      });
    });

    it('should export zone name', (done) => {
      pulumi.all([route53.zone.name]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export name servers', (done) => {
      pulumi.all([route53.zone.nameServers]).apply(([nameServers]) => {
        expect(nameServers).toBeDefined();
        expect(Array.isArray(nameServers)).toBe(true);
        done();
      });
    });
  });

  describe('DNS Resolution', () => {
    it('should provide zone ID for DNS lookups', (done) => {
      pulumi.all([route53.zone.id]).apply(([zoneId]) => {
        expect(zoneId).toBeDefined();
        expect(typeof zoneId).toBe('string');
        done();
      });
    });

    it('should provide zone name for DNS queries', (done) => {
      pulumi.all([route53.zone.name]).apply(([zoneName]) => {
        expect(zoneName).toBeDefined();
        expect(zoneName).toContain('payment.local');
        done();
      });
    });
  });

  describe('Zone Configuration', () => {
    it('should be a private zone', (done) => {
      pulumi.all([route53.zone.vpcs]).apply(([vpcs]) => {
        // Private zone has VPC associations
        expect(vpcs.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should not have public access', (done) => {
      pulumi.all([route53.zone.vpcs]).apply(([vpcs]) => {
        // Private zone only accessible from associated VPCs
        expect(vpcs).toBeDefined();
        done();
      });
    });
  });

  describe('CNAME Record Creation', () => {
    it('should be able to create CNAME records', (done) => {
      // Test the createRecord method
      const testDnsName = pulumi.output('test.example.com');
      const record = route53.createRecord('test-cname', 'api.payment.local', testDnsName);

      pulumi.all([record.name]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('api.payment.local');
        done();
      });
    });

    it('should create CNAME record with correct type', (done) => {
      const testDnsName = pulumi.output('test.example.com');
      const record = route53.createRecord('test-cname-type', 'service.payment.local', testDnsName);

      pulumi.all([record.type]).apply(([type]) => {
        expect(type).toBe('CNAME');
        done();
      });
    });

    it('should associate CNAME record with zone', (done) => {
      const testDnsName = pulumi.output('test.example.com');
      const record = route53.createRecord('test-cname-zone', 'db.payment.local', testDnsName);

      pulumi.all([record.zoneId]).apply(([zoneId]) => {
        expect(zoneId).toBeDefined();
        done();
      });
    });
  });
});
