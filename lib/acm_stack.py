"""
acm_stack.py

AWS Certificate Manager certificates for CloudFront.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from typing import Optional


class AcmStack(pulumi.ComponentResource):
    """ACM certificates for HTTPS."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        domain: str,
        hosted_zone_id: Optional[Output[str]],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:acm:AcmStack", name, None, opts)

        # Note: ACM certificates for CloudFront must be in us-east-1
        us_east_1_provider = aws.Provider(
            f"us-east-1-provider-{environment_suffix}",
            region="us-east-1",
            opts=ResourceOptions(parent=self)
        )

        # Request certificate
        self.certificate = aws.acm.Certificate(
            f"certificate-{environment_suffix}",
            domain_name=domain,
            validation_method="DNS",
            tags={**tags, "Name": f"certificate-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Create DNS validation records only if hosted_zone_id is provided
        if hosted_zone_id is not None:
            validation_record = aws.route53.Record(
                f"cert-validation-record-{environment_suffix}",
                zone_id=hosted_zone_id,
                name=self.certificate.domain_validation_options[0].resource_record_name,
                type=self.certificate.domain_validation_options[0].resource_record_type,
                records=[self.certificate.domain_validation_options[0].resource_record_value],
                ttl=60,
                opts=ResourceOptions(parent=self)
            )

            # Certificate validation
            self.certificate_validation = aws.acm.CertificateValidation(
                f"certificate-validation-{environment_suffix}",
                certificate_arn=self.certificate.arn,
                validation_record_fqdns=[validation_record.fqdn],
                opts=ResourceOptions(parent=self, provider=us_east_1_provider)
            )
        else:
            # Export validation records for manual DNS configuration
            pulumi.export(f"cert_validation_records_{environment_suffix}",
                         self.certificate.domain_validation_options)
            self.certificate_validation = None

        self.register_outputs({
            "certificate_arn": self.certificate.arn,
        })
