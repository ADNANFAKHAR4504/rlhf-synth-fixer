import * as cdk from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface CertificateStackProps extends cdk.StackProps {
  environmentSuffix: string;
  domainName: string;
  subDomain: string;
  hostedZone: route53.IHostedZone;
}

export class CertificateStack extends cdk.NestedStack {
  public readonly certificate: certificatemanager.ICertificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const siteDomain = `${props.subDomain}-${props.environmentSuffix}.${props.domainName}`;

    // ACM certificate (must be in us-east-1 for CloudFront)
    this.certificate = new certificatemanager.Certificate(
      this,
      'SiteCertificate',
      {
        domainName: siteDomain,
        certificateName: `portfolio-cert-${props.environmentSuffix}`,
        validation: certificatemanager.CertificateValidation.fromDns(
          props.hostedZone
        ),
      }
    );

    // Output
    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ACM Certificate ARN',
      exportName: `certificate-arn-${props.environmentSuffix}`,
    });
  }
}
