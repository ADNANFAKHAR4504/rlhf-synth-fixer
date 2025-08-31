package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.008Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfig.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_type AppflowFlow#connector_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectorType();

    /**
     * destination_connector_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#destination_connector_properties AppflowFlow#destination_connector_properties}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties getDestinationConnectorProperties();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#api_version AppflowFlow#api_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApiVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_profile_name AppflowFlow#connector_profile_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectorProfileName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfig> {
        java.lang.String connectorType;
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties destinationConnectorProperties;
        java.lang.String apiVersion;
        java.lang.String connectorProfileName;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfig#getConnectorType}
         * @param connectorType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_type AppflowFlow#connector_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectorType(java.lang.String connectorType) {
            this.connectorType = connectorType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfig#getDestinationConnectorProperties}
         * @param destinationConnectorProperties destination_connector_properties block. This parameter is required.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#destination_connector_properties AppflowFlow#destination_connector_properties}
         * @return {@code this}
         */
        public Builder destinationConnectorProperties(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties destinationConnectorProperties) {
            this.destinationConnectorProperties = destinationConnectorProperties;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfig#getApiVersion}
         * @param apiVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#api_version AppflowFlow#api_version}.
         * @return {@code this}
         */
        public Builder apiVersion(java.lang.String apiVersion) {
            this.apiVersion = apiVersion;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfig#getConnectorProfileName}
         * @param connectorProfileName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_profile_name AppflowFlow#connector_profile_name}.
         * @return {@code this}
         */
        public Builder connectorProfileName(java.lang.String connectorProfileName) {
            this.connectorProfileName = connectorProfileName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfig {
        private final java.lang.String connectorType;
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties destinationConnectorProperties;
        private final java.lang.String apiVersion;
        private final java.lang.String connectorProfileName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectorType = software.amazon.jsii.Kernel.get(this, "connectorType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationConnectorProperties = software.amazon.jsii.Kernel.get(this, "destinationConnectorProperties", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties.class));
            this.apiVersion = software.amazon.jsii.Kernel.get(this, "apiVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectorProfileName = software.amazon.jsii.Kernel.get(this, "connectorProfileName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectorType = java.util.Objects.requireNonNull(builder.connectorType, "connectorType is required");
            this.destinationConnectorProperties = java.util.Objects.requireNonNull(builder.destinationConnectorProperties, "destinationConnectorProperties is required");
            this.apiVersion = builder.apiVersion;
            this.connectorProfileName = builder.connectorProfileName;
        }

        @Override
        public final java.lang.String getConnectorType() {
            return this.connectorType;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties getDestinationConnectorProperties() {
            return this.destinationConnectorProperties;
        }

        @Override
        public final java.lang.String getApiVersion() {
            return this.apiVersion;
        }

        @Override
        public final java.lang.String getConnectorProfileName() {
            return this.connectorProfileName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("connectorType", om.valueToTree(this.getConnectorType()));
            data.set("destinationConnectorProperties", om.valueToTree(this.getDestinationConnectorProperties()));
            if (this.getApiVersion() != null) {
                data.set("apiVersion", om.valueToTree(this.getApiVersion()));
            }
            if (this.getConnectorProfileName() != null) {
                data.set("connectorProfileName", om.valueToTree(this.getConnectorProfileName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfig.Jsii$Proxy that = (AppflowFlowDestinationFlowConfig.Jsii$Proxy) o;

            if (!connectorType.equals(that.connectorType)) return false;
            if (!destinationConnectorProperties.equals(that.destinationConnectorProperties)) return false;
            if (this.apiVersion != null ? !this.apiVersion.equals(that.apiVersion) : that.apiVersion != null) return false;
            return this.connectorProfileName != null ? this.connectorProfileName.equals(that.connectorProfileName) : that.connectorProfileName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectorType.hashCode();
            result = 31 * result + (this.destinationConnectorProperties.hashCode());
            result = 31 * result + (this.apiVersion != null ? this.apiVersion.hashCode() : 0);
            result = 31 * result + (this.connectorProfileName != null ? this.connectorProfileName.hashCode() : 0);
            return result;
        }
    }
}
