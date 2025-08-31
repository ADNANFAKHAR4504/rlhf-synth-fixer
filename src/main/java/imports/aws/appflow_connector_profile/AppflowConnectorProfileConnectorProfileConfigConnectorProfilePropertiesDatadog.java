package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#instance_url AppflowConnectorProfile#instance_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceUrl();

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog> {
        java.lang.String instanceUrl;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog#getInstanceUrl}
         * @param instanceUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#instance_url AppflowConnectorProfile#instance_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceUrl(java.lang.String instanceUrl) {
            this.instanceUrl = instanceUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog {
        private final java.lang.String instanceUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceUrl = software.amazon.jsii.Kernel.get(this, "instanceUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceUrl = java.util.Objects.requireNonNull(builder.instanceUrl, "instanceUrl is required");
        }

        @Override
        public final java.lang.String getInstanceUrl() {
            return this.instanceUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("instanceUrl", om.valueToTree(this.getInstanceUrl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesDatadog.Jsii$Proxy) o;

            return this.instanceUrl.equals(that.instanceUrl);
        }

        @Override
        public final int hashCode() {
            int result = this.instanceUrl.hashCode();
            return result;
        }
    }
}
