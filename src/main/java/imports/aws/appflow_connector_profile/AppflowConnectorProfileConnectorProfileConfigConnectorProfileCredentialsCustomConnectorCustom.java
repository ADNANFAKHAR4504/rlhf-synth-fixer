package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.001Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#custom_authentication_type AppflowConnectorProfile#custom_authentication_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomAuthenticationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#credentials_map AppflowConnectorProfile#credentials_map}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getCredentialsMap() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom> {
        java.lang.String customAuthenticationType;
        java.util.Map<java.lang.String, java.lang.String> credentialsMap;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom#getCustomAuthenticationType}
         * @param customAuthenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#custom_authentication_type AppflowConnectorProfile#custom_authentication_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder customAuthenticationType(java.lang.String customAuthenticationType) {
            this.customAuthenticationType = customAuthenticationType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom#getCredentialsMap}
         * @param credentialsMap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#credentials_map AppflowConnectorProfile#credentials_map}.
         * @return {@code this}
         */
        public Builder credentialsMap(java.util.Map<java.lang.String, java.lang.String> credentialsMap) {
            this.credentialsMap = credentialsMap;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom {
        private final java.lang.String customAuthenticationType;
        private final java.util.Map<java.lang.String, java.lang.String> credentialsMap;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customAuthenticationType = software.amazon.jsii.Kernel.get(this, "customAuthenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentialsMap = software.amazon.jsii.Kernel.get(this, "credentialsMap", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customAuthenticationType = java.util.Objects.requireNonNull(builder.customAuthenticationType, "customAuthenticationType is required");
            this.credentialsMap = builder.credentialsMap;
        }

        @Override
        public final java.lang.String getCustomAuthenticationType() {
            return this.customAuthenticationType;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getCredentialsMap() {
            return this.credentialsMap;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("customAuthenticationType", om.valueToTree(this.getCustomAuthenticationType()));
            if (this.getCredentialsMap() != null) {
                data.set("credentialsMap", om.valueToTree(this.getCredentialsMap()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsCustomConnectorCustom.Jsii$Proxy) o;

            if (!customAuthenticationType.equals(that.customAuthenticationType)) return false;
            return this.credentialsMap != null ? this.credentialsMap.equals(that.credentialsMap) : that.credentialsMap == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customAuthenticationType.hashCode();
            result = 31 * result + (this.credentialsMap != null ? this.credentialsMap.hashCode() : 0);
            return result;
        }
    }
}
