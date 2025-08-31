package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.350Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolAdminCreateUserConfig")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolAdminCreateUserConfig.Jsii$Proxy.class)
public interface CognitoUserPoolAdminCreateUserConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#allow_admin_create_user_only CognitoUserPool#allow_admin_create_user_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowAdminCreateUserOnly() {
        return null;
    }

    /**
     * invite_message_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#invite_message_template CognitoUserPool#invite_message_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate getInviteMessageTemplate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolAdminCreateUserConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolAdminCreateUserConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolAdminCreateUserConfig> {
        java.lang.Object allowAdminCreateUserOnly;
        imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate inviteMessageTemplate;

        /**
         * Sets the value of {@link CognitoUserPoolAdminCreateUserConfig#getAllowAdminCreateUserOnly}
         * @param allowAdminCreateUserOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#allow_admin_create_user_only CognitoUserPool#allow_admin_create_user_only}.
         * @return {@code this}
         */
        public Builder allowAdminCreateUserOnly(java.lang.Boolean allowAdminCreateUserOnly) {
            this.allowAdminCreateUserOnly = allowAdminCreateUserOnly;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolAdminCreateUserConfig#getAllowAdminCreateUserOnly}
         * @param allowAdminCreateUserOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#allow_admin_create_user_only CognitoUserPool#allow_admin_create_user_only}.
         * @return {@code this}
         */
        public Builder allowAdminCreateUserOnly(com.hashicorp.cdktf.IResolvable allowAdminCreateUserOnly) {
            this.allowAdminCreateUserOnly = allowAdminCreateUserOnly;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolAdminCreateUserConfig#getInviteMessageTemplate}
         * @param inviteMessageTemplate invite_message_template block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#invite_message_template CognitoUserPool#invite_message_template}
         * @return {@code this}
         */
        public Builder inviteMessageTemplate(imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate inviteMessageTemplate) {
            this.inviteMessageTemplate = inviteMessageTemplate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolAdminCreateUserConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolAdminCreateUserConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolAdminCreateUserConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolAdminCreateUserConfig {
        private final java.lang.Object allowAdminCreateUserOnly;
        private final imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate inviteMessageTemplate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowAdminCreateUserOnly = software.amazon.jsii.Kernel.get(this, "allowAdminCreateUserOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.inviteMessageTemplate = software.amazon.jsii.Kernel.get(this, "inviteMessageTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowAdminCreateUserOnly = builder.allowAdminCreateUserOnly;
            this.inviteMessageTemplate = builder.inviteMessageTemplate;
        }

        @Override
        public final java.lang.Object getAllowAdminCreateUserOnly() {
            return this.allowAdminCreateUserOnly;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfigInviteMessageTemplate getInviteMessageTemplate() {
            return this.inviteMessageTemplate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowAdminCreateUserOnly() != null) {
                data.set("allowAdminCreateUserOnly", om.valueToTree(this.getAllowAdminCreateUserOnly()));
            }
            if (this.getInviteMessageTemplate() != null) {
                data.set("inviteMessageTemplate", om.valueToTree(this.getInviteMessageTemplate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolAdminCreateUserConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolAdminCreateUserConfig.Jsii$Proxy that = (CognitoUserPoolAdminCreateUserConfig.Jsii$Proxy) o;

            if (this.allowAdminCreateUserOnly != null ? !this.allowAdminCreateUserOnly.equals(that.allowAdminCreateUserOnly) : that.allowAdminCreateUserOnly != null) return false;
            return this.inviteMessageTemplate != null ? this.inviteMessageTemplate.equals(that.inviteMessageTemplate) : that.inviteMessageTemplate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowAdminCreateUserOnly != null ? this.allowAdminCreateUserOnly.hashCode() : 0;
            result = 31 * result + (this.inviteMessageTemplate != null ? this.inviteMessageTemplate.hashCode() : 0);
            return result;
        }
    }
}
