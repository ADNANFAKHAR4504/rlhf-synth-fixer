package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.003Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData extends software.amazon.jsii.JsiiSerializable {

    /**
     * basic_auth_credentials block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#basic_auth_credentials AppflowConnectorProfile#basic_auth_credentials}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataBasicAuthCredentials getBasicAuthCredentials() {
        return null;
    }

    /**
     * oauth_credentials block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_credentials AppflowConnectorProfile#oauth_credentials}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataOauthCredentials getOauthCredentials() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData> {
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataBasicAuthCredentials basicAuthCredentials;
        imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataOauthCredentials oauthCredentials;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData#getBasicAuthCredentials}
         * @param basicAuthCredentials basic_auth_credentials block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#basic_auth_credentials AppflowConnectorProfile#basic_auth_credentials}
         * @return {@code this}
         */
        public Builder basicAuthCredentials(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataBasicAuthCredentials basicAuthCredentials) {
            this.basicAuthCredentials = basicAuthCredentials;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData#getOauthCredentials}
         * @param oauthCredentials oauth_credentials block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#oauth_credentials AppflowConnectorProfile#oauth_credentials}
         * @return {@code this}
         */
        public Builder oauthCredentials(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataOauthCredentials oauthCredentials) {
            this.oauthCredentials = oauthCredentials;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData {
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataBasicAuthCredentials basicAuthCredentials;
        private final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataOauthCredentials oauthCredentials;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.basicAuthCredentials = software.amazon.jsii.Kernel.get(this, "basicAuthCredentials", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataBasicAuthCredentials.class));
            this.oauthCredentials = software.amazon.jsii.Kernel.get(this, "oauthCredentials", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataOauthCredentials.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.basicAuthCredentials = builder.basicAuthCredentials;
            this.oauthCredentials = builder.oauthCredentials;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataBasicAuthCredentials getBasicAuthCredentials() {
            return this.basicAuthCredentials;
        }

        @Override
        public final imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoDataOauthCredentials getOauthCredentials() {
            return this.oauthCredentials;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBasicAuthCredentials() != null) {
                data.set("basicAuthCredentials", om.valueToTree(this.getBasicAuthCredentials()));
            }
            if (this.getOauthCredentials() != null) {
                data.set("oauthCredentials", om.valueToTree(this.getOauthCredentials()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsSapoData.Jsii$Proxy) o;

            if (this.basicAuthCredentials != null ? !this.basicAuthCredentials.equals(that.basicAuthCredentials) : that.basicAuthCredentials != null) return false;
            return this.oauthCredentials != null ? this.oauthCredentials.equals(that.oauthCredentials) : that.oauthCredentials == null;
        }

        @Override
        public final int hashCode() {
            int result = this.basicAuthCredentials != null ? this.basicAuthCredentials.hashCode() : 0;
            result = 31 * result + (this.oauthCredentials != null ? this.oauthCredentials.hashCode() : 0);
            return result;
        }
    }
}
