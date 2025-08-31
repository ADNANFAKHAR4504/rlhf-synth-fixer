package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig.Jsii$Proxy.class)
public interface AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#max_page_size AppflowFlow#max_page_size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxPageSize();

    /**
     * @return a {@link Builder} of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig> {
        java.lang.Number maxPageSize;

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig#getMaxPageSize}
         * @param maxPageSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#max_page_size AppflowFlow#max_page_size}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxPageSize(java.lang.Number maxPageSize) {
            this.maxPageSize = maxPageSize;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig {
        private final java.lang.Number maxPageSize;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxPageSize = software.amazon.jsii.Kernel.get(this, "maxPageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxPageSize = java.util.Objects.requireNonNull(builder.maxPageSize, "maxPageSize is required");
        }

        @Override
        public final java.lang.Number getMaxPageSize() {
            return this.maxPageSize;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxPageSize", om.valueToTree(this.getMaxPageSize()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig.Jsii$Proxy that = (AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig.Jsii$Proxy) o;

            return this.maxPageSize.equals(that.maxPageSize);
        }

        @Override
        public final int hashCode() {
            int result = this.maxPageSize.hashCode();
            return result;
        }
    }
}
