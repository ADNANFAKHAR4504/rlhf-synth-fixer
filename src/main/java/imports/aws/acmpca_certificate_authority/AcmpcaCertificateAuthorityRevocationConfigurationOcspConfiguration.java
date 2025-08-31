package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.897Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration")
@software.amazon.jsii.Jsii.Proxy(AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration.Jsii$Proxy.class)
public interface AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#ocsp_custom_cname AcmpcaCertificateAuthority#ocsp_custom_cname}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOcspCustomCname() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration> {
        java.lang.Object enabled;
        java.lang.String ocspCustomCname;

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration#getOcspCustomCname}
         * @param ocspCustomCname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#ocsp_custom_cname AcmpcaCertificateAuthority#ocsp_custom_cname}.
         * @return {@code this}
         */
        public Builder ocspCustomCname(java.lang.String ocspCustomCname) {
            this.ocspCustomCname = ocspCustomCname;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration {
        private final java.lang.Object enabled;
        private final java.lang.String ocspCustomCname;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ocspCustomCname = software.amazon.jsii.Kernel.get(this, "ocspCustomCname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.ocspCustomCname = builder.ocspCustomCname;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getOcspCustomCname() {
            return this.ocspCustomCname;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getOcspCustomCname() != null) {
                data.set("ocspCustomCname", om.valueToTree(this.getOcspCustomCname()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration.Jsii$Proxy that = (AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            return this.ocspCustomCname != null ? this.ocspCustomCname.equals(that.ocspCustomCname) : that.ocspCustomCname == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.ocspCustomCname != null ? this.ocspCustomCname.hashCode() : 0);
            return result;
        }
    }
}
