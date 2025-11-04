import * as pulumi from '@pulumi/pulumi';
import { DnsStack } from '../lib/dns-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('DnsStack', () => {
  const albDnsName = pulumi.output('test-alb-123456.ap-northeast-2.elb.amazonaws.com');
  const albZoneId = pulumi.output('Z1234567890ABC');

  it('should create hosted zone and DNS record when domain provided', () => {
    const dnsStack = new DnsStack('test-dns', {
      environmentSuffix: 'test',
      domainName: 'example.com',
      albDnsName,
      albZoneId,
      tags: { Environment: 'test' },
    });

    expect(dnsStack.hostedZoneId).toBeDefined();
    expect(dnsStack.nameServers).toBeDefined();
  });

  it('should handle missing domain name', () => {
    const dnsStack = new DnsStack('test-dns-2', {
      environmentSuffix: 'test',
      albDnsName,
      albZoneId,
      tags: { Environment: 'test' },
    });

    // Should still work even without domain name
    expect(dnsStack).toBeDefined();
  });
});
