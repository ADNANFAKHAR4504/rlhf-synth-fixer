import { Testing } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Unified Multi-Environment Stack - Comprehensive Unit Tests', () => {
  const testEnvironments: TapStackConfig[] = [
    {
      environment: 'dev',
      vpcCidr: '10.10.0.0/16',
      instanceType: 't3.micro',
      dbInstanceClass: 'db.t3.micro',
      tags: {},
    },
    {
      environment: 'prod',
      vpcCidr: '10.30.0.0/16',
      instanceType: 't3.medium',
      dbInstanceClass: 'db.t3.medium',
      tags: {},
    },
  ];

  const synthesized = Testing.synth(
    new TapStack(Testing.app(), 'test-stack', {
      environments: testEnvironments,
    })
  );
  const resources = JSON.parse(synthesized).resource || {};
  const data = JSON.parse(synthesized).data || {};

  it('should create one VPC per environment with correct properties', () => {
    const vpcs = Object.values(resources.aws_vpc) as any[];
    expect(vpcs).toHaveLength(2);
    const prodVpc = vpcs.find(v => v.tags.Name === 'vpc-prod');
    expect(prodVpc.cidr_block).toBe('10.30.0.0/16');
    expect(prodVpc.enable_dns_hostnames).toBe(true);
  });

  it('should create an encrypted RDS instance for each environment with correct settings', () => {
    const dbInstances = Object.values(resources.aws_db_instance) as any[];
    expect(dbInstances).toHaveLength(2);

    const devDb = dbInstances.find(db => db.identifier.startsWith('appdb-dev'));
    expect(devDb).toBeDefined();
    expect(devDb.instance_class).toBe('db.t3.micro');
    expect(devDb.storage_encrypted).toBe(true);
    expect(devDb.backup_retention_period).toBe(7);
    expect(devDb.skip_final_snapshot).toBe(true);
  });

  it('should create a Launch Template for each environment with correct instance type and AMI', () => {
    const launchTemplates = Object.values(
      resources.aws_launch_template
    ) as any[];
    // FIX: Correctly access the data source from the 'data' block in the synthesized JSON.
    const amis = data.aws_ami ? Object.values(data.aws_ami) : [];
    expect(launchTemplates).toHaveLength(2);
    expect(amis).toHaveLength(1); // Only one data source for AMI

    const prodLt = launchTemplates.find(lt => lt.name.startsWith('lt-prod'));
    expect(prodLt).toBeDefined();
    expect(prodLt.instance_type).toBe('t3.medium');
    // Check that it's wired to the AMI data source
    expect(prodLt.image_id).toMatch(/\${data.aws_ami.AmazonLinuxAmi.id}/);
  });

  it('should create an IAM Role and Policy for each environment with correct permissions', () => {
    const roles = Object.values(resources.aws_iam_role) as any[];
    const policies = Object.values(resources.aws_iam_policy) as any[];
    expect(roles).toHaveLength(2);
    expect(policies).toHaveLength(2);

    const devRole = roles.find(r => r.name.startsWith('web-server-role-dev'));
    const devPolicy = policies.find(p =>
      p.name.startsWith('web-server-policy-dev')
    );

    expect(devRole).toBeDefined();
    expect(devPolicy).toBeDefined();

    const assumeRolePolicy = JSON.parse(devRole.assume_role_policy);
    expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
      'ec2.amazonaws.com'
    );

    const policyDocument = JSON.parse(devPolicy.policy);
    expect(policyDocument.Statement[0].Action).toEqual(
      expect.arrayContaining(['s3:GetObject', 'logs:PutLogEvents'])
    );
  });

  it('should correctly configure Security Group dependencies for the prod environment', () => {
    const securityGroups = Object.values(resources.aws_security_group) as any[];
    const prodAlbSg = securityGroups.find(sg =>
      sg.name.startsWith('alb-sg-prod')
    );
    const prodWebSg = securityGroups.find(sg =>
      sg.name.startsWith('web-sg-prod')
    );
    const prodDbSg = securityGroups.find(sg =>
      sg.name.startsWith('db-sg-prod')
    );

    expect(prodAlbSg).toBeDefined();
    expect(prodWebSg).toBeDefined();
    expect(prodDbSg).toBeDefined();

    expect(prodWebSg.ingress[0].security_groups[0]).toMatch(
      /\${aws_security_group.AlbSg-prod.*.id}/
    );
    expect(prodDbSg.ingress[0].security_groups[0]).toMatch(
      /\${aws_security_group.WebSg-prod.*.id}/
    );
  });
});
