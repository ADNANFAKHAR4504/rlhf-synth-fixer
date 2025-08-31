package imports.aws.bedrock_model_invocation_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.150Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config")
@software.amazon.jsii.Jsii.Proxy(BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config.Jsii$Proxy.class)
public interface BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#bucket_name BedrockModelInvocationLoggingConfiguration#bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#key_prefix BedrockModelInvocationLoggingConfiguration#key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config> {
        java.lang.String bucketName;
        java.lang.String keyPrefix;

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#bucket_name BedrockModelInvocationLoggingConfiguration#bucket_name}.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config#getKeyPrefix}
         * @param keyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#key_prefix BedrockModelInvocationLoggingConfiguration#key_prefix}.
         * @return {@code this}
         */
        public Builder keyPrefix(java.lang.String keyPrefix) {
            this.keyPrefix = keyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config {
        private final java.lang.String bucketName;
        private final java.lang.String keyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPrefix = software.amazon.jsii.Kernel.get(this, "keyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = builder.bucketName;
            this.keyPrefix = builder.keyPrefix;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getKeyPrefix() {
            return this.keyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucketName() != null) {
                data.set("bucketName", om.valueToTree(this.getBucketName()));
            }
            if (this.getKeyPrefix() != null) {
                data.set("keyPrefix", om.valueToTree(this.getKeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config.Jsii$Proxy that = (BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config.Jsii$Proxy) o;

            if (this.bucketName != null ? !this.bucketName.equals(that.bucketName) : that.bucketName != null) return false;
            return this.keyPrefix != null ? this.keyPrefix.equals(that.keyPrefix) : that.keyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName != null ? this.bucketName.hashCode() : 0;
            result = 31 * result + (this.keyPrefix != null ? this.keyPrefix.hashCode() : 0);
            return result;
        }
    }
}
