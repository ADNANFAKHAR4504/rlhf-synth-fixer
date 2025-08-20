import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface AcmCertificateArgs {
    domainName: string;
    subjectAlternativeNames?: string[];
    validationMethod?: "DNS" | "EMAIL";
    // Removed certificateTransparencyLoggingPreference as it's not available in current provider
    tags?: Record<string, string>;
}

export interface AcmCertificateResult {
    certificate: aws.acm.Certificate;
    certificateArn: pulumi.Output<string>;
    domainName: pulumi.Output<string>;
    certificateValidation?: aws.acm.CertificateValidation;
    validationRecords?: aws.route53.Record[];
}

export interface AcmCertificateValidationArgs {
    certificateArn: pulumi.Input<string>;
    validationRecordFqdns: pulumi.Input<string>[];
    // Removed timeouts as it's not available in current provider
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

    constructor(name: string, args: AcmCertificateArgs, opts?: pulumi.ComponentResourceOptions) {
        super("aws:acm:AcmCertificateComponent", name, {}, opts);

        const defaultTags = {
            Name: args.domainName,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };

        this.certificate = new aws.acm.Certificate(`${name}-certificate`, {
            domainName: args.domainName,
            subjectAlternativeNames: args.subjectAlternativeNames,
            validationMethod: args.validationMethod || "DNS",
            // Removed certificateTransparencyLoggingPreference and lifecycle
            tags: defaultTags,
        }, { parent: this });

        this.certificateArn = this.certificate.arn;
        this.domainName = this.certificate.domainName;

        this.registerOutputs({
            certificate: this.certificate,
            certificateArn: this.certificateArn,
            domainName: this.domainName,
        });
    }
}

export class AcmCertificateValidationComponent extends pulumi.ComponentResource {
    public readonly certificateValidation: aws.acm.CertificateValidation;

    constructor(name: string, args: AcmCertificateValidationArgs, opts?: pulumi.ComponentResourceOptions) {
        super("aws:acm:AcmCertificateValidationComponent", name, {}, opts);

        this.certificateValidation = new aws.acm.CertificateValidation(`${name}-validation`, {
            certificateArn: args.certificateArn,
            validationRecordFqdns: args.validationRecordFqdns,
            // Removed timeouts
        }, { parent: this });

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

    constructor(name: string, args: DnsValidatedCertificateArgs, opts?: pulumi.ComponentResourceOptions) {
        super("aws:acm:DnsValidatedCertificateComponent", name, {}, opts);

        // Create the certificate
        const certificateComponent = new AcmCertificateComponent(name, {
            domainName: args.domainName,
            subjectAlternativeNames: args.subjectAlternativeNames,
            validationMethod: "DNS",
            tags: args.tags,
        }, { parent: this });

        this.certificate = certificateComponent.certificate;
        this.certificateArn = certificateComponent.certificateArn;
        this.domainName = certificateComponent.domainName;

        // Create DNS validation records
        this.validationRecords = [];
        
        // Create validation records for each domain validation option
        this.certificate.domainValidationOptions.apply(options => {
            options.forEach((option, index) => {
                const validationRecord = new aws.route53.Record(`${name}-validation-${index}`, {
                    name: option.resourceRecordName,
                    records: [option.resourceRecordValue],
                    ttl: 60,
                    type: option.resourceRecordType,
                    zoneId: args.hostedZoneId,
                    allowOverwrite: true,
                }, { parent: this });

                this.validationRecords.push(validationRecord);
            });
        });

        // Create certificate validation
        const validationComponent = new AcmCertificateValidationComponent(`${name}-validation`, {
            certificateArn: this.certificate.arn,
            validationRecordFqdns: this.validationRecords.map(record => record.fqdn),
        }, { parent: this });

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

export function createAcmCertificate(name: string, args: AcmCertificateArgs): AcmCertificateResult {
    const certificateComponent = new AcmCertificateComponent(name, args);
    return {
        certificate: certificateComponent.certificate,
        certificateArn: certificateComponent.certificateArn,
        domainName: certificateComponent.domainName,
    };
}

export function createAcmCertificateValidation(name: string, args: AcmCertificateValidationArgs): aws.acm.CertificateValidation {
    const validationComponent = new AcmCertificateValidationComponent(name, args);
    return validationComponent.certificateValidation;
}

export function createDnsValidatedCertificate(name: string, args: DnsValidatedCertificateArgs): DnsValidatedCertificateResult {
    const dnsValidatedCertificateComponent = new DnsValidatedCertificateComponent(name, args);
    return {
        certificate: dnsValidatedCertificateComponent.certificate,
        certificateArn: dnsValidatedCertificateComponent.certificateArn,
        domainName: dnsValidatedCertificateComponent.domainName,
        certificateValidation: dnsValidatedCertificateComponent.certificateValidation,
        validationRecords: dnsValidatedCertificateComponent.validationRecords,
    };
}