package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_name AppflowFlow#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_prefix AppflowFlow#bucket_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefix() {
        return null;
    }

    /**
     * s3_output_format_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#s3_output_format_config AppflowFlow#s3_output_format_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig getS3OutputFormatConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3> {
        java.lang.String bucketName;
        java.lang.String bucketPrefix;
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig s3OutputFormatConfig;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_name AppflowFlow#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3#getBucketPrefix}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_prefix AppflowFlow#bucket_prefix}.
         * @return {@code this}
         */
        public Builder bucketPrefix(java.lang.String bucketPrefix) {
            this.bucketPrefix = bucketPrefix;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3#getS3OutputFormatConfig}
         * @param s3OutputFormatConfig s3_output_format_config block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#s3_output_format_config AppflowFlow#s3_output_format_config}
         * @return {@code this}
         */
        public Builder s3OutputFormatConfig(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig s3OutputFormatConfig) {
            this.s3OutputFormatConfig = s3OutputFormatConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3 {
        private final java.lang.String bucketName;
        private final java.lang.String bucketPrefix;
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig s3OutputFormatConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketPrefix = software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3OutputFormatConfig = software.amazon.jsii.Kernel.get(this, "s3OutputFormatConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.bucketPrefix = builder.bucketPrefix;
            this.s3OutputFormatConfig = builder.s3OutputFormatConfig;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getBucketPrefix() {
            return this.bucketPrefix;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig getS3OutputFormatConfig() {
            return this.s3OutputFormatConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            if (this.getBucketPrefix() != null) {
                data.set("bucketPrefix", om.valueToTree(this.getBucketPrefix()));
            }
            if (this.getS3OutputFormatConfig() != null) {
                data.set("s3OutputFormatConfig", om.valueToTree(this.getS3OutputFormatConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3.Jsii$Proxy that = (AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (this.bucketPrefix != null ? !this.bucketPrefix.equals(that.bucketPrefix) : that.bucketPrefix != null) return false;
            return this.s3OutputFormatConfig != null ? this.s3OutputFormatConfig.equals(that.s3OutputFormatConfig) : that.s3OutputFormatConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.bucketPrefix != null ? this.bucketPrefix.hashCode() : 0);
            result = 31 * result + (this.s3OutputFormatConfig != null ? this.s3OutputFormatConfig.hashCode() : 0);
            return result;
        }
    }
}
