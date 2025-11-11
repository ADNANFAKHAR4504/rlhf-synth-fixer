/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import { Construct } from 'constructs';
import { OrganizationsPolicy } from '@cdktf/provider-aws/lib/organizations-policy';

interface ScpModuleProps {
  environmentSuffix: string;
}

export class ScpModule extends Construct {
  public readonly securityPolicy: OrganizationsPolicy;

  constructor(scope: Construct, id: string, props: ScpModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create SCP to enforce security requirements
    this.securityPolicy = new OrganizationsPolicy(this, 'security-scp', {
      name: `payment-security-scp-${environmentSuffix}`,
      description:
        'Prevents deletion of security resources and requires encryption',
      type: 'SERVICE_CONTROL_POLICY',
      content: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PreventSecurityResourceDeletion',
            Effect: 'Deny',
            Action: [
              'kms:ScheduleKeyDeletion',
              'kms:DeleteAlias',
              'logs:DeleteLogGroup',
              'config:DeleteConfigRule',
              'config:DeleteConfigurationRecorder',
              'config:DeleteDeliveryChannel',
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'aws:RequestedRegion': 'ap-southeast-1',
              },
            },
          },
          {
            Sid: 'RequireS3Encryption',
            Effect: 'Deny',
            Action: 's3:PutObject',
            Resource: '*',
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': ['aws:kms', 'AES256'],
              },
            },
          },
          {
            Sid: 'RequireSecureTransport',
            Effect: 'Deny',
            Action: 's3:*',
            Resource: '*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'PreventDisableSecurityLogging',
            Effect: 'Deny',
            Action: [
              'logs:DeleteLogGroup',
              'logs:DeleteLogStream',
              'cloudtrail:StopLogging',
              'cloudtrail:DeleteTrail',
              'config:StopConfigurationRecorder',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `security-scp-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });
  }
}
