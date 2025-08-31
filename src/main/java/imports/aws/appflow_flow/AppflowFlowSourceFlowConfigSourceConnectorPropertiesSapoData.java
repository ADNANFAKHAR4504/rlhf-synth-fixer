package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData.Jsii$Proxy.class)
public interface AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object_path AppflowFlow#object_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObjectPath();

    /**
     * pagination_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#pagination_config AppflowFlow#pagination_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig getPaginationConfig() {
        return null;
    }

    /**
     * parallelism_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#parallelism_config AppflowFlow#parallelism_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig getParallelismConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData> {
        java.lang.String objectPath;
        imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig paginationConfig;
        imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig parallelismConfig;

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData#getObjectPath}
         * @param objectPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object_path AppflowFlow#object_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder objectPath(java.lang.String objectPath) {
            this.objectPath = objectPath;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData#getPaginationConfig}
         * @param paginationConfig pagination_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#pagination_config AppflowFlow#pagination_config}
         * @return {@code this}
         */
        public Builder paginationConfig(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig paginationConfig) {
            this.paginationConfig = paginationConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData#getParallelismConfig}
         * @param parallelismConfig parallelism_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#parallelism_config AppflowFlow#parallelism_config}
         * @return {@code this}
         */
        public Builder parallelismConfig(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig parallelismConfig) {
            this.parallelismConfig = parallelismConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData {
        private final java.lang.String objectPath;
        private final imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig paginationConfig;
        private final imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig parallelismConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.objectPath = software.amazon.jsii.Kernel.get(this, "objectPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.paginationConfig = software.amazon.jsii.Kernel.get(this, "paginationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig.class));
            this.parallelismConfig = software.amazon.jsii.Kernel.get(this, "parallelismConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.objectPath = java.util.Objects.requireNonNull(builder.objectPath, "objectPath is required");
            this.paginationConfig = builder.paginationConfig;
            this.parallelismConfig = builder.parallelismConfig;
        }

        @Override
        public final java.lang.String getObjectPath() {
            return this.objectPath;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig getPaginationConfig() {
            return this.paginationConfig;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig getParallelismConfig() {
            return this.parallelismConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("objectPath", om.valueToTree(this.getObjectPath()));
            if (this.getPaginationConfig() != null) {
                data.set("paginationConfig", om.valueToTree(this.getPaginationConfig()));
            }
            if (this.getParallelismConfig() != null) {
                data.set("parallelismConfig", om.valueToTree(this.getParallelismConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData.Jsii$Proxy that = (AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData.Jsii$Proxy) o;

            if (!objectPath.equals(that.objectPath)) return false;
            if (this.paginationConfig != null ? !this.paginationConfig.equals(that.paginationConfig) : that.paginationConfig != null) return false;
            return this.parallelismConfig != null ? this.parallelismConfig.equals(that.parallelismConfig) : that.parallelismConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.objectPath.hashCode();
            result = 31 * result + (this.paginationConfig != null ? this.paginationConfig.hashCode() : 0);
            result = 31 * result + (this.parallelismConfig != null ? this.parallelismConfig.hashCode() : 0);
            return result;
        }
    }
}
