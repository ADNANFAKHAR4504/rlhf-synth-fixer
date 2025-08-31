package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatchingExportingConfig")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainMatchingExportingConfig.Jsii$Proxy.class)
public interface CustomerprofilesDomainMatchingExportingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_exporting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_exporting CustomerprofilesDomain#s3_exporting}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfigS3Exporting getS3Exporting() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainMatchingExportingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainMatchingExportingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainMatchingExportingConfig> {
        imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfigS3Exporting s3Exporting;

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingExportingConfig#getS3Exporting}
         * @param s3Exporting s3_exporting block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_exporting CustomerprofilesDomain#s3_exporting}
         * @return {@code this}
         */
        public Builder s3Exporting(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfigS3Exporting s3Exporting) {
            this.s3Exporting = s3Exporting;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainMatchingExportingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainMatchingExportingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainMatchingExportingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainMatchingExportingConfig {
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfigS3Exporting s3Exporting;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Exporting = software.amazon.jsii.Kernel.get(this, "s3Exporting", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfigS3Exporting.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Exporting = builder.s3Exporting;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfigS3Exporting getS3Exporting() {
            return this.s3Exporting;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3Exporting() != null) {
                data.set("s3Exporting", om.valueToTree(this.getS3Exporting()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainMatchingExportingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainMatchingExportingConfig.Jsii$Proxy that = (CustomerprofilesDomainMatchingExportingConfig.Jsii$Proxy) o;

            return this.s3Exporting != null ? this.s3Exporting.equals(that.s3Exporting) : that.s3Exporting == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Exporting != null ? this.s3Exporting.hashCode() : 0;
            return result;
        }
    }
}
