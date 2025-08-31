package imports.aws.imagebuilder_infrastructure_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationLoggingS3Logs")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderInfrastructureConfigurationLoggingS3Logs.Jsii$Proxy.class)
public interface ImagebuilderInfrastructureConfigurationLoggingS3Logs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#s3_bucket_name ImagebuilderInfrastructureConfiguration#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#s3_key_prefix ImagebuilderInfrastructureConfiguration#s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderInfrastructureConfigurationLoggingS3Logs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderInfrastructureConfigurationLoggingS3Logs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderInfrastructureConfigurationLoggingS3Logs> {
        java.lang.String s3BucketName;
        java.lang.String s3KeyPrefix;

        /**
         * Sets the value of {@link ImagebuilderInfrastructureConfigurationLoggingS3Logs#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#s3_bucket_name ImagebuilderInfrastructureConfiguration#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderInfrastructureConfigurationLoggingS3Logs#getS3KeyPrefix}
         * @param s3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#s3_key_prefix ImagebuilderInfrastructureConfiguration#s3_key_prefix}.
         * @return {@code this}
         */
        public Builder s3KeyPrefix(java.lang.String s3KeyPrefix) {
            this.s3KeyPrefix = s3KeyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderInfrastructureConfigurationLoggingS3Logs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderInfrastructureConfigurationLoggingS3Logs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderInfrastructureConfigurationLoggingS3Logs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderInfrastructureConfigurationLoggingS3Logs {
        private final java.lang.String s3BucketName;
        private final java.lang.String s3KeyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3KeyPrefix = software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.s3KeyPrefix = builder.s3KeyPrefix;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getS3KeyPrefix() {
            return this.s3KeyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            if (this.getS3KeyPrefix() != null) {
                data.set("s3KeyPrefix", om.valueToTree(this.getS3KeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationLoggingS3Logs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderInfrastructureConfigurationLoggingS3Logs.Jsii$Proxy that = (ImagebuilderInfrastructureConfigurationLoggingS3Logs.Jsii$Proxy) o;

            if (!s3BucketName.equals(that.s3BucketName)) return false;
            return this.s3KeyPrefix != null ? this.s3KeyPrefix.equals(that.s3KeyPrefix) : that.s3KeyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3BucketName.hashCode();
            result = 31 * result + (this.s3KeyPrefix != null ? this.s3KeyPrefix.hashCode() : 0);
            return result;
        }
    }
}
