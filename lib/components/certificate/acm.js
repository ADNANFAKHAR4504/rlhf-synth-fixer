"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnsValidatedCertificateComponent = exports.AcmCertificateValidationComponent = exports.AcmCertificateComponent = void 0;
exports.createAcmCertificate = createAcmCertificate;
exports.createAcmCertificateValidation = createAcmCertificateValidation;
exports.createDnsValidatedCertificate = createDnsValidatedCertificate;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class AcmCertificateComponent extends pulumi.ComponentResource {
    certificate;
    certificateArn;
    domainName;
    constructor(name, args, opts) {
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
exports.AcmCertificateComponent = AcmCertificateComponent;
class AcmCertificateValidationComponent extends pulumi.ComponentResource {
    certificateValidation;
    constructor(name, args, opts) {
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
exports.AcmCertificateValidationComponent = AcmCertificateValidationComponent;
class DnsValidatedCertificateComponent extends pulumi.ComponentResource {
    certificate;
    certificateArn;
    domainName;
    certificateValidation;
    validationRecords;
    constructor(name, args, opts) {
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
exports.DnsValidatedCertificateComponent = DnsValidatedCertificateComponent;
function createAcmCertificate(name, args) {
    const certificateComponent = new AcmCertificateComponent(name, args);
    return {
        certificate: certificateComponent.certificate,
        certificateArn: certificateComponent.certificateArn,
        domainName: certificateComponent.domainName,
    };
}
function createAcmCertificateValidation(name, args) {
    const validationComponent = new AcmCertificateValidationComponent(name, args);
    return validationComponent.certificateValidation;
}
function createDnsValidatedCertificate(name, args) {
    const dnsValidatedCertificateComponent = new DnsValidatedCertificateComponent(name, args);
    return {
        certificate: dnsValidatedCertificateComponent.certificate,
        certificateArn: dnsValidatedCertificateComponent.certificateArn,
        domainName: dnsValidatedCertificateComponent.domainName,
        certificateValidation: dnsValidatedCertificateComponent.certificateValidation,
        validationRecords: dnsValidatedCertificateComponent.validationRecords,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWNtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdKQSxvREFPQztBQUVELHdFQUdDO0FBRUQsc0VBU0M7QUEvS0QsdURBQXlDO0FBQ3pDLGlEQUFtQztBQXVDbkMsTUFBYSx1QkFBd0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ2pELFdBQVcsQ0FBc0I7SUFDakMsY0FBYyxDQUF3QjtJQUN0QyxVQUFVLENBQXdCO0lBRWxELFlBQVksSUFBWSxFQUFFLElBQXdCLEVBQUUsSUFBc0M7UUFDdEYsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsTUFBTSxXQUFXLEdBQUc7WUFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ3JCLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNmLENBQUM7UUFFRixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFJLGNBQWMsRUFBRTtZQUM5RCxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDM0IsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QjtZQUNyRCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLElBQUksS0FBSztZQUNoRCxpRUFBaUU7WUFDakUsSUFBSSxFQUFFLFdBQVc7U0FDcEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUM7UUFDM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxJ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LElBQUksaUNBQWlDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlFLE9BQU8sbUJBQW1CLENBQUMscUJBQXFCLENBQUM7QUFDckQsQ0FBQztBQUVELFNBQWdCLDZCQUE2QixDQUFDLElBQVksRUFBRSxJQUFpQztJQUN6RixNQUFNLGdDQUFnQyxHQUFHLElBQUksZ0NBQWdDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFGLE9BQU87UUFDSCxXQUFXLEVBQUUsZ0NBQWdDLENBQUMsV0FBVztRQUN6RCxjQUFjLEVBQUUsZ0NBQWdDLENBQUMsY0FBYztRQUMvRCxVQUFVLEVBQUUsZ0NBQWdDLENBQUMsVUFBVTtRQUN2RCxxQkFBcUIsRUFBRSxnQ0FBZ0MsQ0FBQyxxQkFBcUI7UUFDN0UsaUJBQWlCLEVBQUUsZ0NBQWdDLENBQUMsaUJBQWlCO0tBQ3hFLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFjbUNlcnRpZmljYXRlQXJncyB7XG4gICAgZG9tYWluTmFtZTogc3RyaW5nO1xuICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzPzogc3RyaW5nW107XG4gICAgdmFsaWRhdGlvbk1ldGhvZD86IFwiRE5TXCIgfCBcIkVNQUlMXCI7XG4gICAgLy8gUmVtb3ZlZCBjZXJ0aWZpY2F0ZVRyYW5zcGFyZW5jeUxvZ2dpbmdQcmVmZXJlbmNlIGFzIGl0J3Mgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IHByb3ZpZGVyXG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWNtQ2VydGlmaWNhdGVSZXN1bHQge1xuICAgIGNlcnRpZmljYXRlOiBhd3MuYWNtLkNlcnRpZmljYXRlO1xuICAgIGNlcnRpZmljYXRlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgZG9tYWluTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIGNlcnRpZmljYXRlVmFsaWRhdGlvbj86IGF3cy5hY20uQ2VydGlmaWNhdGVWYWxpZGF0aW9uO1xuICAgIHZhbGlkYXRpb25SZWNvcmRzPzogYXdzLnJvdXRlNTMuUmVjb3JkW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWNtQ2VydGlmaWNhdGVWYWxpZGF0aW9uQXJncyB7XG4gICAgY2VydGlmaWNhdGVBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHZhbGlkYXRpb25SZWNvcmRGcWRuczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgICAvLyBSZW1vdmVkIHRpbWVvdXRzIGFzIGl0J3Mgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IHByb3ZpZGVyXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG5zVmFsaWRhdGVkQ2VydGlmaWNhdGVBcmdzIHtcbiAgICBkb21haW5OYW1lOiBzdHJpbmc7XG4gICAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM/OiBzdHJpbmdbXTtcbiAgICBob3N0ZWRab25lSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERuc1ZhbGlkYXRlZENlcnRpZmljYXRlUmVzdWx0IHtcbiAgICBjZXJ0aWZpY2F0ZTogYXdzLmFjbS5DZXJ0aWZpY2F0ZTtcbiAgICBjZXJ0aWZpY2F0ZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIGRvbWFpbk5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBjZXJ0aWZpY2F0ZVZhbGlkYXRpb246IGF3cy5hY20uQ2VydGlmaWNhdGVWYWxpZGF0aW9uO1xuICAgIHZhbGlkYXRpb25SZWNvcmRzOiBhd3Mucm91dGU1My5SZWNvcmRbXTtcbn1cblxuZXhwb3J0IGNsYXNzIEFjbUNlcnRpZmljYXRlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2VydGlmaWNhdGU6IGF3cy5hY20uQ2VydGlmaWNhdGU7XG4gICAgcHVibGljIHJlYWRvbmx5IGNlcnRpZmljYXRlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGRvbWFpbk5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogQWNtQ2VydGlmaWNhdGVBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czphY206QWNtQ2VydGlmaWNhdGVDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5kb21haW5OYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTm92YS1Nb2RlbC1CcmVha2luZ1wiLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY2VydGlmaWNhdGUgPSBuZXcgYXdzLmFjbS5DZXJ0aWZpY2F0ZShgJHtuYW1lfS1jZXJ0aWZpY2F0ZWAsIHtcbiAgICAgICAgICAgIGRvbWFpbk5hbWU6IGFyZ3MuZG9tYWluTmFtZSxcbiAgICAgICAgICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBhcmdzLnN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzLFxuICAgICAgICAgICAgdmFsaWRhdGlvbk1ldGhvZDogYXJncy52YWxpZGF0aW9uTWV0aG9kIHx8IFwiRE5TXCIsXG4gICAgICAgICAgICAvLyBSZW1vdmVkIGNlcnRpZmljYXRlVHJhbnNwYXJlbmN5TG9nZ2luZ1ByZWZlcmVuY2UgYW5kIGxpZmVjeWNsZVxuICAgICAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMuY2VydGlmaWNhdGVBcm4gPSB0aGlzLmNlcnRpZmljYXRlLmFybjtcbiAgICAgICAgdGhpcy5kb21haW5OYW1lID0gdGhpcy5jZXJ0aWZpY2F0ZS5kb21haW5OYW1lO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGNlcnRpZmljYXRlOiB0aGlzLmNlcnRpZmljYXRlLFxuICAgICAgICAgICAgY2VydGlmaWNhdGVBcm46IHRoaXMuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgICAgICBkb21haW5OYW1lOiB0aGlzLmRvbWFpbk5hbWUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFjbUNlcnRpZmljYXRlVmFsaWRhdGlvbkNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGNlcnRpZmljYXRlVmFsaWRhdGlvbjogYXdzLmFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IEFjbUNlcnRpZmljYXRlVmFsaWRhdGlvbkFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmFjbTpBY21DZXJ0aWZpY2F0ZVZhbGlkYXRpb25Db21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIHRoaXMuY2VydGlmaWNhdGVWYWxpZGF0aW9uID0gbmV3IGF3cy5hY20uQ2VydGlmaWNhdGVWYWxpZGF0aW9uKGAke25hbWV9LXZhbGlkYXRpb25gLCB7XG4gICAgICAgICAgICBjZXJ0aWZpY2F0ZUFybjogYXJncy5jZXJ0aWZpY2F0ZUFybixcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZWNvcmRGcWRuczogYXJncy52YWxpZGF0aW9uUmVjb3JkRnFkbnMsXG4gICAgICAgICAgICAvLyBSZW1vdmVkIHRpbWVvdXRzXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGNlcnRpZmljYXRlVmFsaWRhdGlvbjogdGhpcy5jZXJ0aWZpY2F0ZVZhbGlkYXRpb24sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2VydGlmaWNhdGU6IGF3cy5hY20uQ2VydGlmaWNhdGU7XG4gICAgcHVibGljIHJlYWRvbmx5IGNlcnRpZmljYXRlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGRvbWFpbk5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2VydGlmaWNhdGVWYWxpZGF0aW9uOiBhd3MuYWNtLkNlcnRpZmljYXRlVmFsaWRhdGlvbjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdmFsaWRhdGlvblJlY29yZHM6IGF3cy5yb3V0ZTUzLlJlY29yZFtdO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBEbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmFjbTpEbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjZXJ0aWZpY2F0ZVxuICAgICAgICBjb25zdCBjZXJ0aWZpY2F0ZUNvbXBvbmVudCA9IG5ldyBBY21DZXJ0aWZpY2F0ZUNvbXBvbmVudChuYW1lLCB7XG4gICAgICAgICAgICBkb21haW5OYW1lOiBhcmdzLmRvbWFpbk5hbWUsXG4gICAgICAgICAgICBzdWJqZWN0QWx0ZXJuYXRpdmVOYW1lczogYXJncy5zdWJqZWN0QWx0ZXJuYXRpdmVOYW1lcyxcbiAgICAgICAgICAgIHZhbGlkYXRpb25NZXRob2Q6IFwiRE5TXCIsXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMuY2VydGlmaWNhdGUgPSBjZXJ0aWZpY2F0ZUNvbXBvbmVudC5jZXJ0aWZpY2F0ZTtcbiAgICAgICAgdGhpcy5jZXJ0aWZpY2F0ZUFybiA9IGNlcnRpZmljYXRlQ29tcG9uZW50LmNlcnRpZmljYXRlQXJuO1xuICAgICAgICB0aGlzLmRvbWFpbk5hbWUgPSBjZXJ0aWZpY2F0ZUNvbXBvbmVudC5kb21haW5OYW1lO1xuXG4gICAgICAgIC8vIENyZWF0ZSBETlMgdmFsaWRhdGlvbiByZWNvcmRzXG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlY29yZHMgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIC8vIENyZWF0ZSB2YWxpZGF0aW9uIHJlY29yZHMgZm9yIGVhY2ggZG9tYWluIHZhbGlkYXRpb24gb3B0aW9uXG4gICAgICAgIHRoaXMuY2VydGlmaWNhdGUuZG9tYWluVmFsaWRhdGlvbk9wdGlvbnMuYXBwbHkob3B0aW9ucyA9PiB7XG4gICAgICAgICAgICBvcHRpb25zLmZvckVhY2goKG9wdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVjb3JkID0gbmV3IGF3cy5yb3V0ZTUzLlJlY29yZChgJHtuYW1lfS12YWxpZGF0aW9uLSR7aW5kZXh9YCwge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBvcHRpb24ucmVzb3VyY2VSZWNvcmROYW1lLFxuICAgICAgICAgICAgICAgICAgICByZWNvcmRzOiBbb3B0aW9uLnJlc291cmNlUmVjb3JkVmFsdWVdLFxuICAgICAgICAgICAgICAgICAgICB0dGw6IDYwLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBvcHRpb24ucmVzb3VyY2VSZWNvcmRUeXBlLFxuICAgICAgICAgICAgICAgICAgICB6b25lSWQ6IGFyZ3MuaG9zdGVkWm9uZUlkLFxuICAgICAgICAgICAgICAgICAgICBhbGxvd092ZXJ3cml0ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGlvblJlY29yZHMucHVzaCh2YWxpZGF0aW9uUmVjb3JkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgY2VydGlmaWNhdGUgdmFsaWRhdGlvblxuICAgICAgICBjb25zdCB2YWxpZGF0aW9uQ29tcG9uZW50ID0gbmV3IEFjbUNlcnRpZmljYXRlVmFsaWRhdGlvbkNvbXBvbmVudChgJHtuYW1lfS12YWxpZGF0aW9uYCwge1xuICAgICAgICAgICAgY2VydGlmaWNhdGVBcm46IHRoaXMuY2VydGlmaWNhdGUuYXJuLFxuICAgICAgICAgICAgdmFsaWRhdGlvblJlY29yZEZxZG5zOiB0aGlzLnZhbGlkYXRpb25SZWNvcmRzLm1hcChyZWNvcmQgPT4gcmVjb3JkLmZxZG4pLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmNlcnRpZmljYXRlVmFsaWRhdGlvbiA9IHZhbGlkYXRpb25Db21wb25lbnQuY2VydGlmaWNhdGVWYWxpZGF0aW9uO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGNlcnRpZmljYXRlOiB0aGlzLmNlcnRpZmljYXRlLFxuICAgICAgICAgICAgY2VydGlmaWNhdGVBcm46IHRoaXMuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgICAgICBkb21haW5OYW1lOiB0aGlzLmRvbWFpbk5hbWUsXG4gICAgICAgICAgICBjZXJ0aWZpY2F0ZVZhbGlkYXRpb246IHRoaXMuY2VydGlmaWNhdGVWYWxpZGF0aW9uLFxuICAgICAgICAgICAgdmFsaWRhdGlvblJlY29yZHM6IHRoaXMudmFsaWRhdGlvblJlY29yZHMsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFjbUNlcnRpZmljYXRlKG5hbWU6IHN0cmluZywgYXJnczogQWNtQ2VydGlmaWNhdGVBcmdzKTogQWNtQ2VydGlmaWNhdGVSZXN1bHQge1xuICAgIGNvbnN0IGNlcnRpZmljYXRlQ29tcG9uZW50ID0gbmV3IEFjbUNlcnRpZmljYXRlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGNlcnRpZmljYXRlOiBjZXJ0aWZpY2F0ZUNvbXBvbmVudC5jZXJ0aWZpY2F0ZSxcbiAgICAgICAgY2VydGlmaWNhdGVBcm46IGNlcnRpZmljYXRlQ29tcG9uZW50LmNlcnRpZmljYXRlQXJuLFxuICAgICAgICBkb21haW5OYW1lOiBjZXJ0aWZpY2F0ZUNvbXBvbmVudC5kb21haW5OYW1lLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBY21DZXJ0aWZpY2F0ZVZhbGlkYXRpb24obmFtZTogc3RyaW5nLCBhcmdzOiBBY21DZXJ0aWZpY2F0ZVZhbGlkYXRpb25BcmdzKTogYXdzLmFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24ge1xuICAgIGNvbnN0IHZhbGlkYXRpb25Db21wb25lbnQgPSBuZXcgQWNtQ2VydGlmaWNhdGVWYWxpZGF0aW9uQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB2YWxpZGF0aW9uQ29tcG9uZW50LmNlcnRpZmljYXRlVmFsaWRhdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURuc1ZhbGlkYXRlZENlcnRpZmljYXRlKG5hbWU6IHN0cmluZywgYXJnczogRG5zVmFsaWRhdGVkQ2VydGlmaWNhdGVBcmdzKTogRG5zVmFsaWRhdGVkQ2VydGlmaWNhdGVSZXN1bHQge1xuICAgIGNvbnN0IGRuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50ID0gbmV3IERuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGNlcnRpZmljYXRlOiBkbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUNvbXBvbmVudC5jZXJ0aWZpY2F0ZSxcbiAgICAgICAgY2VydGlmaWNhdGVBcm46IGRuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50LmNlcnRpZmljYXRlQXJuLFxuICAgICAgICBkb21haW5OYW1lOiBkbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUNvbXBvbmVudC5kb21haW5OYW1lLFxuICAgICAgICBjZXJ0aWZpY2F0ZVZhbGlkYXRpb246IGRuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50LmNlcnRpZmljYXRlVmFsaWRhdGlvbixcbiAgICAgICAgdmFsaWRhdGlvblJlY29yZHM6IGRuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50LnZhbGlkYXRpb25SZWNvcmRzLFxuICAgIH07XG59Il19