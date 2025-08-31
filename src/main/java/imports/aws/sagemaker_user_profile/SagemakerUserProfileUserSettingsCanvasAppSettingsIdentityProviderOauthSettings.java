package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.348Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#secret_arn SagemakerUserProfile#secret_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecretArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#data_source_name SagemakerUserProfile#data_source_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataSourceName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings> {
        java.lang.String secretArn;
        java.lang.String dataSourceName;
        java.lang.String status;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings#getSecretArn}
         * @param secretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#secret_arn SagemakerUserProfile#secret_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder secretArn(java.lang.String secretArn) {
            this.secretArn = secretArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings#getDataSourceName}
         * @param dataSourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#data_source_name SagemakerUserProfile#data_source_name}.
         * @return {@code this}
         */
        public Builder dataSourceName(java.lang.String dataSourceName) {
            this.dataSourceName = dataSourceName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings {
        private final java.lang.String secretArn;
        private final java.lang.String dataSourceName;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.secretArn = software.amazon.jsii.Kernel.get(this, "secretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSourceName = software.amazon.jsii.Kernel.get(this, "dataSourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.secretArn = java.util.Objects.requireNonNull(builder.secretArn, "secretArn is required");
            this.dataSourceName = builder.dataSourceName;
            this.status = builder.status;
        }

        @Override
        public final java.lang.String getSecretArn() {
            return this.secretArn;
        }

        @Override
        public final java.lang.String getDataSourceName() {
            return this.dataSourceName;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("secretArn", om.valueToTree(this.getSecretArn()));
            if (this.getDataSourceName() != null) {
                data.set("dataSourceName", om.valueToTree(this.getDataSourceName()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings.Jsii$Proxy) o;

            if (!secretArn.equals(that.secretArn)) return false;
            if (this.dataSourceName != null ? !this.dataSourceName.equals(that.dataSourceName) : that.dataSourceName != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.secretArn.hashCode();
            result = 31 * result + (this.dataSourceName != null ? this.dataSourceName.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
