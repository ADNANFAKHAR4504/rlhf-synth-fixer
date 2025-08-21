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
        super('aws:acm:AcmCertificateComponent', name, {}, opts);
        const defaultTags = {
            Name: args.domainName,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        // Create certificate without validation for demo purposes
        this.certificate = new aws.acm.Certificate(`${name}-certificate`, {
            domainName: args.domainName,
            subjectAlternativeNames: args.subjectAlternativeNames,
            validationMethod: args.validationMethod || 'DNS',
            tags: defaultTags,
        }, {
            parent: this,
            provider: opts?.provider,
            // Don't wait for validation to complete
            ignoreChanges: ['validationMethod'],
        });
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
        super('aws:acm:AcmCertificateValidationComponent', name, {}, opts);
        this.certificateValidation = new aws.acm.CertificateValidation(`${name}-validation`, {
            certificateArn: args.certificateArn,
            validationRecordFqdns: args.validationRecordFqdns,
        }, {
            parent: this,
            provider: opts?.provider,
            customTimeouts: {
                create: args.timeoutSeconds ? `${args.timeoutSeconds}s` : '15m',
                delete: '5m',
            },
        });
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
        super('aws:acm:DnsValidatedCertificateComponent', name, {}, opts);
        const certificateComponent = new AcmCertificateComponent(name, {
            domainName: args.domainName,
            subjectAlternativeNames: args.subjectAlternativeNames,
            validationMethod: 'DNS',
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.certificate = certificateComponent.certificate;
        this.certificateArn = certificateComponent.certificateArn;
        this.domainName = certificateComponent.domainName;
        this.validationRecords = [];
        this.certificate.domainValidationOptions.apply(options => {
            options.forEach((option, index) => {
                const validationRecord = new aws.route53.Record(`${name}-validation-${index}`, {
                    name: option.resourceRecordName,
                    records: [option.resourceRecordValue],
                    ttl: 60,
                    type: option.resourceRecordType,
                    zoneId: args.hostedZoneId,
                    allowOverwrite: true,
                }, { parent: this, provider: opts?.provider });
                this.validationRecords.push(validationRecord);
            });
        });
        const validationComponent = new AcmCertificateValidationComponent(`${name}-validation`, {
            certificateArn: this.certificate.arn,
            validationRecordFqdns: this.validationRecords.map(record => record.fqdn),
            timeoutSeconds: 900,
        }, { parent: this, provider: opts?.provider });
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
function createAcmCertificate(name, args, opts) {
    const certificateComponent = new AcmCertificateComponent(name, args, opts);
    return {
        certificate: certificateComponent.certificate,
        certificateArn: certificateComponent.certificateArn,
        domainName: certificateComponent.domainName,
    };
}
function createAcmCertificateValidation(name, args, opts) {
    const validationComponent = new AcmCertificateValidationComponent(name, args, opts);
    return validationComponent.certificateValidation;
}
function createDnsValidatedCertificate(name, args, opts) {
    const dnsValidatedCertificateComponent = new DnsValidatedCertificateComponent(name, args, opts);
    return {
        certificate: dnsValidatedCertificateComponent.certificate,
        certificateArn: dnsValidatedCertificateComponent.certificateArn,
        domainName: dnsValidatedCertificateComponent.domainName,
        certificateValidation: dnsValidatedCertificateComponent.certificateValidation,
        validationRecords: dnsValidatedCertificateComponent.validationRecords,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWNtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdNQSxvREFXQztBQUVELHdFQVdDO0FBRUQsc0VBa0JDO0FBNU9ELHVEQUF5QztBQUN6QyxpREFBbUM7QUFxQ25DLE1BQWEsdUJBQXdCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNuRCxXQUFXLENBQXNCO0lBQ2pDLGNBQWMsQ0FBd0I7SUFDdEMsVUFBVSxDQUF3QjtJQUVsRCxZQUNFLElBQVksRUFDWixJQUF3QixFQUN4QixJQUFzQztRQUV0QyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV6RCxNQUFNLFdBQVcsR0FBRztZQUNsQixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDckIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQ3hDLEdBQUcsSUFBSSxjQUFjLEVBQ3JCO1lBQ0UsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQzNCLHVCQUF1QixFQUFFLElBQUksQ0FBQyx1QkFBdUI7WUFDckQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixJQUFJLEtBQUs7WUFDaEQsSUFBSSxFQUFFLFdBQVc7U0FDbEIsRUFDRDtZQUNFLE1BQU0sRUFBRSxJQUFJO1lBQ1osUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRO1lBQ3hCLHdDQUF3QztZQUN4QyxhQUFhLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQztTQUNwQyxDQUNGLENBQUM7UUFF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QUVELFNBQWdCLG9CQUFvQixDQUNsQyxJQUFZLEVBQ1osSUFBd0IsRUFDeEIsSUFBc0M7SUFFdEMsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLHVCQUF1QixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0UsT0FBTztRQUNMLFdBQVcsRUFBRSxvQkFBb0IsQ0FBQyxXQUFXO1FBQzdDLGNBQWMsRUFBRSxvQkFBb0IsQ0FBQyxjQUFjO1FBQ25ELFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxVQUFVO0tBQzVDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0IsOEJBQThCLENBQzVDLElBQVksRUFDWixJQUFrQyxFQUNsQyxJQUFzQztJQUV0QyxNQUFNLG1CQUFtQixHQUFHLElBQUksaUNBQWlDLENBQy9ELElBQUksRUFDSixJQUFJLEVBQ0osSUFBSSxDQUNMLENBQUM7SUFDRixPQUFPLG1CQUFtQixDQUFDLHFCQUFxQixDQUFDO0FBQ25ELENBQUM7QUFFRCxTQUFnQiw2QkFBNkIsQ0FDM0MsSUFBWSxFQUNaLElBQWlDLEVBQ2pDLElBQXNDO0lBRXRDLE1BQU0sZ0NBQWdDLEdBQUcsSUFBSSxnQ0FBZ0MsQ0FDM0UsSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLENBQ0wsQ0FBQztJQUNGLE9BQU87UUFDTCxXQUFXLEVBQUUsZ0NBQWdDLENBQUMsV0FBVztRQUN6RCxjQUFjLEVBQUUsZ0NBQWdDLENBQUMsY0FBYztRQUMvRCxVQUFVLEVBQUUsZ0NBQWdDLENBQUMsVUFBVTtRQUN2RCxxQkFBcUIsRUFDbkIsZ0NBQWdDLENBQUMscUJBQXFCO1FBQ3hELGlCQUFpQixFQUFFLGdDQUFnQyxDQUFDLGlCQUFpQjtLQUN0RSxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFjbUNlcnRpZmljYXRlQXJncyB7XG4gIGRvbWFpbk5hbWU6IHN0cmluZztcbiAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM/OiBzdHJpbmdbXTtcbiAgdmFsaWRhdGlvbk1ldGhvZD86ICdETlMnIHwgJ0VNQUlMJztcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIHNraXBWYWxpZGF0aW9uPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBY21DZXJ0aWZpY2F0ZVJlc3VsdCB7XG4gIGNlcnRpZmljYXRlOiBhd3MuYWNtLkNlcnRpZmljYXRlO1xuICBjZXJ0aWZpY2F0ZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBkb21haW5OYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWNtQ2VydGlmaWNhdGVWYWxpZGF0aW9uQXJncyB7XG4gIGNlcnRpZmljYXRlQXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdmFsaWRhdGlvblJlY29yZEZxZG5zOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICB0aW1lb3V0U2Vjb25kcz86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUFyZ3Mge1xuICBkb21haW5OYW1lOiBzdHJpbmc7XG4gIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzPzogc3RyaW5nW107XG4gIGhvc3RlZFpvbmVJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERuc1ZhbGlkYXRlZENlcnRpZmljYXRlUmVzdWx0IHtcbiAgY2VydGlmaWNhdGU6IGF3cy5hY20uQ2VydGlmaWNhdGU7XG4gIGNlcnRpZmljYXRlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGRvbWFpbk5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgY2VydGlmaWNhdGVWYWxpZGF0aW9uOiBhd3MuYWNtLkNlcnRpZmljYXRlVmFsaWRhdGlvbjtcbiAgdmFsaWRhdGlvblJlY29yZHM6IGF3cy5yb3V0ZTUzLlJlY29yZFtdO1xufVxuXG5leHBvcnQgY2xhc3MgQWNtQ2VydGlmaWNhdGVDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgY2VydGlmaWNhdGU6IGF3cy5hY20uQ2VydGlmaWNhdGU7XG4gIHB1YmxpYyByZWFkb25seSBjZXJ0aWZpY2F0ZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZG9tYWluTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBBY21DZXJ0aWZpY2F0ZUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czphY206QWNtQ2VydGlmaWNhdGVDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MuZG9tYWluTmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgY2VydGlmaWNhdGUgd2l0aG91dCB2YWxpZGF0aW9uIGZvciBkZW1vIHB1cnBvc2VzXG4gICAgdGhpcy5jZXJ0aWZpY2F0ZSA9IG5ldyBhd3MuYWNtLkNlcnRpZmljYXRlKFxuICAgICAgYCR7bmFtZX0tY2VydGlmaWNhdGVgLFxuICAgICAge1xuICAgICAgICBkb21haW5OYW1lOiBhcmdzLmRvbWFpbk5hbWUsXG4gICAgICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBhcmdzLnN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzLFxuICAgICAgICB2YWxpZGF0aW9uTWV0aG9kOiBhcmdzLnZhbGlkYXRpb25NZXRob2QgfHwgJ0ROUycsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIsXG4gICAgICAgIC8vIERvbid0IHdhaXQgZm9yIHZhbGlkYXRpb24gdG8gY29tcGxldGVcbiAgICAgICAgaWdub3JlQ2hhbmdlczogWyd2YWxpZGF0aW9uTWV0aG9kJ10sXG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuY2VydGlmaWNhdGVBcm4gPSB0aGlzLmNlcnRpZmljYXRlLmFybjtcbiAgICB0aGlzLmRvbWFpbk5hbWUgPSB0aGlzLmNlcnRpZmljYXRlLmRvbWFpbk5hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBjZXJ0aWZpY2F0ZTogdGhpcy5jZXJ0aWZpY2F0ZSxcbiAgICAgIGNlcnRpZmljYXRlQXJuOiB0aGlzLmNlcnRpZmljYXRlQXJuLFxuICAgICAgZG9tYWluTmFtZTogdGhpcy5kb21haW5OYW1lLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBY21DZXJ0aWZpY2F0ZVZhbGlkYXRpb25Db21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgY2VydGlmaWNhdGVWYWxpZGF0aW9uOiBhd3MuYWNtLkNlcnRpZmljYXRlVmFsaWRhdGlvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogQWNtQ2VydGlmaWNhdGVWYWxpZGF0aW9uQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmFjbTpBY21DZXJ0aWZpY2F0ZVZhbGlkYXRpb25Db21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICB0aGlzLmNlcnRpZmljYXRlVmFsaWRhdGlvbiA9IG5ldyBhd3MuYWNtLkNlcnRpZmljYXRlVmFsaWRhdGlvbihcbiAgICAgIGAke25hbWV9LXZhbGlkYXRpb25gLFxuICAgICAge1xuICAgICAgICBjZXJ0aWZpY2F0ZUFybjogYXJncy5jZXJ0aWZpY2F0ZUFybixcbiAgICAgICAgdmFsaWRhdGlvblJlY29yZEZxZG5zOiBhcmdzLnZhbGlkYXRpb25SZWNvcmRGcWRucyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyLFxuICAgICAgICBjdXN0b21UaW1lb3V0czoge1xuICAgICAgICAgIGNyZWF0ZTogYXJncy50aW1lb3V0U2Vjb25kcyA/IGAke2FyZ3MudGltZW91dFNlY29uZHN9c2AgOiAnMTVtJyxcbiAgICAgICAgICBkZWxldGU6ICc1bScsXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGNlcnRpZmljYXRlVmFsaWRhdGlvbjogdGhpcy5jZXJ0aWZpY2F0ZVZhbGlkYXRpb24sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGNlcnRpZmljYXRlOiBhd3MuYWNtLkNlcnRpZmljYXRlO1xuICBwdWJsaWMgcmVhZG9ubHkgY2VydGlmaWNhdGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRvbWFpbk5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNlcnRpZmljYXRlVmFsaWRhdGlvbjogYXdzLmFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb247XG4gIHB1YmxpYyByZWFkb25seSB2YWxpZGF0aW9uUmVjb3JkczogYXdzLnJvdXRlNTMuUmVjb3JkW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IERuc1ZhbGlkYXRlZENlcnRpZmljYXRlQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmFjbTpEbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUNvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGNlcnRpZmljYXRlQ29tcG9uZW50ID0gbmV3IEFjbUNlcnRpZmljYXRlQ29tcG9uZW50KFxuICAgICAgbmFtZSxcbiAgICAgIHtcbiAgICAgICAgZG9tYWluTmFtZTogYXJncy5kb21haW5OYW1lLFxuICAgICAgICBzdWJqZWN0QWx0ZXJuYXRpdmVOYW1lczogYXJncy5zdWJqZWN0QWx0ZXJuYXRpdmVOYW1lcyxcbiAgICAgICAgdmFsaWRhdGlvbk1ldGhvZDogJ0ROUycsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5jZXJ0aWZpY2F0ZSA9IGNlcnRpZmljYXRlQ29tcG9uZW50LmNlcnRpZmljYXRlO1xuICAgIHRoaXMuY2VydGlmaWNhdGVBcm4gPSBjZXJ0aWZpY2F0ZUNvbXBvbmVudC5jZXJ0aWZpY2F0ZUFybjtcbiAgICB0aGlzLmRvbWFpbk5hbWUgPSBjZXJ0aWZpY2F0ZUNvbXBvbmVudC5kb21haW5OYW1lO1xuXG4gICAgdGhpcy52YWxpZGF0aW9uUmVjb3JkcyA9IFtdO1xuXG4gICAgdGhpcy5jZXJ0aWZpY2F0ZS5kb21haW5WYWxpZGF0aW9uT3B0aW9ucy5hcHBseShvcHRpb25zID0+IHtcbiAgICAgIG9wdGlvbnMuZm9yRWFjaCgob3B0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVjb3JkID0gbmV3IGF3cy5yb3V0ZTUzLlJlY29yZChcbiAgICAgICAgICBgJHtuYW1lfS12YWxpZGF0aW9uLSR7aW5kZXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiBvcHRpb24ucmVzb3VyY2VSZWNvcmROYW1lLFxuICAgICAgICAgICAgcmVjb3JkczogW29wdGlvbi5yZXNvdXJjZVJlY29yZFZhbHVlXSxcbiAgICAgICAgICAgIHR0bDogNjAsXG4gICAgICAgICAgICB0eXBlOiBvcHRpb24ucmVzb3VyY2VSZWNvcmRUeXBlLFxuICAgICAgICAgICAgem9uZUlkOiBhcmdzLmhvc3RlZFpvbmVJZCxcbiAgICAgICAgICAgIGFsbG93T3ZlcndyaXRlOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVjb3Jkcy5wdXNoKHZhbGlkYXRpb25SZWNvcmQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB2YWxpZGF0aW9uQ29tcG9uZW50ID0gbmV3IEFjbUNlcnRpZmljYXRlVmFsaWRhdGlvbkNvbXBvbmVudChcbiAgICAgIGAke25hbWV9LXZhbGlkYXRpb25gLFxuICAgICAge1xuICAgICAgICBjZXJ0aWZpY2F0ZUFybjogdGhpcy5jZXJ0aWZpY2F0ZS5hcm4sXG4gICAgICAgIHZhbGlkYXRpb25SZWNvcmRGcWRuczogdGhpcy52YWxpZGF0aW9uUmVjb3Jkcy5tYXAoXG4gICAgICAgICAgcmVjb3JkID0+IHJlY29yZC5mcWRuXG4gICAgICAgICksXG4gICAgICAgIHRpbWVvdXRTZWNvbmRzOiA5MDAsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMuY2VydGlmaWNhdGVWYWxpZGF0aW9uID0gdmFsaWRhdGlvbkNvbXBvbmVudC5jZXJ0aWZpY2F0ZVZhbGlkYXRpb247XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBjZXJ0aWZpY2F0ZTogdGhpcy5jZXJ0aWZpY2F0ZSxcbiAgICAgIGNlcnRpZmljYXRlQXJuOiB0aGlzLmNlcnRpZmljYXRlQXJuLFxuICAgICAgZG9tYWluTmFtZTogdGhpcy5kb21haW5OYW1lLFxuICAgICAgY2VydGlmaWNhdGVWYWxpZGF0aW9uOiB0aGlzLmNlcnRpZmljYXRlVmFsaWRhdGlvbixcbiAgICAgIHZhbGlkYXRpb25SZWNvcmRzOiB0aGlzLnZhbGlkYXRpb25SZWNvcmRzLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBY21DZXJ0aWZpY2F0ZShcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBBY21DZXJ0aWZpY2F0ZUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBBY21DZXJ0aWZpY2F0ZVJlc3VsdCB7XG4gIGNvbnN0IGNlcnRpZmljYXRlQ29tcG9uZW50ID0gbmV3IEFjbUNlcnRpZmljYXRlQ29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpO1xuICByZXR1cm4ge1xuICAgIGNlcnRpZmljYXRlOiBjZXJ0aWZpY2F0ZUNvbXBvbmVudC5jZXJ0aWZpY2F0ZSxcbiAgICBjZXJ0aWZpY2F0ZUFybjogY2VydGlmaWNhdGVDb21wb25lbnQuY2VydGlmaWNhdGVBcm4sXG4gICAgZG9tYWluTmFtZTogY2VydGlmaWNhdGVDb21wb25lbnQuZG9tYWluTmFtZSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFjbUNlcnRpZmljYXRlVmFsaWRhdGlvbihcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBBY21DZXJ0aWZpY2F0ZVZhbGlkYXRpb25BcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogYXdzLmFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24ge1xuICBjb25zdCB2YWxpZGF0aW9uQ29tcG9uZW50ID0gbmV3IEFjbUNlcnRpZmljYXRlVmFsaWRhdGlvbkNvbXBvbmVudChcbiAgICBuYW1lLFxuICAgIGFyZ3MsXG4gICAgb3B0c1xuICApO1xuICByZXR1cm4gdmFsaWRhdGlvbkNvbXBvbmVudC5jZXJ0aWZpY2F0ZVZhbGlkYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZShcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBEbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBEbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZVJlc3VsdCB7XG4gIGNvbnN0IGRuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50ID0gbmV3IERuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzXG4gICk7XG4gIHJldHVybiB7XG4gICAgY2VydGlmaWNhdGU6IGRuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50LmNlcnRpZmljYXRlLFxuICAgIGNlcnRpZmljYXRlQXJuOiBkbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUNvbXBvbmVudC5jZXJ0aWZpY2F0ZUFybixcbiAgICBkb21haW5OYW1lOiBkbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZUNvbXBvbmVudC5kb21haW5OYW1lLFxuICAgIGNlcnRpZmljYXRlVmFsaWRhdGlvbjpcbiAgICAgIGRuc1ZhbGlkYXRlZENlcnRpZmljYXRlQ29tcG9uZW50LmNlcnRpZmljYXRlVmFsaWRhdGlvbixcbiAgICB2YWxpZGF0aW9uUmVjb3JkczogZG5zVmFsaWRhdGVkQ2VydGlmaWNhdGVDb21wb25lbnQudmFsaWRhdGlvblJlY29yZHMsXG4gIH07XG59XG4iXX0=