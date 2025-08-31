package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.238Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionViewerCertificate")
@software.amazon.jsii.Jsii.Proxy(CloudfrontDistributionViewerCertificate.Jsii$Proxy.class)
public interface CloudfrontDistributionViewerCertificate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#acm_certificate_arn CloudfrontDistribution#acm_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcmCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cloudfront_default_certificate CloudfrontDistribution#cloudfront_default_certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudfrontDefaultCertificate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#iam_certificate_id CloudfrontDistribution#iam_certificate_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamCertificateId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#minimum_protocol_version CloudfrontDistribution#minimum_protocol_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMinimumProtocolVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#ssl_support_method CloudfrontDistribution#ssl_support_method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSslSupportMethod() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontDistributionViewerCertificate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontDistributionViewerCertificate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontDistributionViewerCertificate> {
        java.lang.String acmCertificateArn;
        java.lang.Object cloudfrontDefaultCertificate;
        java.lang.String iamCertificateId;
        java.lang.String minimumProtocolVersion;
        java.lang.String sslSupportMethod;

        /**
         * Sets the value of {@link CloudfrontDistributionViewerCertificate#getAcmCertificateArn}
         * @param acmCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#acm_certificate_arn CloudfrontDistribution#acm_certificate_arn}.
         * @return {@code this}
         */
        public Builder acmCertificateArn(java.lang.String acmCertificateArn) {
            this.acmCertificateArn = acmCertificateArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionViewerCertificate#getCloudfrontDefaultCertificate}
         * @param cloudfrontDefaultCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cloudfront_default_certificate CloudfrontDistribution#cloudfront_default_certificate}.
         * @return {@code this}
         */
        public Builder cloudfrontDefaultCertificate(java.lang.Boolean cloudfrontDefaultCertificate) {
            this.cloudfrontDefaultCertificate = cloudfrontDefaultCertificate;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionViewerCertificate#getCloudfrontDefaultCertificate}
         * @param cloudfrontDefaultCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cloudfront_default_certificate CloudfrontDistribution#cloudfront_default_certificate}.
         * @return {@code this}
         */
        public Builder cloudfrontDefaultCertificate(com.hashicorp.cdktf.IResolvable cloudfrontDefaultCertificate) {
            this.cloudfrontDefaultCertificate = cloudfrontDefaultCertificate;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionViewerCertificate#getIamCertificateId}
         * @param iamCertificateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#iam_certificate_id CloudfrontDistribution#iam_certificate_id}.
         * @return {@code this}
         */
        public Builder iamCertificateId(java.lang.String iamCertificateId) {
            this.iamCertificateId = iamCertificateId;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionViewerCertificate#getMinimumProtocolVersion}
         * @param minimumProtocolVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#minimum_protocol_version CloudfrontDistribution#minimum_protocol_version}.
         * @return {@code this}
         */
        public Builder minimumProtocolVersion(java.lang.String minimumProtocolVersion) {
            this.minimumProtocolVersion = minimumProtocolVersion;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionViewerCertificate#getSslSupportMethod}
         * @param sslSupportMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#ssl_support_method CloudfrontDistribution#ssl_support_method}.
         * @return {@code this}
         */
        public Builder sslSupportMethod(java.lang.String sslSupportMethod) {
            this.sslSupportMethod = sslSupportMethod;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontDistributionViewerCertificate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontDistributionViewerCertificate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontDistributionViewerCertificate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontDistributionViewerCertificate {
        private final java.lang.String acmCertificateArn;
        private final java.lang.Object cloudfrontDefaultCertificate;
        private final java.lang.String iamCertificateId;
        private final java.lang.String minimumProtocolVersion;
        private final java.lang.String sslSupportMethod;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.acmCertificateArn = software.amazon.jsii.Kernel.get(this, "acmCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cloudfrontDefaultCertificate = software.amazon.jsii.Kernel.get(this, "cloudfrontDefaultCertificate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iamCertificateId = software.amazon.jsii.Kernel.get(this, "iamCertificateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minimumProtocolVersion = software.amazon.jsii.Kernel.get(this, "minimumProtocolVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sslSupportMethod = software.amazon.jsii.Kernel.get(this, "sslSupportMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.acmCertificateArn = builder.acmCertificateArn;
            this.cloudfrontDefaultCertificate = builder.cloudfrontDefaultCertificate;
            this.iamCertificateId = builder.iamCertificateId;
            this.minimumProtocolVersion = builder.minimumProtocolVersion;
            this.sslSupportMethod = builder.sslSupportMethod;
        }

        @Override
        public final java.lang.String getAcmCertificateArn() {
            return this.acmCertificateArn;
        }

        @Override
        public final java.lang.Object getCloudfrontDefaultCertificate() {
            return this.cloudfrontDefaultCertificate;
        }

        @Override
        public final java.lang.String getIamCertificateId() {
            return this.iamCertificateId;
        }

        @Override
        public final java.lang.String getMinimumProtocolVersion() {
            return this.minimumProtocolVersion;
        }

        @Override
        public final java.lang.String getSslSupportMethod() {
            return this.sslSupportMethod;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAcmCertificateArn() != null) {
                data.set("acmCertificateArn", om.valueToTree(this.getAcmCertificateArn()));
            }
            if (this.getCloudfrontDefaultCertificate() != null) {
                data.set("cloudfrontDefaultCertificate", om.valueToTree(this.getCloudfrontDefaultCertificate()));
            }
            if (this.getIamCertificateId() != null) {
                data.set("iamCertificateId", om.valueToTree(this.getIamCertificateId()));
            }
            if (this.getMinimumProtocolVersion() != null) {
                data.set("minimumProtocolVersion", om.valueToTree(this.getMinimumProtocolVersion()));
            }
            if (this.getSslSupportMethod() != null) {
                data.set("sslSupportMethod", om.valueToTree(this.getSslSupportMethod()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontDistribution.CloudfrontDistributionViewerCertificate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontDistributionViewerCertificate.Jsii$Proxy that = (CloudfrontDistributionViewerCertificate.Jsii$Proxy) o;

            if (this.acmCertificateArn != null ? !this.acmCertificateArn.equals(that.acmCertificateArn) : that.acmCertificateArn != null) return false;
            if (this.cloudfrontDefaultCertificate != null ? !this.cloudfrontDefaultCertificate.equals(that.cloudfrontDefaultCertificate) : that.cloudfrontDefaultCertificate != null) return false;
            if (this.iamCertificateId != null ? !this.iamCertificateId.equals(that.iamCertificateId) : that.iamCertificateId != null) return false;
            if (this.minimumProtocolVersion != null ? !this.minimumProtocolVersion.equals(that.minimumProtocolVersion) : that.minimumProtocolVersion != null) return false;
            return this.sslSupportMethod != null ? this.sslSupportMethod.equals(that.sslSupportMethod) : that.sslSupportMethod == null;
        }

        @Override
        public final int hashCode() {
            int result = this.acmCertificateArn != null ? this.acmCertificateArn.hashCode() : 0;
            result = 31 * result + (this.cloudfrontDefaultCertificate != null ? this.cloudfrontDefaultCertificate.hashCode() : 0);
            result = 31 * result + (this.iamCertificateId != null ? this.iamCertificateId.hashCode() : 0);
            result = 31 * result + (this.minimumProtocolVersion != null ? this.minimumProtocolVersion.hashCode() : 0);
            result = 31 * result + (this.sslSupportMethod != null ? this.sslSupportMethod.hashCode() : 0);
            return result;
        }
    }
}
