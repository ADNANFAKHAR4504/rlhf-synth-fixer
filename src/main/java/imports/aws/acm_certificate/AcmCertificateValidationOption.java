package imports.aws.acm_certificate;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.892Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmCertificate.AcmCertificateValidationOption")
@software.amazon.jsii.Jsii.Proxy(AcmCertificateValidationOption.Jsii$Proxy.class)
public interface AcmCertificateValidationOption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#domain_name AcmCertificate#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#validation_domain AcmCertificate#validation_domain}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValidationDomain();

    /**
     * @return a {@link Builder} of {@link AcmCertificateValidationOption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AcmCertificateValidationOption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AcmCertificateValidationOption> {
        java.lang.String domainName;
        java.lang.String validationDomain;

        /**
         * Sets the value of {@link AcmCertificateValidationOption#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#domain_name AcmCertificate#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateValidationOption#getValidationDomain}
         * @param validationDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#validation_domain AcmCertificate#validation_domain}. This parameter is required.
         * @return {@code this}
         */
        public Builder validationDomain(java.lang.String validationDomain) {
            this.validationDomain = validationDomain;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AcmCertificateValidationOption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AcmCertificateValidationOption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AcmCertificateValidationOption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AcmCertificateValidationOption {
        private final java.lang.String domainName;
        private final java.lang.String validationDomain;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.validationDomain = software.amazon.jsii.Kernel.get(this, "validationDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.validationDomain = java.util.Objects.requireNonNull(builder.validationDomain, "validationDomain is required");
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getValidationDomain() {
            return this.validationDomain;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domainName", om.valueToTree(this.getDomainName()));
            data.set("validationDomain", om.valueToTree(this.getValidationDomain()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.acmCertificate.AcmCertificateValidationOption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AcmCertificateValidationOption.Jsii$Proxy that = (AcmCertificateValidationOption.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            return this.validationDomain.equals(that.validationDomain);
        }

        @Override
        public final int hashCode() {
            int result = this.domainName.hashCode();
            result = 31 * result + (this.validationDomain.hashCode());
            return result;
        }
    }
}
