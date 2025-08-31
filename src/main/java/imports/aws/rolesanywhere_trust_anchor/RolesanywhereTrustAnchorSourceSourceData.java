package imports.aws.rolesanywhere_trust_anchor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.194Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rolesanywhereTrustAnchor.RolesanywhereTrustAnchorSourceSourceData")
@software.amazon.jsii.Jsii.Proxy(RolesanywhereTrustAnchorSourceSourceData.Jsii$Proxy.class)
public interface RolesanywhereTrustAnchorSourceSourceData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#acm_pca_arn RolesanywhereTrustAnchor#acm_pca_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcmPcaArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#x509_certificate_data RolesanywhereTrustAnchor#x509_certificate_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getX509CertificateData() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RolesanywhereTrustAnchorSourceSourceData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RolesanywhereTrustAnchorSourceSourceData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RolesanywhereTrustAnchorSourceSourceData> {
        java.lang.String acmPcaArn;
        java.lang.String x509CertificateData;

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorSourceSourceData#getAcmPcaArn}
         * @param acmPcaArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#acm_pca_arn RolesanywhereTrustAnchor#acm_pca_arn}.
         * @return {@code this}
         */
        public Builder acmPcaArn(java.lang.String acmPcaArn) {
            this.acmPcaArn = acmPcaArn;
            return this;
        }

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorSourceSourceData#getX509CertificateData}
         * @param x509CertificateData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#x509_certificate_data RolesanywhereTrustAnchor#x509_certificate_data}.
         * @return {@code this}
         */
        public Builder x509CertificateData(java.lang.String x509CertificateData) {
            this.x509CertificateData = x509CertificateData;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RolesanywhereTrustAnchorSourceSourceData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RolesanywhereTrustAnchorSourceSourceData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RolesanywhereTrustAnchorSourceSourceData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RolesanywhereTrustAnchorSourceSourceData {
        private final java.lang.String acmPcaArn;
        private final java.lang.String x509CertificateData;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.acmPcaArn = software.amazon.jsii.Kernel.get(this, "acmPcaArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.x509CertificateData = software.amazon.jsii.Kernel.get(this, "x509CertificateData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.acmPcaArn = builder.acmPcaArn;
            this.x509CertificateData = builder.x509CertificateData;
        }

        @Override
        public final java.lang.String getAcmPcaArn() {
            return this.acmPcaArn;
        }

        @Override
        public final java.lang.String getX509CertificateData() {
            return this.x509CertificateData;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAcmPcaArn() != null) {
                data.set("acmPcaArn", om.valueToTree(this.getAcmPcaArn()));
            }
            if (this.getX509CertificateData() != null) {
                data.set("x509CertificateData", om.valueToTree(this.getX509CertificateData()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rolesanywhereTrustAnchor.RolesanywhereTrustAnchorSourceSourceData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RolesanywhereTrustAnchorSourceSourceData.Jsii$Proxy that = (RolesanywhereTrustAnchorSourceSourceData.Jsii$Proxy) o;

            if (this.acmPcaArn != null ? !this.acmPcaArn.equals(that.acmPcaArn) : that.acmPcaArn != null) return false;
            return this.x509CertificateData != null ? this.x509CertificateData.equals(that.x509CertificateData) : that.x509CertificateData == null;
        }

        @Override
        public final int hashCode() {
            int result = this.acmPcaArn != null ? this.acmPcaArn.hashCode() : 0;
            result = 31 * result + (this.x509CertificateData != null ? this.x509CertificateData.hashCode() : 0);
            return result;
        }
    }
}
