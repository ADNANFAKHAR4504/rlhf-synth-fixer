package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_name AppflowFlow#bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_prefix AppflowFlow#bucket_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig> {
        java.lang.String bucketName;
        java.lang.String bucketPrefix;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_name AppflowFlow#bucket_name}.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig#getBucketPrefix}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#bucket_prefix AppflowFlow#bucket_prefix}.
         * @return {@code this}
         */
        public Builder bucketPrefix(java.lang.String bucketPrefix) {
            this.bucketPrefix = bucketPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig {
        private final java.lang.String bucketName;
        private final java.lang.String bucketPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketPrefix = software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = builder.bucketName;
            this.bucketPrefix = builder.bucketPrefix;
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
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucketName() != null) {
                data.set("bucketName", om.valueToTree(this.getBucketName()));
            }
            if (this.getBucketPrefix() != null) {
                data.set("bucketPrefix", om.valueToTree(this.getBucketPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig.Jsii$Proxy that = (AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig.Jsii$Proxy) o;

            if (this.bucketName != null ? !this.bucketName.equals(that.bucketName) : that.bucketName != null) return false;
            return this.bucketPrefix != null ? this.bucketPrefix.equals(that.bucketPrefix) : that.bucketPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName != null ? this.bucketName.hashCode() : 0;
            result = 31 * result + (this.bucketPrefix != null ? this.bucketPrefix.hashCode() : 0);
            return result;
        }
    }
}
