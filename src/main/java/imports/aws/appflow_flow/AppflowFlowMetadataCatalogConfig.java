package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowMetadataCatalogConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowMetadataCatalogConfig.Jsii$Proxy.class)
public interface AppflowFlowMetadataCatalogConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * glue_data_catalog block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#glue_data_catalog AppflowFlow#glue_data_catalog}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfigGlueDataCatalog getGlueDataCatalog() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowMetadataCatalogConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowMetadataCatalogConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowMetadataCatalogConfig> {
        imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfigGlueDataCatalog glueDataCatalog;

        /**
         * Sets the value of {@link AppflowFlowMetadataCatalogConfig#getGlueDataCatalog}
         * @param glueDataCatalog glue_data_catalog block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#glue_data_catalog AppflowFlow#glue_data_catalog}
         * @return {@code this}
         */
        public Builder glueDataCatalog(imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfigGlueDataCatalog glueDataCatalog) {
            this.glueDataCatalog = glueDataCatalog;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowMetadataCatalogConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowMetadataCatalogConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowMetadataCatalogConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowMetadataCatalogConfig {
        private final imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfigGlueDataCatalog glueDataCatalog;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.glueDataCatalog = software.amazon.jsii.Kernel.get(this, "glueDataCatalog", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfigGlueDataCatalog.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.glueDataCatalog = builder.glueDataCatalog;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfigGlueDataCatalog getGlueDataCatalog() {
            return this.glueDataCatalog;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGlueDataCatalog() != null) {
                data.set("glueDataCatalog", om.valueToTree(this.getGlueDataCatalog()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowMetadataCatalogConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowMetadataCatalogConfig.Jsii$Proxy that = (AppflowFlowMetadataCatalogConfig.Jsii$Proxy) o;

            return this.glueDataCatalog != null ? this.glueDataCatalog.equals(that.glueDataCatalog) : that.glueDataCatalog == null;
        }

        @Override
        public final int hashCode() {
            int result = this.glueDataCatalog != null ? this.glueDataCatalog.hashCode() : 0;
            return result;
        }
    }
}
