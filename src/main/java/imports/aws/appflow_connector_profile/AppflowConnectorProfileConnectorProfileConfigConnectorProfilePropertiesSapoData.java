package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#application_host_url AppflowConnectorProfile#application_host_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApplicationHostUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#application_service_path AppflowConnectorProfile#application_service_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApplicationServicePath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#client_number AppflowConnectorProfile#client_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#port_number AppflowConnectorProfile#port_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPortNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#logon_language AppflowConnectorProfile#logon_language}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogonLanguage() {
        return null;
    }

    /**
     * oauth_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_properties AppflowConnectorProfile#oauth_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties getOauthProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#private_link_service_name AppflowConnectorProfile#private_link_service_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateLinkServiceName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData> {
        java.lang.String applicationHostUrl;
        java.lang.String applicationServicePath;
        java.lang.String clientNumber;
        java.lang.Number portNumber;
        java.lang.String logonLanguage;
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties oauthProperties;
        java.lang.String privateLinkServiceName;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData#getApplicationHostUrl}
         * @param applicationHostUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#application_host_url AppflowConnectorProfile#application_host_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder applicationHostUrl(java.lang.String applicationHostUrl) {
            this.applicationHostUrl = applicationHostUrl;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData#getApplicationServicePath}
         * @param applicationServicePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#application_service_path AppflowConnectorProfile#application_service_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder applicationServicePath(java.lang.String applicationServicePath) {
            this.applicationServicePath = applicationServicePath;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData#getClientNumber}
         * @param clientNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#client_number AppflowConnectorProfile#client_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientNumber(java.lang.String clientNumber) {
            this.clientNumber = clientNumber;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData#getPortNumber}
         * @param portNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#port_number AppflowConnectorProfile#port_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder portNumber(java.lang.Number portNumber) {
            this.portNumber = portNumber;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData#getLogonLanguage}
         * @param logonLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#logon_language AppflowConnectorProfile#logon_language}.
         * @return {@code this}
         */
        public Builder logonLanguage(java.lang.String logonLanguage) {
            this.logonLanguage = logonLanguage;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData#getOauthProperties}
         * @param oauthProperties oauth_properties block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_properties AppflowConnectorProfile#oauth_properties}
         * @return {@code this}
         */
        public Builder oauthProperties(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties oauthProperties) {
            this.oauthProperties = oauthProperties;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData#getPrivateLinkServiceName}
         * @param privateLinkServiceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#private_link_service_name AppflowConnectorProfile#private_link_service_name}.
         * @return {@code this}
         */
        public Builder privateLinkServiceName(java.lang.String privateLinkServiceName) {
            this.privateLinkServiceName = privateLinkServiceName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData {
        private final java.lang.String applicationHostUrl;
        private final java.lang.String applicationServicePath;
        private final java.lang.String clientNumber;
        private final java.lang.Number portNumber;
        private final java.lang.String logonLanguage;
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties oauthProperties;
        private final java.lang.String privateLinkServiceName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.applicationHostUrl = software.amazon.jsii.Kernel.get(this, "applicationHostUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applicationServicePath = software.amazon.jsii.Kernel.get(this, "applicationServicePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientNumber = software.amazon.jsii.Kernel.get(this, "clientNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.portNumber = software.amazon.jsii.Kernel.get(this, "portNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.logonLanguage = software.amazon.jsii.Kernel.get(this, "logonLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.oauthProperties = software.amazon.jsii.Kernel.get(this, "oauthProperties", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties.class));
            this.privateLinkServiceName = software.amazon.jsii.Kernel.get(this, "privateLinkServiceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.applicationHostUrl = java.util.Objects.requireNonNull(builder.applicationHostUrl, "applicationHostUrl is required");
            this.applicationServicePath = java.util.Objects.requireNonNull(builder.applicationServicePath, "applicationServicePath is required");
            this.clientNumber = java.util.Objects.requireNonNull(builder.clientNumber, "clientNumber is required");
            this.portNumber = java.util.Objects.requireNonNull(builder.portNumber, "portNumber is required");
            this.logonLanguage = builder.logonLanguage;
            this.oauthProperties = builder.oauthProperties;
            this.privateLinkServiceName = builder.privateLinkServiceName;
        }

        @Override
        public final java.lang.String getApplicationHostUrl() {
            return this.applicationHostUrl;
        }

        @Override
        public final java.lang.String getApplicationServicePath() {
            return this.applicationServicePath;
        }

        @Override
        public final java.lang.String getClientNumber() {
            return this.clientNumber;
        }

        @Override
        public final java.lang.Number getPortNumber() {
            return this.portNumber;
        }

        @Override
        public final java.lang.String getLogonLanguage() {
            return this.logonLanguage;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoDataOauthProperties getOauthProperties() {
            return this.oauthProperties;
        }

        @Override
        public final java.lang.String getPrivateLinkServiceName() {
            return this.privateLinkServiceName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("applicationHostUrl", om.valueToTree(this.getApplicationHostUrl()));
            data.set("applicationServicePath", om.valueToTree(this.getApplicationServicePath()));
            data.set("clientNumber", om.valueToTree(this.getClientNumber()));
            data.set("portNumber", om.valueToTree(this.getPortNumber()));
            if (this.getLogonLanguage() != null) {
                data.set("logonLanguage", om.valueToTree(this.getLogonLanguage()));
            }
            if (this.getOauthProperties() != null) {
                data.set("oauthProperties", om.valueToTree(this.getOauthProperties()));
            }
            if (this.getPrivateLinkServiceName() != null) {
                data.set("privateLinkServiceName", om.valueToTree(this.getPrivateLinkServiceName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSapoData.Jsii$Proxy) o;

            if (!applicationHostUrl.equals(that.applicationHostUrl)) return false;
            if (!applicationServicePath.equals(that.applicationServicePath)) return false;
            if (!clientNumber.equals(that.clientNumber)) return false;
            if (!portNumber.equals(that.portNumber)) return false;
            if (this.logonLanguage != null ? !this.logonLanguage.equals(that.logonLanguage) : that.logonLanguage != null) return false;
            if (this.oauthProperties != null ? !this.oauthProperties.equals(that.oauthProperties) : that.oauthProperties != null) return false;
            return this.privateLinkServiceName != null ? this.privateLinkServiceName.equals(that.privateLinkServiceName) : that.privateLinkServiceName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.applicationHostUrl.hashCode();
            result = 31 * result + (this.applicationServicePath.hashCode());
            result = 31 * result + (this.clientNumber.hashCode());
            result = 31 * result + (this.portNumber.hashCode());
            result = 31 * result + (this.logonLanguage != null ? this.logonLanguage.hashCode() : 0);
            result = 31 * result + (this.oauthProperties != null ? this.oauthProperties.hashCode() : 0);
            result = 31 * result + (this.privateLinkServiceName != null ? this.privateLinkServiceName.hashCode() : 0);
            return result;
        }
    }
}
