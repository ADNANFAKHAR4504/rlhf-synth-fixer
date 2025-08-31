package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#intermediate_bucket_name AppflowFlow#intermediate_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIntermediateBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObject();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_prefix AppflowFlow#bucket_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefix() {
        return null;
    }

    /**
     * error_handling_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#error_handling_config AppflowFlow#error_handling_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflakeErrorHandlingConfig getErrorHandlingConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake> {
        java.lang.String intermediateBucketName;
        java.lang.String object;
        java.lang.String bucketPrefix;
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflakeErrorHandlingConfig errorHandlingConfig;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake#getIntermediateBucketName}
         * @param intermediateBucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#intermediate_bucket_name AppflowFlow#intermediate_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder intermediateBucketName(java.lang.String intermediateBucketName) {
            this.intermediateBucketName = intermediateBucketName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake#getObject}
         * @param object Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}. This parameter is required.
         * @return {@code this}
         */
        public Builder object(java.lang.String object) {
            this.object = object;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake#getBucketPrefix}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_prefix AppflowFlow#bucket_prefix}.
         * @return {@code this}
         */
        public Builder bucketPrefix(java.lang.String bucketPrefix) {
            this.bucketPrefix = bucketPrefix;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake#getErrorHandlingConfig}
         * @param errorHandlingConfig error_handling_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#error_handling_config AppflowFlow#error_handling_config}
         * @return {@code this}
         */
        public Builder errorHandlingConfig(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflakeErrorHandlingConfig errorHandlingConfig) {
            this.errorHandlingConfig = errorHandlingConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake {
        private final java.lang.String intermediateBucketName;
        private final java.lang.String object;
        private final java.lang.String bucketPrefix;
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflakeErrorHandlingConfig errorHandlingConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.intermediateBucketName = software.amazon.jsii.Kernel.get(this, "intermediateBucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.object = software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketPrefix = software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.errorHandlingConfig = software.amazon.jsii.Kernel.get(this, "errorHandlingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflakeErrorHandlingConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.intermediateBucketName = java.util.Objects.requireNonNull(builder.intermediateBucketName, "intermediateBucketName is required");
            this.object = java.util.Objects.requireNonNull(builder.object, "object is required");
            this.bucketPrefix = builder.bucketPrefix;
            this.errorHandlingConfig = builder.errorHandlingConfig;
        }

        @Override
        public final java.lang.String getIntermediateBucketName() {
            return this.intermediateBucketName;
        }

        @Override
        public final java.lang.String getObject() {
            return this.object;
        }

        @Override
        public final java.lang.String getBucketPrefix() {
            return this.bucketPrefix;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflakeErrorHandlingConfig getErrorHandlingConfig() {
            return this.errorHandlingConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("intermediateBucketName", om.valueToTree(this.getIntermediateBucketName()));
            data.set("object", om.valueToTree(this.getObject()));
            if (this.getBucketPrefix() != null) {
                data.set("bucketPrefix", om.valueToTree(this.getBucketPrefix()));
            }
            if (this.getErrorHandlingConfig() != null) {
                data.set("errorHandlingConfig", om.valueToTree(this.getErrorHandlingConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake.Jsii$Proxy that = (AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSnowflake.Jsii$Proxy) o;

            if (!intermediateBucketName.equals(that.intermediateBucketName)) return false;
            if (!object.equals(that.object)) return false;
            if (this.bucketPrefix != null ? !this.bucketPrefix.equals(that.bucketPrefix) : that.bucketPrefix != null) return false;
            return this.errorHandlingConfig != null ? this.errorHandlingConfig.equals(that.errorHandlingConfig) : that.errorHandlingConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.intermediateBucketName.hashCode();
            result = 31 * result + (this.object.hashCode());
            result = 31 * result + (this.bucketPrefix != null ? this.bucketPrefix.hashCode() : 0);
            result = 31 * result + (this.errorHandlingConfig != null ? this.errorHandlingConfig.hashCode() : 0);
            return result;
        }
    }
}
