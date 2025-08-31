package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#prefix_type AppflowFlow#prefix_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrefixType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#prefix_format AppflowFlow#prefix_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefixFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#prefix_hierarchy AppflowFlow#prefix_hierarchy}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrefixHierarchy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig> {
        java.lang.String prefixType;
        java.lang.String prefixFormat;
        java.util.List<java.lang.String> prefixHierarchy;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig#getPrefixType}
         * @param prefixType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#prefix_type AppflowFlow#prefix_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder prefixType(java.lang.String prefixType) {
            this.prefixType = prefixType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig#getPrefixFormat}
         * @param prefixFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#prefix_format AppflowFlow#prefix_format}.
         * @return {@code this}
         */
        public Builder prefixFormat(java.lang.String prefixFormat) {
            this.prefixFormat = prefixFormat;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig#getPrefixHierarchy}
         * @param prefixHierarchy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#prefix_hierarchy AppflowFlow#prefix_hierarchy}.
         * @return {@code this}
         */
        public Builder prefixHierarchy(java.util.List<java.lang.String> prefixHierarchy) {
            this.prefixHierarchy = prefixHierarchy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig {
        private final java.lang.String prefixType;
        private final java.lang.String prefixFormat;
        private final java.util.List<java.lang.String> prefixHierarchy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.prefixType = software.amazon.jsii.Kernel.get(this, "prefixType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefixFormat = software.amazon.jsii.Kernel.get(this, "prefixFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefixHierarchy = software.amazon.jsii.Kernel.get(this, "prefixHierarchy", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.prefixType = java.util.Objects.requireNonNull(builder.prefixType, "prefixType is required");
            this.prefixFormat = builder.prefixFormat;
            this.prefixHierarchy = builder.prefixHierarchy;
        }

        @Override
        public final java.lang.String getPrefixType() {
            return this.prefixType;
        }

        @Override
        public final java.lang.String getPrefixFormat() {
            return this.prefixFormat;
        }

        @Override
        public final java.util.List<java.lang.String> getPrefixHierarchy() {
            return this.prefixHierarchy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("prefixType", om.valueToTree(this.getPrefixType()));
            if (this.getPrefixFormat() != null) {
                data.set("prefixFormat", om.valueToTree(this.getPrefixFormat()));
            }
            if (this.getPrefixHierarchy() != null) {
                data.set("prefixHierarchy", om.valueToTree(this.getPrefixHierarchy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig.Jsii$Proxy that = (AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig.Jsii$Proxy) o;

            if (!prefixType.equals(that.prefixType)) return false;
            if (this.prefixFormat != null ? !this.prefixFormat.equals(that.prefixFormat) : that.prefixFormat != null) return false;
            return this.prefixHierarchy != null ? this.prefixHierarchy.equals(that.prefixHierarchy) : that.prefixHierarchy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.prefixType.hashCode();
            result = 31 * result + (this.prefixFormat != null ? this.prefixFormat.hashCode() : 0);
            result = 31 * result + (this.prefixHierarchy != null ? this.prefixHierarchy.hashCode() : 0);
            return result;
        }
    }
}
