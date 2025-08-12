// lib/security.ts
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { name } from './utils/naming';

export interface SecurityProps {
  provider: AwsProvider;
  environment: string;
  region: string;
  vpcId: string;

  openAlbHttp?: boolean; // default true
  openAlbHttps?: boolean; // default true
  adminCidr?: string; // e.g., "203.0.113.0/24"
  appPort?: number; // default 80
  enableSshToApp?: boolean; // default false
}

export class Security extends Construct {
  public readonly albSgId: string;
  public readonly appSgId: string;
  public readonly rdsSgId: string;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    const env = props.environment;
    const region = props.region;
    const appPort = props.appPort ?? 80;
    const openAlbHttp = props.openAlbHttp ?? true;
    const openAlbHttps = props.openAlbHttps ?? true;
    const enableSshToApp = props.enableSshToApp ?? false;

    // ALB SG
    const albSg = new SecurityGroup(this, 'alb-sg', {
      name: name(env, 'alb-sg', region),
      description: 'Security group for Application Load Balancer',
      vpcId: props.vpcId,
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      ingress: [
        ...(openAlbHttp
          ? [
              {
                fromPort: 80,
                toPort: 80,
                protocol: 'tcp',
                cidrBlocks: ['0.0.0.0/0'],
              },
            ]
          : []),
        ...(openAlbHttps
          ? [
              {
                fromPort: 443,
                toPort: 443,
                protocol: 'tcp',
                cidrBlocks: ['0.0.0.0/0'],
              },
            ]
          : []),
      ] as any[],
      provider: props.provider,
      tags: { Name: name(env, 'alb-sg', region) },
    });

    // App SG ingress (allow from ALB SG on app port; optional SSH from admin CIDR)
    const appIngress: any[] = [
      {
        fromPort: appPort,
        toPort: appPort,
        protocol: 'tcp',
        securityGroups: [albSg.id],
      },
    ];

    if (enableSshToApp) {
      const adminCidr = props.adminCidr || process.env.ADMIN_CIDR || '';
      if (adminCidr.trim().length > 0) {
        appIngress.push({
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [adminCidr],
        });
      }
    }

    const appSg = new SecurityGroup(this, 'app-sg', {
      name: name(env, 'app-sg', region),
      description: 'Security group for application instances',
      vpcId: props.vpcId,
      ingress: appIngress,
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      provider: props.provider,
      tags: { Name: name(env, 'app-sg', region) },
    });

    // RDS SG (only from app SG on 5432)
    const rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: name(env, 'rds-sg', region),
      description: 'Security group for RDS Postgres',
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [appSg.id],
        },
      ] as any[],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      provider: props.provider,
      tags: { Name: name(env, 'rds-sg', region) },
    });

    this.albSgId = albSg.id;
    this.appSgId = appSg.id;
    this.rdsSgId = rdsSg.id;

    new TerraformOutput(this, 'alb_sg_id', { value: this.albSgId });
    new TerraformOutput(this, 'app_sg_id', { value: this.appSgId });
    new TerraformOutput(this, 'rds_sg_id', { value: this.rdsSgId });
  }
}
