package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.002Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#access_key_id AppflowConnectorProfile#access_key_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccessKeyId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#datakey AppflowConnectorProfile#datakey}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatakey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#secret_access_key AppflowConnectorProfile#secret_access_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecretAccessKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#user_id AppflowConnectorProfile#user_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserId();

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus> {
        java.lang.String accessKeyId;
        java.lang.String datakey;
        java.lang.String secretAccessKey;
        java.lang.String userId;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus#getAccessKeyId}
         * @param accessKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#access_key_id AppflowConnectorProfile#access_key_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessKeyId(java.lang.String accessKeyId) {
            this.accessKeyId = accessKeyId;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus#getDatakey}
         * @param datakey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#datakey AppflowConnectorProfile#datakey}. This parameter is required.
         * @return {@code this}
         */
        public Builder datakey(java.lang.String datakey) {
            this.datakey = datakey;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus#getSecretAccessKey}
         * @param secretAccessKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#secret_access_key AppflowConnectorProfile#secret_access_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder secretAccessKey(java.lang.String secretAccessKey) {
            this.secretAccessKey = secretAccessKey;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus#getUserId}
         * @param userId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#user_id AppflowConnectorProfile#user_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder userId(java.lang.String userId) {
            this.userId = userId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus {
        private final java.lang.String accessKeyId;
        private final java.lang.String datakey;
        private final java.lang.String secretAccessKey;
        private final java.lang.String userId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessKeyId = software.amazon.jsii.Kernel.get(this, "accessKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.datakey = software.amazon.jsii.Kernel.get(this, "datakey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretAccessKey = software.amazon.jsii.Kernel.get(this, "secretAccessKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userId = software.amazon.jsii.Kernel.get(this, "userId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessKeyId = java.util.Objects.requireNonNull(builder.accessKeyId, "accessKeyId is required");
            this.datakey = java.util.Objects.requireNonNull(builder.datakey, "datakey is required");
            this.secretAccessKey = java.util.Objects.requireNonNull(builder.secretAccessKey, "secretAccessKey is required");
            this.userId = java.util.Objects.requireNonNull(builder.userId, "userId is required");
        }

        @Override
        public final java.lang.String getAccessKeyId() {
            return this.accessKeyId;
        }

        @Override
        public final java.lang.String getDatakey() {
            return this.datakey;
        }

        @Override
        public final java.lang.String getSecretAccessKey() {
            return this.secretAccessKey;
        }

        @Override
        public final java.lang.String getUserId() {
            return this.userId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accessKeyId", om.valueToTree(this.getAccessKeyId()));
            data.set("datakey", om.valueToTree(this.getDatakey()));
            data.set("secretAccessKey", om.valueToTree(this.getSecretAccessKey()));
            data.set("userId", om.valueToTree(this.getUserId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsInforNexus.Jsii$Proxy) o;

            if (!accessKeyId.equals(that.accessKeyId)) return false;
            if (!datakey.equals(that.datakey)) return false;
            if (!secretAccessKey.equals(that.secretAccessKey)) return false;
            return this.userId.equals(that.userId);
        }

        @Override
        public final int hashCode() {
            int result = this.accessKeyId.hashCode();
            result = 31 * result + (this.datakey.hashCode());
            result = 31 * result + (this.secretAccessKey.hashCode());
            result = 31 * result + (this.userId.hashCode());
            return result;
        }
    }
}
