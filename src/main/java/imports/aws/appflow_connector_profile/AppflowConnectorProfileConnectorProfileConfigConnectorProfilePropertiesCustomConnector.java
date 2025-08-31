package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector extends software.amazon.jsii.JsiiSerializable {

    /**
     * oauth2_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth2_properties AppflowConnectorProfile#oauth2_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties getOauth2Properties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#profile_properties AppflowConnectorProfile#profile_properties}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getProfileProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector> {
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties oauth2Properties;
        java.util.Map<java.lang.String, java.lang.String> profileProperties;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector#getOauth2Properties}
         * @param oauth2Properties oauth2_properties block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth2_properties AppflowConnectorProfile#oauth2_properties}
         * @return {@code this}
         */
        public Builder oauth2Properties(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties oauth2Properties) {
            this.oauth2Properties = oauth2Properties;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector#getProfileProperties}
         * @param profileProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#profile_properties AppflowConnectorProfile#profile_properties}.
         * @return {@code this}
         */
        public Builder profileProperties(java.util.Map<java.lang.String, java.lang.String> profileProperties) {
            this.profileProperties = profileProperties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector {
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties oauth2Properties;
        private final java.util.Map<java.lang.String, java.lang.String> profileProperties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.oauth2Properties = software.amazon.jsii.Kernel.get(this, "oauth2Properties", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties.class));
            this.profileProperties = software.amazon.jsii.Kernel.get(this, "profileProperties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.oauth2Properties = builder.oauth2Properties;
            this.profileProperties = builder.profileProperties;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnectorOauth2Properties getOauth2Properties() {
            return this.oauth2Properties;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getProfileProperties() {
            return this.profileProperties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOauth2Properties() != null) {
                data.set("oauth2Properties", om.valueToTree(this.getOauth2Properties()));
            }
            if (this.getProfileProperties() != null) {
                data.set("profileProperties", om.valueToTree(this.getProfileProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesCustomConnector.Jsii$Proxy) o;

            if (this.oauth2Properties != null ? !this.oauth2Properties.equals(that.oauth2Properties) : that.oauth2Properties != null) return false;
            return this.profileProperties != null ? this.profileProperties.equals(that.profileProperties) : that.profileProperties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.oauth2Properties != null ? this.oauth2Properties.hashCode() : 0;
            result = 31 * result + (this.profileProperties != null ? this.profileProperties.hashCode() : 0);
            return result;
        }
    }
}
