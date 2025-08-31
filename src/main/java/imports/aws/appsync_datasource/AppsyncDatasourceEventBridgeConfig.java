package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceEventBridgeConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceEventBridgeConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceEventBridgeConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#event_bus_arn AppsyncDatasource#event_bus_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEventBusArn();

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceEventBridgeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceEventBridgeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceEventBridgeConfig> {
        java.lang.String eventBusArn;

        /**
         * Sets the value of {@link AppsyncDatasourceEventBridgeConfig#getEventBusArn}
         * @param eventBusArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#event_bus_arn AppsyncDatasource#event_bus_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder eventBusArn(java.lang.String eventBusArn) {
            this.eventBusArn = eventBusArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceEventBridgeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceEventBridgeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceEventBridgeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceEventBridgeConfig {
        private final java.lang.String eventBusArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.eventBusArn = software.amazon.jsii.Kernel.get(this, "eventBusArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.eventBusArn = java.util.Objects.requireNonNull(builder.eventBusArn, "eventBusArn is required");
        }

        @Override
        public final java.lang.String getEventBusArn() {
            return this.eventBusArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("eventBusArn", om.valueToTree(this.getEventBusArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceEventBridgeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceEventBridgeConfig.Jsii$Proxy that = (AppsyncDatasourceEventBridgeConfig.Jsii$Proxy) o;

            return this.eventBusArn.equals(that.eventBusArn);
        }

        @Override
        public final int hashCode() {
            int result = this.eventBusArn.hashCode();
            return result;
        }
    }
}
