import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AcmCertificateArgs {
  domainName: string;
  subjectAlternativeNames?: string[];
  validationMethod?: 'DNS' | 'EMAIL';
  tags?: Record<string, string>;
  skipValidation?: boolean;
}

export interface AcmCertificateResult {
  certificate: aws.acm.Certificate;
  certificateArn: pulumi.Output<string>;
  domainName: pulumi.Output<string>;
}

export interface AcmCertificateValidationArgs {
  certificateArn: pulumi.Input<string>;
  validationRecordFqdns: pulumi.Input<string>[];
  timeoutSeconds?: number;
}

export interface DnsValidatedCertificateArgs {
  domainName: string;
  subjectAlternativeNames?: string[];
  hostedZoneId: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface DnsValidatedCertificateResult {
  certificate: aws.acm.Certificate;
  certificateArn: pulumi.Output<string>;
  domainName: pulumi.Output<string>;
  certificateValidation: aws.acm.CertificateValidation;
  validationRecords: aws.route53.Record[];
}

export class AcmCertificateComponent extends pulumi.ComponentResource {
  public readonly certificate: aws.acm.Certificate;
  public readonly certificateArn: pulumi.Output<string>;
  public readonly domainName: pulumi.Output<string>;

  constructor(
    name: string,
    args: AcmCertificateArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:acm:AcmCertificateComponent', name, {}, opts);

    const defaultTags = {
      Name: args.domainName,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Create certificate without validation for demo purposes
    this.certificate = new aws.acm.Certificate(
      `${name}-certificate`,
      {
        domainName: args.domainName,
        subjectAlternativeNames: args.subjectAlternativeNames,
        validationMethod: args.validationMethod || 'DNS',
        tags: defaultTags,
      },
      {
        parent: this,
        provider: opts?.provider,
        // Don't wait for validation to complete
        ignoreChanges: ['validationMethod'],
      }
    );

    this.certificateArn = this.certificate.arn;
    this.domainName = this.certificate.domainName;

    this.registerOutputs({
      certificate: this.certificate,
      certificateArn: this.certificateArn,
      domainName: this.domainName,
    });
  }
}

export class AcmCertificateValidationComponent
  extends pulumi.ComponentResource
{
  public readonly certificateValidation: aws.acm.CertificateValidation;

  constructor(
    name: string,
    args: AcmCertificateValidationArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:acm:AcmCertificateValidationComponent', name, {}, opts);

    this.certificateValidation = new aws.acm.CertificateValidation(
      `${name}-validation`,
      {
        certificateArn: args.certificateArn,
        validationRecordFqdns: args.validationRecordFqdns,
      },
      {
        parent: this,
        provider: opts?.provider,
        customTimeouts: {
          create: args.timeoutSeconds ? `${args.timeoutSeconds}s` : '15m',
          delete: '5m',
        },
      }
    );

    this.registerOutputs({
      certificateValidation: this.certificateValidation,
    });
  }
}

export class DnsValidatedCertificateComponent extends pulumi.ComponentResource {
  public readonly certificate: aws.acm.Certificate;
  public readonly certificateArn: pulumi.Output<string>;
  public readonly domainName: pulumi.Output<string>;
  public readonly certificateValidation: aws.acm.CertificateValidation;
  public readonly validationRecords: aws.route53.Record[];

  constructor(
    name: string,
    args: DnsValidatedCertificateArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:acm:DnsValidatedCertificateComponent', name, {}, opts);

    const certificateComponent = new AcmCertificateComponent(
      name,
      {
        domainName: args.domainName,
        subjectAlternativeNames: args.subjectAlternativeNames,
        validationMethod: 'DNS',
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.certificate = certificateComponent.certificate;
    this.certificateArn = certificateComponent.certificateArn;
    this.domainName = certificateComponent.domainName;

    this.validationRecords = [];

    this.certificate.domainValidationOptions.apply(options => {
      options.forEach((option, index) => {
        const validationRecord = new aws.route53.Record(
          `${name}-validation-${index}`,
          {
            name: option.resourceRecordName,
            records: [option.resourceRecordValue],
            ttl: 60,
            type: option.resourceRecordType,
            zoneId: args.hostedZoneId,
            allowOverwrite: true,
          },
          { parent: this, provider: opts?.provider }
        );

        this.validationRecords.push(validationRecord);
      });
    });

    const validationComponent = new AcmCertificateValidationComponent(
      `${name}-validation`,
      {
        certificateArn: this.certificate.arn,
        validationRecordFqdns: this.validationRecords.map(
          record => record.fqdn
        ),
        timeoutSeconds: 900,
      },
      { parent: this, provider: opts?.provider }
    );

    this.certificateValidation = validationComponent.certificateValidation;

    this.registerOutputs({
      certificate: this.certificate,
      certificateArn: this.certificateArn,
      domainName: this.domainName,
      certificateValidation: this.certificateValidation,
      validationRecords: this.validationRecords,
    });
  }
}

export function createAcmCertificate(
  name: string,
  args: AcmCertificateArgs,
  opts?: pulumi.ComponentResourceOptions
): AcmCertificateResult {
  const certificateComponent = new AcmCertificateComponent(name, args, opts);
  return {
    certificate: certificateComponent.certificate,
    certificateArn: certificateComponent.certificateArn,
    domainName: certificateComponent.domainName,
  };
}

export function createAcmCertificateValidation(
  name: string,
  args: AcmCertificateValidationArgs,
  opts?: pulumi.ComponentResourceOptions
): aws.acm.CertificateValidation {
  const validationComponent = new AcmCertificateValidationComponent(
    name,
    args,
    opts
  );
  return validationComponent.certificateValidation;
}

export function createDnsValidatedCertificate(
  name: string,
  args: DnsValidatedCertificateArgs,
  opts?: pulumi.ComponentResourceOptions
): DnsValidatedCertificateResult {
  const dnsValidatedCertificateComponent = new DnsValidatedCertificateComponent(
    name,
    args,
    opts
  );
  return {
    certificate: dnsValidatedCertificateComponent.certificate,
    certificateArn: dnsValidatedCertificateComponent.certificateArn,
    domainName: dnsValidatedCertificateComponent.domainName,
    certificateValidation:
      dnsValidatedCertificateComponent.certificateValidation,
    validationRecords: dnsValidatedCertificateComponent.validationRecords,
  };
}
