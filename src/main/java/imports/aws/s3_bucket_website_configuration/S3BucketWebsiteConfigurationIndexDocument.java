package imports.aws.s3_bucket_website_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.273Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationIndexDocument")
@software.amazon.jsii.Jsii.Proxy(S3BucketWebsiteConfigurationIndexDocument.Jsii$Proxy.class)
public interface S3BucketWebsiteConfigurationIndexDocument extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#suffix S3BucketWebsiteConfiguration#suffix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSuffix();

    /**
     * @return a {@link Builder} of {@link S3BucketWebsiteConfigurationIndexDocument}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketWebsiteConfigurationIndexDocument}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketWebsiteConfigurationIndexDocument> {
        java.lang.String suffix;

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationIndexDocument#getSuffix}
         * @param suffix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#suffix S3BucketWebsiteConfiguration#suffix}. This parameter is required.
         * @return {@code this}
         */
        public Builder suffix(java.lang.String suffix) {
            this.suffix = suffix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketWebsiteConfigurationIndexDocument}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketWebsiteConfigurationIndexDocument build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketWebsiteConfigurationIndexDocument}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketWebsiteConfigurationIndexDocument {
        private final java.lang.String suffix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.suffix = software.amazon.jsii.Kernel.get(this, "suffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.suffix = java.util.Objects.requireNonNull(builder.suffix, "suffix is required");
        }

        @Override
        public final java.lang.String getSuffix() {
            return this.suffix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("suffix", om.valueToTree(this.getSuffix()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationIndexDocument"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketWebsiteConfigurationIndexDocument.Jsii$Proxy that = (S3BucketWebsiteConfigurationIndexDocument.Jsii$Proxy) o;

            return this.suffix.equals(that.suffix);
        }

        @Override
        public final int hashCode() {
            int result = this.suffix.hashCode();
            return result;
        }
    }
}
