import * as aws from '@pulumi/aws';
import { MigrationConfig } from './config';
import { IamRoles } from './iam-roles';

export interface TransitGatewayResources {
  tgw: aws.ec2transitgateway.TransitGateway;
  ramShare: aws.ram.ResourceShare;
  ramAssociation: aws.ram.ResourceAssociation;
  ramPrincipalAssociations: aws.ram.PrincipalAssociation[];
}

export function createTransitGateway(
  config: MigrationConfig,
  _iamRoles: IamRoles
): TransitGatewayResources {
  // Create Transit Gateway
  const tgw = new aws.ec2transitgateway.TransitGateway(
    `migration-tgw-${config.environmentSuffix}`,
    {
      description: `Migration Transit Gateway - ${config.environmentSuffix}`,
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      tags: {
        Name: `migration-tgw-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'transit-gateway',
      },
    }
  );

  // Create RAM Resource Share for Transit Gateway
  const ramShare = new aws.ram.ResourceShare(
    `migration-tgw-share-${config.environmentSuffix}`,
    {
      name: `migration-tgw-share-${config.environmentSuffix}`,
      allowExternalPrincipals: false,
      tags: {
        Name: `migration-tgw-share-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'transit-gateway',
      },
    }
  );

  // Associate Transit Gateway with RAM Share
  const ramAssociation = new aws.ram.ResourceAssociation(
    `migration-tgw-ram-assoc-${config.environmentSuffix}`,
    {
      resourceArn: tgw.arn,
      resourceShareArn: ramShare.arn,
    }
  );

  // Share with target accounts
  const accountIds = [
    config.legacyAccountId,
    config.productionAccountId,
    config.stagingAccountId,
    config.developmentAccountId,
  ];

  // Remove duplicates for single-account mode
  const uniqueAccountIds = [...new Set(accountIds)];

  const ramPrincipalAssociations = uniqueAccountIds.map((accountId, _index) => {
    return new aws.ram.PrincipalAssociation(
      `migration-tgw-principal-${accountId}-${config.environmentSuffix}`,
      {
        principal: `arn:aws:iam::${accountId}:root`,
        resourceShareArn: ramShare.arn,
      },
      {
        dependsOn: [ramAssociation],
      }
    );
  });

  return {
    tgw,
    ramShare,
    ramAssociation,
    ramPrincipalAssociations,
  };
}
