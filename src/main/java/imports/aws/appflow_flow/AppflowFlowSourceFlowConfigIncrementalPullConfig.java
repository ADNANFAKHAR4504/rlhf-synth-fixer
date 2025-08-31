package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.014Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigIncrementalPullConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowSourceFlowConfigIncrementalPullConfig.Jsii$Proxy.class)
public interface AppflowFlowSourceFlowConfigIncrementalPullConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#datetime_type_field_name AppflowFlow#datetime_type_field_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatetimeTypeFieldName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowSourceFlowConfigIncrementalPullConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowSourceFlowConfigIncrementalPullConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowSourceFlowConfigIncrementalPullConfig> {
        java.lang.String datetimeTypeFieldName;

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigIncrementalPullConfig#getDatetimeTypeFieldName}
         * @param datetimeTypeFieldName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#datetime_type_field_name AppflowFlow#datetime_type_field_name}.
         * @return {@code this}
         */
        public Builder datetimeTypeFieldName(java.lang.String datetimeTypeFieldName) {
            this.datetimeTypeFieldName = datetimeTypeFieldName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowSourceFlowConfigIncrementalPullConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowSourceFlowConfigIncrementalPullConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowSourceFlowConfigIncrementalPullConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowSourceFlowConfigIncrementalPullConfig {
        private final java.lang.String datetimeTypeFieldName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.datetimeTypeFieldName = software.amazon.jsii.Kernel.get(this, "datetimeTypeFieldName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.datetimeTypeFieldName = builder.datetimeTypeFieldName;
        }

        @Override
        public final java.lang.String getDatetimeTypeFieldName() {
            return this.datetimeTypeFieldName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDatetimeTypeFieldName() != null) {
                data.set("datetimeTypeFieldName", om.valueToTree(this.getDatetimeTypeFieldName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowSourceFlowConfigIncrementalPullConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowSourceFlowConfigIncrementalPullConfig.Jsii$Proxy that = (AppflowFlowSourceFlowConfigIncrementalPullConfig.Jsii$Proxy) o;

            return this.datetimeTypeFieldName != null ? this.datetimeTypeFieldName.equals(that.datetimeTypeFieldName) : that.datetimeTypeFieldName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.datetimeTypeFieldName != null ? this.datetimeTypeFieldName.hashCode() : 0;
            return result;
        }
    }
}
