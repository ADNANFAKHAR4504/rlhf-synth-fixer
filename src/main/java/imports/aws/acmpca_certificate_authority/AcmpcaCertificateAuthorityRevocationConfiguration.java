package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.896Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityRevocationConfiguration")
@software.amazon.jsii.Jsii.Proxy(AcmpcaCertificateAuthorityRevocationConfiguration.Jsii$Proxy.class)
public interface AcmpcaCertificateAuthorityRevocationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * crl_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#crl_configuration AcmpcaCertificateAuthority#crl_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration getCrlConfiguration() {
        return null;
    }

    /**
     * ocsp_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#ocsp_configuration AcmpcaCertificateAuthority#ocsp_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration getOcspConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AcmpcaCertificateAuthorityRevocationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AcmpcaCertificateAuthorityRevocationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AcmpcaCertificateAuthorityRevocationConfiguration> {
        imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration crlConfiguration;
        imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration ocspConfiguration;

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfiguration#getCrlConfiguration}
         * @param crlConfiguration crl_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#crl_configuration AcmpcaCertificateAuthority#crl_configuration}
         * @return {@code this}
         */
        public Builder crlConfiguration(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration crlConfiguration) {
            this.crlConfiguration = crlConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfiguration#getOcspConfiguration}
         * @param ocspConfiguration ocsp_configuration block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#ocsp_configuration AcmpcaCertificateAuthority#ocsp_configuration}
         * @return {@code this}
         */
        public Builder ocspConfiguration(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration ocspConfiguration) {
            this.ocspConfiguration = ocspConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AcmpcaCertificateAuthorityRevocationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AcmpcaCertificateAuthorityRevocationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AcmpcaCertificateAuthorityRevocationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AcmpcaCertificateAuthorityRevocationConfiguration {
        private final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration crlConfiguration;
        private final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration ocspConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.crlConfiguration = software.amazon.jsii.Kernel.get(this, "crlConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration.class));
            this.ocspConfiguration = software.amazon.jsii.Kernel.get(this, "ocspConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.crlConfiguration = builder.crlConfiguration;
            this.ocspConfiguration = builder.ocspConfiguration;
        }

        @Override
        public final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration getCrlConfiguration() {
            return this.crlConfiguration;
        }

        @Override
        public final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOcspConfiguration getOcspConfiguration() {
            return this.ocspConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCrlConfiguration() != null) {
                data.set("crlConfiguration", om.valueToTree(this.getCrlConfiguration()));
            }
            if (this.getOcspConfiguration() != null) {
                data.set("ocspConfiguration", om.valueToTree(this.getOcspConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityRevocationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AcmpcaCertificateAuthorityRevocationConfiguration.Jsii$Proxy that = (AcmpcaCertificateAuthorityRevocationConfiguration.Jsii$Proxy) o;

            if (this.crlConfiguration != null ? !this.crlConfiguration.equals(that.crlConfiguration) : that.crlConfiguration != null) return false;
            return this.ocspConfiguration != null ? this.ocspConfiguration.equals(that.ocspConfiguration) : that.ocspConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.crlConfiguration != null ? this.crlConfiguration.hashCode() : 0;
            result = 31 * result + (this.ocspConfiguration != null ? this.ocspConfiguration.hashCode() : 0);
            return result;
        }
    }
}
