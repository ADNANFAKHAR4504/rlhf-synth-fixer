package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting.Jsii$Proxy.class)
public interface CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_bucket_name CustomerprofilesDomain#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_key_name CustomerprofilesDomain#s3_key_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KeyName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting> {
        java.lang.String s3BucketName;
        java.lang.String s3KeyName;

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_bucket_name CustomerprofilesDomain#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting#getS3KeyName}
         * @param s3KeyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#s3_key_name CustomerprofilesDomain#s3_key_name}.
         * @return {@code this}
         */
        public Builder s3KeyName(java.lang.String s3KeyName) {
            this.s3KeyName = s3KeyName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting {
        private final java.lang.String s3BucketName;
        private final java.lang.String s3KeyName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3KeyName = software.amazon.jsii.Kernel.get(this, "s3KeyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.s3KeyName = builder.s3KeyName;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getS3KeyName() {
            return this.s3KeyName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            if (this.getS3KeyName() != null) {
                data.set("s3KeyName", om.valueToTree(this.getS3KeyName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting.Jsii$Proxy that = (CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting.Jsii$Proxy) o;

            if (!s3BucketName.equals(that.s3BucketName)) return false;
            return this.s3KeyName != null ? this.s3KeyName.equals(that.s3KeyName) : that.s3KeyName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3BucketName.hashCode();
            result = 31 * result + (this.s3KeyName != null ? this.s3KeyName.hashCode() : 0);
            return result;
        }
    }
}
