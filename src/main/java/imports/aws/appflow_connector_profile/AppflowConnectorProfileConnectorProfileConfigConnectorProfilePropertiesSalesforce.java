package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#instance_url AppflowConnectorProfile#instance_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#is_sandbox_environment AppflowConnectorProfile#is_sandbox_environment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsSandboxEnvironment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#use_privatelink_for_metadata_and_authorization AppflowConnectorProfile#use_privatelink_for_metadata_and_authorization}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUsePrivatelinkForMetadataAndAuthorization() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce> {
        java.lang.String instanceUrl;
        java.lang.Object isSandboxEnvironment;
        java.lang.Object usePrivatelinkForMetadataAndAuthorization;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce#getInstanceUrl}
         * @param instanceUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#instance_url AppflowConnectorProfile#instance_url}.
         * @return {@code this}
         */
        public Builder instanceUrl(java.lang.String instanceUrl) {
            this.instanceUrl = instanceUrl;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce#getIsSandboxEnvironment}
         * @param isSandboxEnvironment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#is_sandbox_environment AppflowConnectorProfile#is_sandbox_environment}.
         * @return {@code this}
         */
        public Builder isSandboxEnvironment(java.lang.Boolean isSandboxEnvironment) {
            this.isSandboxEnvironment = isSandboxEnvironment;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce#getIsSandboxEnvironment}
         * @param isSandboxEnvironment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#is_sandbox_environment AppflowConnectorProfile#is_sandbox_environment}.
         * @return {@code this}
         */
        public Builder isSandboxEnvironment(com.hashicorp.cdktf.IResolvable isSandboxEnvironment) {
            this.isSandboxEnvironment = isSandboxEnvironment;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce#getUsePrivatelinkForMetadataAndAuthorization}
         * @param usePrivatelinkForMetadataAndAuthorization Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#use_privatelink_for_metadata_and_authorization AppflowConnectorProfile#use_privatelink_for_metadata_and_authorization}.
         * @return {@code this}
         */
        public Builder usePrivatelinkForMetadataAndAuthorization(java.lang.Boolean usePrivatelinkForMetadataAndAuthorization) {
            this.usePrivatelinkForMetadataAndAuthorization = usePrivatelinkForMetadataAndAuthorization;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce#getUsePrivatelinkForMetadataAndAuthorization}
         * @param usePrivatelinkForMetadataAndAuthorization Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#use_privatelink_for_metadata_and_authorization AppflowConnectorProfile#use_privatelink_for_metadata_and_authorization}.
         * @return {@code this}
         */
        public Builder usePrivatelinkForMetadataAndAuthorization(com.hashicorp.cdktf.IResolvable usePrivatelinkForMetadataAndAuthorization) {
            this.usePrivatelinkForMetadataAndAuthorization = usePrivatelinkForMetadataAndAuthorization;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce {
        private final java.lang.String instanceUrl;
        private final java.lang.Object isSandboxEnvironment;
        private final java.lang.Object usePrivatelinkForMetadataAndAuthorization;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceUrl = software.amazon.jsii.Kernel.get(this, "instanceUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.isSandboxEnvironment = software.amazon.jsii.Kernel.get(this, "isSandboxEnvironment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.usePrivatelinkForMetadataAndAuthorization = software.amazon.jsii.Kernel.get(this, "usePrivatelinkForMetadataAndAuthorization", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceUrl = builder.instanceUrl;
            this.isSandboxEnvironment = builder.isSandboxEnvironment;
            this.usePrivatelinkForMetadataAndAuthorization = builder.usePrivatelinkForMetadataAndAuthorization;
        }

        @Override
        public final java.lang.String getInstanceUrl() {
            return this.instanceUrl;
        }

        @Override
        public final java.lang.Object getIsSandboxEnvironment() {
            return this.isSandboxEnvironment;
        }

        @Override
        public final java.lang.Object getUsePrivatelinkForMetadataAndAuthorization() {
            return this.usePrivatelinkForMetadataAndAuthorization;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceUrl() != null) {
                data.set("instanceUrl", om.valueToTree(this.getInstanceUrl()));
            }
            if (this.getIsSandboxEnvironment() != null) {
                data.set("isSandboxEnvironment", om.valueToTree(this.getIsSandboxEnvironment()));
            }
            if (this.getUsePrivatelinkForMetadataAndAuthorization() != null) {
                data.set("usePrivatelinkForMetadataAndAuthorization", om.valueToTree(this.getUsePrivatelinkForMetadataAndAuthorization()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce.Jsii$Proxy) o;

            if (this.instanceUrl != null ? !this.instanceUrl.equals(that.instanceUrl) : that.instanceUrl != null) return false;
            if (this.isSandboxEnvironment != null ? !this.isSandboxEnvironment.equals(that.isSandboxEnvironment) : that.isSandboxEnvironment != null) return false;
            return this.usePrivatelinkForMetadataAndAuthorization != null ? this.usePrivatelinkForMetadataAndAuthorization.equals(that.usePrivatelinkForMetadataAndAuthorization) : that.usePrivatelinkForMetadataAndAuthorization == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceUrl != null ? this.instanceUrl.hashCode() : 0;
            result = 31 * result + (this.isSandboxEnvironment != null ? this.isSandboxEnvironment.hashCode() : 0);
            result = 31 * result + (this.usePrivatelinkForMetadataAndAuthorization != null ? this.usePrivatelinkForMetadataAndAuthorization.hashCode() : 0);
            return result;
        }
    }
}
