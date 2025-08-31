package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.014Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowSourceFlowConfig.Jsii$Proxy.class)
public interface AppflowFlowSourceFlowConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_type AppflowFlow#connector_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectorType();

    /**
     * source_connector_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#source_connector_properties AppflowFlow#source_connector_properties}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorProperties getSourceConnectorProperties();

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
     * incremental_pull_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#incremental_pull_config AppflowFlow#incremental_pull_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigIncrementalPullConfig getIncrementalPullConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowSourceFlowConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowSourceFlowConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowSourceFlowConfig> {
        java.lang.String connectorType;
        imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorProperties sourceConnectorProperties;
        java.lang.String apiVersion;
        java.lang.String connectorProfileName;
        imports.aws.appflow_flow.AppflowFlowSourceFlowConfigIncrementalPullConfig incrementalPullConfig;

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfig#getConnectorType}
         * @param connectorType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_type AppflowFlow#connector_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectorType(java.lang.String connectorType) {
            this.connectorType = connectorType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfig#getSourceConnectorProperties}
         * @param sourceConnectorProperties source_connector_properties block. This parameter is required.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#source_connector_properties AppflowFlow#source_connector_properties}
         * @return {@code this}
         */
        public Builder sourceConnectorProperties(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorProperties sourceConnectorProperties) {
            this.sourceConnectorProperties = sourceConnectorProperties;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfig#getApiVersion}
         * @param apiVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#api_version AppflowFlow#api_version}.
         * @return {@code this}
         */
        public Builder apiVersion(java.lang.String apiVersion) {
            this.apiVersion = apiVersion;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfig#getConnectorProfileName}
         * @param connectorProfileName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_profile_name AppflowFlow#connector_profile_name}.
         * @return {@code this}
         */
        public Builder connectorProfileName(java.lang.String connectorProfileName) {
            this.connectorProfileName = connectorProfileName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfig#getIncrementalPullConfig}
         * @param incrementalPullConfig incremental_pull_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#incremental_pull_config AppflowFlow#incremental_pull_config}
         * @return {@code this}
         */
        public Builder incrementalPullConfig(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigIncrementalPullConfig incrementalPullConfig) {
            this.incrementalPullConfig = incrementalPullConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowSourceFlowConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowSourceFlowConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowSourceFlowConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowSourceFlowConfig {
        private final java.lang.String connectorType;
        private final imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorProperties sourceConnectorProperties;
        private final java.lang.String apiVersion;
        private final java.lang.String connectorProfileName;
        private final imports.aws.appflow_flow.AppflowFlowSourceFlowConfigIncrementalPullConfig incrementalPullConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectorType = software.amazon.jsii.Kernel.get(this, "connectorType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceConnectorProperties = software.amazon.jsii.Kernel.get(this, "sourceConnectorProperties", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorProperties.class));
            this.apiVersion = software.amazon.jsii.Kernel.get(this, "apiVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectorProfileName = software.amazon.jsii.Kernel.get(this, "connectorProfileName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.incrementalPullConfig = software.amazon.jsii.Kernel.get(this, "incrementalPullConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigIncrementalPullConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectorType = java.util.Objects.requireNonNull(builder.connectorType, "connectorType is required");
            this.sourceConnectorProperties = java.util.Objects.requireNonNull(builder.sourceConnectorProperties, "sourceConnectorProperties is required");
            this.apiVersion = builder.apiVersion;
            this.connectorProfileName = builder.connectorProfileName;
            this.incrementalPullConfig = builder.incrementalPullConfig;
        }

        @Override
        public final java.lang.String getConnectorType() {
            return this.connectorType;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorProperties getSourceConnectorProperties() {
            return this.sourceConnectorProperties;
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
        public final imports.aws.appflow_flow.AppflowFlowSourceFlowConfigIncrementalPullConfig getIncrementalPullConfig() {
            return this.incrementalPullConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("connectorType", om.valueToTree(this.getConnectorType()));
            data.set("sourceConnectorProperties", om.valueToTree(this.getSourceConnectorProperties()));
            if (this.getApiVersion() != null) {
                data.set("apiVersion", om.valueToTree(this.getApiVersion()));
            }
            if (this.getConnectorProfileName() != null) {
                data.set("connectorProfileName", om.valueToTree(this.getConnectorProfileName()));
            }
            if (this.getIncrementalPullConfig() != null) {
                data.set("incrementalPullConfig", om.valueToTree(this.getIncrementalPullConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowSourceFlowConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowSourceFlowConfig.Jsii$Proxy that = (AppflowFlowSourceFlowConfig.Jsii$Proxy) o;

            if (!connectorType.equals(that.connectorType)) return false;
            if (!sourceConnectorProperties.equals(that.sourceConnectorProperties)) return false;
            if (this.apiVersion != null ? !this.apiVersion.equals(that.apiVersion) : that.apiVersion != null) return false;
            if (this.connectorProfileName != null ? !this.connectorProfileName.equals(that.connectorProfileName) : that.connectorProfileName != null) return false;
            return this.incrementalPullConfig != null ? this.incrementalPullConfig.equals(that.incrementalPullConfig) : that.incrementalPullConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectorType.hashCode();
            result = 31 * result + (this.sourceConnectorProperties.hashCode());
            result = 31 * result + (this.apiVersion != null ? this.apiVersion.hashCode() : 0);
            result = 31 * result + (this.connectorProfileName != null ? this.connectorProfileName.hashCode() : 0);
            result = 31 * result + (this.incrementalPullConfig != null ? this.incrementalPullConfig.hashCode() : 0);
            return result;
        }
    }
}
