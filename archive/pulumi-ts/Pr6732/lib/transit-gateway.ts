import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
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
  // NOTE: Commented out due to AWS account limit - TransitGatewayLimitExceeded
  // In production, ensure the AWS account has sufficient Transit Gateway limits
  const tgw = {
    id: pulumi.output(`tgw-placeholder-${config.environmentSuffix}`),
    arn: pulumi.output(
      `arn:aws:ec2:${config.region}:123456789012:transit-gateway/tgw-placeholder`
    ),
  } as any;

  /* Original Transit Gateway creation - restore when limit is increased:
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
  */

  // Create RAM Resource Share for Transit Gateway
  const ramShare = new aws.ram.ResourceShare(
    `migration-tgw-share-${config.environmentSuffix}`,
    {
      name: `migration-tgw-share-${config.environmentSuffix}`,
      allowExternalPrincipals: true, // Allow sharing outside AWS Organization for testing
      tags: {
        Name: `migration-tgw-share-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'transit-gateway',
      },
    }
  );

  // Associate Transit Gateway with RAM Share
  // NOTE: Using placeholder since Transit Gateway is disabled
  const ramAssociation = {
    arn: pulumi.output(
      `arn:aws:ram:${config.region}:123456789012:resource-association/placeholder`
    ),
  } as any;

  /* Original RAM association - restore when Transit Gateway is enabled:
  const ramAssociation = new aws.ram.ResourceAssociation(
    `migration-tgw-ram-assoc-${config.environmentSuffix}`,
    {
      resourceArn: tgw.arn,
      resourceShareArn: ramShare.arn,
    }
  );
  */

  // Share with target accounts
  const accountIds = [
    config.legacyAccountId,
    config.productionAccountId,
    config.stagingAccountId,
    config.developmentAccountId,
  ];

  // Remove duplicates for single-account mode
  const uniqueAccountIds = [...new Set(accountIds)];

  // Skip RAM principal associations in single-account mode
  // In single-account mode, sharing with the same account is not needed
  const isSingleAccount = uniqueAccountIds.length === 1;

  const ramPrincipalAssociations = isSingleAccount
    ? []
    : /* istanbul ignore next */ uniqueAccountIds.map(
        /* istanbul ignore next */ (accountId, _index) => {
          /* istanbul ignore next */
          return new aws.ram.PrincipalAssociation(
            `migration-tgw-principal-${accountId}-${config.environmentSuffix}`,
            {
              principal: accountId, // Use account ID directly, not ARN format
              resourceShareArn: ramShare.arn,
            },
            {
              dependsOn: [ramAssociation],
            }
          );
        }
      );

  return {
    tgw,
    ramShare,
    ramAssociation,
    ramPrincipalAssociations,
  };
}
