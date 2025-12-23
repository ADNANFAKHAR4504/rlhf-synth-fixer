/**
 * security.ts
 *
 * This module defines security-related resources including security groups
 * for the secure AWS infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createSecurityGroup(
  environment: string,
  vpcId: pulumi.Output<string>,
  allowedSshCidrs: string[],
  provider: aws.Provider
): aws.ec2.SecurityGroup {
  // Validate CIDR blocks
  const validatedCidrs = allowedSshCidrs.map(cidr => {
    if (!cidr.includes('/')) {
      throw new Error(
        `Invalid CIDR block: ${cidr}. Must include subnet mask (e.g., /32 for single IP)`
      );
    }
    return cidr;
  });

  const securityGroup = new aws.ec2.SecurityGroup(
    `sg-ssh-${environment}`,
    {
      name: `ssh-access-${environment}`,
      description: `Security group for SSH access - ${environment}`,
      vpcId: vpcId,

      // SSH ingress rules for trusted CIDR blocks only
      ingress: validatedCidrs.map(cidr => ({
        description: `SSH access from ${cidr}`,
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: [cidr],
      })),

      // Least privilege egress rules - only what's needed for updates and SSM
      egress: [
        {
          description: 'HTTPS for package updates and SSM communication',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Required for AWS services and package repos
        },
        {
          description: 'HTTP for package repositories (Amazon Linux repos)',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Required for yum/dnf package updates
        },
        {
          description: 'DNS resolution',
          fromPort: 53,
          toPort: 53,
          protocol: 'udp',
          cidrBlocks: ['0.0.0.0/0'], // Required for DNS resolution
        },
        {
          description: 'NTP for time synchronization',
          fromPort: 123,
          toPort: 123,
          protocol: 'udp',
          cidrBlocks: ['0.0.0.0/0'], // Required for time sync
        },
      ],

      tags: {
        Name: `ssh-access-${environment}`,
        Environment: environment,
        Purpose: 'SSH-Access',
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  return securityGroup;
}
