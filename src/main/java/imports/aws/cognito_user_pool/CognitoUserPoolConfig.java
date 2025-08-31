package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.350Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolConfig")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolConfig.Jsii$Proxy.class)
public interface CognitoUserPoolConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#name CognitoUserPool#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * account_recovery_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#account_recovery_setting CognitoUserPool#account_recovery_setting}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolAccountRecoverySetting getAccountRecoverySetting() {
        return null;
    }

    /**
     * admin_create_user_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#admin_create_user_config CognitoUserPool#admin_create_user_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfig getAdminCreateUserConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#alias_attributes CognitoUserPool#alias_attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAliasAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#auto_verified_attributes CognitoUserPool#auto_verified_attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAutoVerifiedAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#deletion_protection CognitoUserPool#deletion_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeletionProtection() {
        return null;
    }

    /**
     * device_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#device_configuration CognitoUserPool#device_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration getDeviceConfiguration() {
        return null;
    }

    /**
     * email_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_configuration CognitoUserPool#email_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration getEmailConfiguration() {
        return null;
    }

    /**
     * email_mfa_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_mfa_configuration CognitoUserPool#email_mfa_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolEmailMfaConfiguration getEmailMfaConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_verification_message CognitoUserPool#email_verification_message}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmailVerificationMessage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_verification_subject CognitoUserPool#email_verification_subject}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmailVerificationSubject() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#id CognitoUserPool#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * lambda_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#lambda_config CognitoUserPool#lambda_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig getLambdaConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#mfa_configuration CognitoUserPool#mfa_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMfaConfiguration() {
        return null;
    }

    /**
     * password_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#password_policy CognitoUserPool#password_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy getPasswordPolicy() {
        return null;
    }

    /**
     * schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#schema CognitoUserPool#schema}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSchema() {
        return null;
    }

    /**
     * sign_in_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#sign_in_policy CognitoUserPool#sign_in_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy getSignInPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#sms_authentication_message CognitoUserPool#sms_authentication_message}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSmsAuthenticationMessage() {
        return null;
    }

    /**
     * sms_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#sms_configuration CognitoUserPool#sms_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration getSmsConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#sms_verification_message CognitoUserPool#sms_verification_message}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSmsVerificationMessage() {
        return null;
    }

    /**
     * software_token_mfa_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#software_token_mfa_configuration CognitoUserPool#software_token_mfa_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSoftwareTokenMfaConfiguration getSoftwareTokenMfaConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#tags CognitoUserPool#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#tags_all CognitoUserPool#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * user_attribute_update_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#user_attribute_update_settings CognitoUserPool#user_attribute_update_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings getUserAttributeUpdateSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#username_attributes CognitoUserPool#username_attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUsernameAttributes() {
        return null;
    }

    /**
     * username_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#username_configuration CognitoUserPool#username_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUsernameConfiguration getUsernameConfiguration() {
        return null;
    }

    /**
     * user_pool_add_ons block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#user_pool_add_ons CognitoUserPool#user_pool_add_ons}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns getUserPoolAddOns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#user_pool_tier CognitoUserPool#user_pool_tier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserPoolTier() {
        return null;
    }

    /**
     * verification_message_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#verification_message_template CognitoUserPool#verification_message_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolVerificationMessageTemplate getVerificationMessageTemplate() {
        return null;
    }

    /**
     * web_authn_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#web_authn_configuration CognitoUserPool#web_authn_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration getWebAuthnConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolConfig> {
        java.lang.String name;
        imports.aws.cognito_user_pool.CognitoUserPoolAccountRecoverySetting accountRecoverySetting;
        imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfig adminCreateUserConfig;
        java.util.List<java.lang.String> aliasAttributes;
        java.util.List<java.lang.String> autoVerifiedAttributes;
        java.lang.String deletionProtection;
        imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration deviceConfiguration;
        imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration emailConfiguration;
        imports.aws.cognito_user_pool.CognitoUserPoolEmailMfaConfiguration emailMfaConfiguration;
        java.lang.String emailVerificationMessage;
        java.lang.String emailVerificationSubject;
        java.lang.String id;
        imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig lambdaConfig;
        java.lang.String mfaConfiguration;
        imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy passwordPolicy;
        java.lang.Object schema;
        imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy signInPolicy;
        java.lang.String smsAuthenticationMessage;
        imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration smsConfiguration;
        java.lang.String smsVerificationMessage;
        imports.aws.cognito_user_pool.CognitoUserPoolSoftwareTokenMfaConfiguration softwareTokenMfaConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings userAttributeUpdateSettings;
        java.util.List<java.lang.String> usernameAttributes;
        imports.aws.cognito_user_pool.CognitoUserPoolUsernameConfiguration usernameConfiguration;
        imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns userPoolAddOns;
        java.lang.String userPoolTier;
        imports.aws.cognito_user_pool.CognitoUserPoolVerificationMessageTemplate verificationMessageTemplate;
        imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration webAuthnConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#name CognitoUserPool#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getAccountRecoverySetting}
         * @param accountRecoverySetting account_recovery_setting block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#account_recovery_setting CognitoUserPool#account_recovery_setting}
         * @return {@code this}
         */
        public Builder accountRecoverySetting(imports.aws.cognito_user_pool.CognitoUserPoolAccountRecoverySetting accountRecoverySetting) {
            this.accountRecoverySetting = accountRecoverySetting;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getAdminCreateUserConfig}
         * @param adminCreateUserConfig admin_create_user_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#admin_create_user_config CognitoUserPool#admin_create_user_config}
         * @return {@code this}
         */
        public Builder adminCreateUserConfig(imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfig adminCreateUserConfig) {
            this.adminCreateUserConfig = adminCreateUserConfig;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getAliasAttributes}
         * @param aliasAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#alias_attributes CognitoUserPool#alias_attributes}.
         * @return {@code this}
         */
        public Builder aliasAttributes(java.util.List<java.lang.String> aliasAttributes) {
            this.aliasAttributes = aliasAttributes;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getAutoVerifiedAttributes}
         * @param autoVerifiedAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#auto_verified_attributes CognitoUserPool#auto_verified_attributes}.
         * @return {@code this}
         */
        public Builder autoVerifiedAttributes(java.util.List<java.lang.String> autoVerifiedAttributes) {
            this.autoVerifiedAttributes = autoVerifiedAttributes;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getDeletionProtection}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#deletion_protection CognitoUserPool#deletion_protection}.
         * @return {@code this}
         */
        public Builder deletionProtection(java.lang.String deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getDeviceConfiguration}
         * @param deviceConfiguration device_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#device_configuration CognitoUserPool#device_configuration}
         * @return {@code this}
         */
        public Builder deviceConfiguration(imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration deviceConfiguration) {
            this.deviceConfiguration = deviceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getEmailConfiguration}
         * @param emailConfiguration email_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_configuration CognitoUserPool#email_configuration}
         * @return {@code this}
         */
        public Builder emailConfiguration(imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration emailConfiguration) {
            this.emailConfiguration = emailConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getEmailMfaConfiguration}
         * @param emailMfaConfiguration email_mfa_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_mfa_configuration CognitoUserPool#email_mfa_configuration}
         * @return {@code this}
         */
        public Builder emailMfaConfiguration(imports.aws.cognito_user_pool.CognitoUserPoolEmailMfaConfiguration emailMfaConfiguration) {
            this.emailMfaConfiguration = emailMfaConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getEmailVerificationMessage}
         * @param emailVerificationMessage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_verification_message CognitoUserPool#email_verification_message}.
         * @return {@code this}
         */
        public Builder emailVerificationMessage(java.lang.String emailVerificationMessage) {
            this.emailVerificationMessage = emailVerificationMessage;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getEmailVerificationSubject}
         * @param emailVerificationSubject Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_verification_subject CognitoUserPool#email_verification_subject}.
         * @return {@code this}
         */
        public Builder emailVerificationSubject(java.lang.String emailVerificationSubject) {
            this.emailVerificationSubject = emailVerificationSubject;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#id CognitoUserPool#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getLambdaConfig}
         * @param lambdaConfig lambda_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#lambda_config CognitoUserPool#lambda_config}
         * @return {@code this}
         */
        public Builder lambdaConfig(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig lambdaConfig) {
            this.lambdaConfig = lambdaConfig;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getMfaConfiguration}
         * @param mfaConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#mfa_configuration CognitoUserPool#mfa_configuration}.
         * @return {@code this}
         */
        public Builder mfaConfiguration(java.lang.String mfaConfiguration) {
            this.mfaConfiguration = mfaConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getPasswordPolicy}
         * @param passwordPolicy password_policy block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#password_policy CognitoUserPool#password_policy}
         * @return {@code this}
         */
        public Builder passwordPolicy(imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy passwordPolicy) {
            this.passwordPolicy = passwordPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getSchema}
         * @param schema schema block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#schema CognitoUserPool#schema}
         * @return {@code this}
         */
        public Builder schema(com.hashicorp.cdktf.IResolvable schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getSchema}
         * @param schema schema block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#schema CognitoUserPool#schema}
         * @return {@code this}
         */
        public Builder schema(java.util.List<? extends imports.aws.cognito_user_pool.CognitoUserPoolSchema> schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getSignInPolicy}
         * @param signInPolicy sign_in_policy block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#sign_in_policy CognitoUserPool#sign_in_policy}
         * @return {@code this}
         */
        public Builder signInPolicy(imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy signInPolicy) {
            this.signInPolicy = signInPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getSmsAuthenticationMessage}
         * @param smsAuthenticationMessage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#sms_authentication_message CognitoUserPool#sms_authentication_message}.
         * @return {@code this}
         */
        public Builder smsAuthenticationMessage(java.lang.String smsAuthenticationMessage) {
            this.smsAuthenticationMessage = smsAuthenticationMessage;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getSmsConfiguration}
         * @param smsConfiguration sms_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#sms_configuration CognitoUserPool#sms_configuration}
         * @return {@code this}
         */
        public Builder smsConfiguration(imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration smsConfiguration) {
            this.smsConfiguration = smsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getSmsVerificationMessage}
         * @param smsVerificationMessage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#sms_verification_message CognitoUserPool#sms_verification_message}.
         * @return {@code this}
         */
        public Builder smsVerificationMessage(java.lang.String smsVerificationMessage) {
            this.smsVerificationMessage = smsVerificationMessage;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getSoftwareTokenMfaConfiguration}
         * @param softwareTokenMfaConfiguration software_token_mfa_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#software_token_mfa_configuration CognitoUserPool#software_token_mfa_configuration}
         * @return {@code this}
         */
        public Builder softwareTokenMfaConfiguration(imports.aws.cognito_user_pool.CognitoUserPoolSoftwareTokenMfaConfiguration softwareTokenMfaConfiguration) {
            this.softwareTokenMfaConfiguration = softwareTokenMfaConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#tags CognitoUserPool#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#tags_all CognitoUserPool#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getUserAttributeUpdateSettings}
         * @param userAttributeUpdateSettings user_attribute_update_settings block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#user_attribute_update_settings CognitoUserPool#user_attribute_update_settings}
         * @return {@code this}
         */
        public Builder userAttributeUpdateSettings(imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings userAttributeUpdateSettings) {
            this.userAttributeUpdateSettings = userAttributeUpdateSettings;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getUsernameAttributes}
         * @param usernameAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#username_attributes CognitoUserPool#username_attributes}.
         * @return {@code this}
         */
        public Builder usernameAttributes(java.util.List<java.lang.String> usernameAttributes) {
            this.usernameAttributes = usernameAttributes;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getUsernameConfiguration}
         * @param usernameConfiguration username_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#username_configuration CognitoUserPool#username_configuration}
         * @return {@code this}
         */
        public Builder usernameConfiguration(imports.aws.cognito_user_pool.CognitoUserPoolUsernameConfiguration usernameConfiguration) {
            this.usernameConfiguration = usernameConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getUserPoolAddOns}
         * @param userPoolAddOns user_pool_add_ons block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#user_pool_add_ons CognitoUserPool#user_pool_add_ons}
         * @return {@code this}
         */
        public Builder userPoolAddOns(imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns userPoolAddOns) {
            this.userPoolAddOns = userPoolAddOns;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getUserPoolTier}
         * @param userPoolTier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#user_pool_tier CognitoUserPool#user_pool_tier}.
         * @return {@code this}
         */
        public Builder userPoolTier(java.lang.String userPoolTier) {
            this.userPoolTier = userPoolTier;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getVerificationMessageTemplate}
         * @param verificationMessageTemplate verification_message_template block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#verification_message_template CognitoUserPool#verification_message_template}
         * @return {@code this}
         */
        public Builder verificationMessageTemplate(imports.aws.cognito_user_pool.CognitoUserPoolVerificationMessageTemplate verificationMessageTemplate) {
            this.verificationMessageTemplate = verificationMessageTemplate;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getWebAuthnConfiguration}
         * @param webAuthnConfiguration web_authn_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#web_authn_configuration CognitoUserPool#web_authn_configuration}
         * @return {@code this}
         */
        public Builder webAuthnConfiguration(imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration webAuthnConfiguration) {
            this.webAuthnConfiguration = webAuthnConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolConfig {
        private final java.lang.String name;
        private final imports.aws.cognito_user_pool.CognitoUserPoolAccountRecoverySetting accountRecoverySetting;
        private final imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfig adminCreateUserConfig;
        private final java.util.List<java.lang.String> aliasAttributes;
        private final java.util.List<java.lang.String> autoVerifiedAttributes;
        private final java.lang.String deletionProtection;
        private final imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration deviceConfiguration;
        private final imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration emailConfiguration;
        private final imports.aws.cognito_user_pool.CognitoUserPoolEmailMfaConfiguration emailMfaConfiguration;
        private final java.lang.String emailVerificationMessage;
        private final java.lang.String emailVerificationSubject;
        private final java.lang.String id;
        private final imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig lambdaConfig;
        private final java.lang.String mfaConfiguration;
        private final imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy passwordPolicy;
        private final java.lang.Object schema;
        private final imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy signInPolicy;
        private final java.lang.String smsAuthenticationMessage;
        private final imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration smsConfiguration;
        private final java.lang.String smsVerificationMessage;
        private final imports.aws.cognito_user_pool.CognitoUserPoolSoftwareTokenMfaConfiguration softwareTokenMfaConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings userAttributeUpdateSettings;
        private final java.util.List<java.lang.String> usernameAttributes;
        private final imports.aws.cognito_user_pool.CognitoUserPoolUsernameConfiguration usernameConfiguration;
        private final imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns userPoolAddOns;
        private final java.lang.String userPoolTier;
        private final imports.aws.cognito_user_pool.CognitoUserPoolVerificationMessageTemplate verificationMessageTemplate;
        private final imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration webAuthnConfiguration;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountRecoverySetting = software.amazon.jsii.Kernel.get(this, "accountRecoverySetting", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolAccountRecoverySetting.class));
            this.adminCreateUserConfig = software.amazon.jsii.Kernel.get(this, "adminCreateUserConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfig.class));
            this.aliasAttributes = software.amazon.jsii.Kernel.get(this, "aliasAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.autoVerifiedAttributes = software.amazon.jsii.Kernel.get(this, "autoVerifiedAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.deletionProtection = software.amazon.jsii.Kernel.get(this, "deletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceConfiguration = software.amazon.jsii.Kernel.get(this, "deviceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration.class));
            this.emailConfiguration = software.amazon.jsii.Kernel.get(this, "emailConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration.class));
            this.emailMfaConfiguration = software.amazon.jsii.Kernel.get(this, "emailMfaConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolEmailMfaConfiguration.class));
            this.emailVerificationMessage = software.amazon.jsii.Kernel.get(this, "emailVerificationMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.emailVerificationSubject = software.amazon.jsii.Kernel.get(this, "emailVerificationSubject", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaConfig = software.amazon.jsii.Kernel.get(this, "lambdaConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig.class));
            this.mfaConfiguration = software.amazon.jsii.Kernel.get(this, "mfaConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.passwordPolicy = software.amazon.jsii.Kernel.get(this, "passwordPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy.class));
            this.schema = software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.signInPolicy = software.amazon.jsii.Kernel.get(this, "signInPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy.class));
            this.smsAuthenticationMessage = software.amazon.jsii.Kernel.get(this, "smsAuthenticationMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.smsConfiguration = software.amazon.jsii.Kernel.get(this, "smsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration.class));
            this.smsVerificationMessage = software.amazon.jsii.Kernel.get(this, "smsVerificationMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.softwareTokenMfaConfiguration = software.amazon.jsii.Kernel.get(this, "softwareTokenMfaConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSoftwareTokenMfaConfiguration.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.userAttributeUpdateSettings = software.amazon.jsii.Kernel.get(this, "userAttributeUpdateSettings", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings.class));
            this.usernameAttributes = software.amazon.jsii.Kernel.get(this, "usernameAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.usernameConfiguration = software.amazon.jsii.Kernel.get(this, "usernameConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUsernameConfiguration.class));
            this.userPoolAddOns = software.amazon.jsii.Kernel.get(this, "userPoolAddOns", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns.class));
            this.userPoolTier = software.amazon.jsii.Kernel.get(this, "userPoolTier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.verificationMessageTemplate = software.amazon.jsii.Kernel.get(this, "verificationMessageTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolVerificationMessageTemplate.class));
            this.webAuthnConfiguration = software.amazon.jsii.Kernel.get(this, "webAuthnConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.accountRecoverySetting = builder.accountRecoverySetting;
            this.adminCreateUserConfig = builder.adminCreateUserConfig;
            this.aliasAttributes = builder.aliasAttributes;
            this.autoVerifiedAttributes = builder.autoVerifiedAttributes;
            this.deletionProtection = builder.deletionProtection;
            this.deviceConfiguration = builder.deviceConfiguration;
            this.emailConfiguration = builder.emailConfiguration;
            this.emailMfaConfiguration = builder.emailMfaConfiguration;
            this.emailVerificationMessage = builder.emailVerificationMessage;
            this.emailVerificationSubject = builder.emailVerificationSubject;
            this.id = builder.id;
            this.lambdaConfig = builder.lambdaConfig;
            this.mfaConfiguration = builder.mfaConfiguration;
            this.passwordPolicy = builder.passwordPolicy;
            this.schema = builder.schema;
            this.signInPolicy = builder.signInPolicy;
            this.smsAuthenticationMessage = builder.smsAuthenticationMessage;
            this.smsConfiguration = builder.smsConfiguration;
            this.smsVerificationMessage = builder.smsVerificationMessage;
            this.softwareTokenMfaConfiguration = builder.softwareTokenMfaConfiguration;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.userAttributeUpdateSettings = builder.userAttributeUpdateSettings;
            this.usernameAttributes = builder.usernameAttributes;
            this.usernameConfiguration = builder.usernameConfiguration;
            this.userPoolAddOns = builder.userPoolAddOns;
            this.userPoolTier = builder.userPoolTier;
            this.verificationMessageTemplate = builder.verificationMessageTemplate;
            this.webAuthnConfiguration = builder.webAuthnConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolAccountRecoverySetting getAccountRecoverySetting() {
            return this.accountRecoverySetting;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolAdminCreateUserConfig getAdminCreateUserConfig() {
            return this.adminCreateUserConfig;
        }

        @Override
        public final java.util.List<java.lang.String> getAliasAttributes() {
            return this.aliasAttributes;
        }

        @Override
        public final java.util.List<java.lang.String> getAutoVerifiedAttributes() {
            return this.autoVerifiedAttributes;
        }

        @Override
        public final java.lang.String getDeletionProtection() {
            return this.deletionProtection;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolDeviceConfiguration getDeviceConfiguration() {
            return this.deviceConfiguration;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolEmailConfiguration getEmailConfiguration() {
            return this.emailConfiguration;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolEmailMfaConfiguration getEmailMfaConfiguration() {
            return this.emailMfaConfiguration;
        }

        @Override
        public final java.lang.String getEmailVerificationMessage() {
            return this.emailVerificationMessage;
        }

        @Override
        public final java.lang.String getEmailVerificationSubject() {
            return this.emailVerificationSubject;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig getLambdaConfig() {
            return this.lambdaConfig;
        }

        @Override
        public final java.lang.String getMfaConfiguration() {
            return this.mfaConfiguration;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolPasswordPolicy getPasswordPolicy() {
            return this.passwordPolicy;
        }

        @Override
        public final java.lang.Object getSchema() {
            return this.schema;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolSignInPolicy getSignInPolicy() {
            return this.signInPolicy;
        }

        @Override
        public final java.lang.String getSmsAuthenticationMessage() {
            return this.smsAuthenticationMessage;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolSmsConfiguration getSmsConfiguration() {
            return this.smsConfiguration;
        }

        @Override
        public final java.lang.String getSmsVerificationMessage() {
            return this.smsVerificationMessage;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolSoftwareTokenMfaConfiguration getSoftwareTokenMfaConfiguration() {
            return this.softwareTokenMfaConfiguration;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolUserAttributeUpdateSettings getUserAttributeUpdateSettings() {
            return this.userAttributeUpdateSettings;
        }

        @Override
        public final java.util.List<java.lang.String> getUsernameAttributes() {
            return this.usernameAttributes;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolUsernameConfiguration getUsernameConfiguration() {
            return this.usernameConfiguration;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolUserPoolAddOns getUserPoolAddOns() {
            return this.userPoolAddOns;
        }

        @Override
        public final java.lang.String getUserPoolTier() {
            return this.userPoolTier;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolVerificationMessageTemplate getVerificationMessageTemplate() {
            return this.verificationMessageTemplate;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolWebAuthnConfiguration getWebAuthnConfiguration() {
            return this.webAuthnConfiguration;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getAccountRecoverySetting() != null) {
                data.set("accountRecoverySetting", om.valueToTree(this.getAccountRecoverySetting()));
            }
            if (this.getAdminCreateUserConfig() != null) {
                data.set("adminCreateUserConfig", om.valueToTree(this.getAdminCreateUserConfig()));
            }
            if (this.getAliasAttributes() != null) {
                data.set("aliasAttributes", om.valueToTree(this.getAliasAttributes()));
            }
            if (this.getAutoVerifiedAttributes() != null) {
                data.set("autoVerifiedAttributes", om.valueToTree(this.getAutoVerifiedAttributes()));
            }
            if (this.getDeletionProtection() != null) {
                data.set("deletionProtection", om.valueToTree(this.getDeletionProtection()));
            }
            if (this.getDeviceConfiguration() != null) {
                data.set("deviceConfiguration", om.valueToTree(this.getDeviceConfiguration()));
            }
            if (this.getEmailConfiguration() != null) {
                data.set("emailConfiguration", om.valueToTree(this.getEmailConfiguration()));
            }
            if (this.getEmailMfaConfiguration() != null) {
                data.set("emailMfaConfiguration", om.valueToTree(this.getEmailMfaConfiguration()));
            }
            if (this.getEmailVerificationMessage() != null) {
                data.set("emailVerificationMessage", om.valueToTree(this.getEmailVerificationMessage()));
            }
            if (this.getEmailVerificationSubject() != null) {
                data.set("emailVerificationSubject", om.valueToTree(this.getEmailVerificationSubject()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLambdaConfig() != null) {
                data.set("lambdaConfig", om.valueToTree(this.getLambdaConfig()));
            }
            if (this.getMfaConfiguration() != null) {
                data.set("mfaConfiguration", om.valueToTree(this.getMfaConfiguration()));
            }
            if (this.getPasswordPolicy() != null) {
                data.set("passwordPolicy", om.valueToTree(this.getPasswordPolicy()));
            }
            if (this.getSchema() != null) {
                data.set("schema", om.valueToTree(this.getSchema()));
            }
            if (this.getSignInPolicy() != null) {
                data.set("signInPolicy", om.valueToTree(this.getSignInPolicy()));
            }
            if (this.getSmsAuthenticationMessage() != null) {
                data.set("smsAuthenticationMessage", om.valueToTree(this.getSmsAuthenticationMessage()));
            }
            if (this.getSmsConfiguration() != null) {
                data.set("smsConfiguration", om.valueToTree(this.getSmsConfiguration()));
            }
            if (this.getSmsVerificationMessage() != null) {
                data.set("smsVerificationMessage", om.valueToTree(this.getSmsVerificationMessage()));
            }
            if (this.getSoftwareTokenMfaConfiguration() != null) {
                data.set("softwareTokenMfaConfiguration", om.valueToTree(this.getSoftwareTokenMfaConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getUserAttributeUpdateSettings() != null) {
                data.set("userAttributeUpdateSettings", om.valueToTree(this.getUserAttributeUpdateSettings()));
            }
            if (this.getUsernameAttributes() != null) {
                data.set("usernameAttributes", om.valueToTree(this.getUsernameAttributes()));
            }
            if (this.getUsernameConfiguration() != null) {
                data.set("usernameConfiguration", om.valueToTree(this.getUsernameConfiguration()));
            }
            if (this.getUserPoolAddOns() != null) {
                data.set("userPoolAddOns", om.valueToTree(this.getUserPoolAddOns()));
            }
            if (this.getUserPoolTier() != null) {
                data.set("userPoolTier", om.valueToTree(this.getUserPoolTier()));
            }
            if (this.getVerificationMessageTemplate() != null) {
                data.set("verificationMessageTemplate", om.valueToTree(this.getVerificationMessageTemplate()));
            }
            if (this.getWebAuthnConfiguration() != null) {
                data.set("webAuthnConfiguration", om.valueToTree(this.getWebAuthnConfiguration()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolConfig.Jsii$Proxy that = (CognitoUserPoolConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.accountRecoverySetting != null ? !this.accountRecoverySetting.equals(that.accountRecoverySetting) : that.accountRecoverySetting != null) return false;
            if (this.adminCreateUserConfig != null ? !this.adminCreateUserConfig.equals(that.adminCreateUserConfig) : that.adminCreateUserConfig != null) return false;
            if (this.aliasAttributes != null ? !this.aliasAttributes.equals(that.aliasAttributes) : that.aliasAttributes != null) return false;
            if (this.autoVerifiedAttributes != null ? !this.autoVerifiedAttributes.equals(that.autoVerifiedAttributes) : that.autoVerifiedAttributes != null) return false;
            if (this.deletionProtection != null ? !this.deletionProtection.equals(that.deletionProtection) : that.deletionProtection != null) return false;
            if (this.deviceConfiguration != null ? !this.deviceConfiguration.equals(that.deviceConfiguration) : that.deviceConfiguration != null) return false;
            if (this.emailConfiguration != null ? !this.emailConfiguration.equals(that.emailConfiguration) : that.emailConfiguration != null) return false;
            if (this.emailMfaConfiguration != null ? !this.emailMfaConfiguration.equals(that.emailMfaConfiguration) : that.emailMfaConfiguration != null) return false;
            if (this.emailVerificationMessage != null ? !this.emailVerificationMessage.equals(that.emailVerificationMessage) : that.emailVerificationMessage != null) return false;
            if (this.emailVerificationSubject != null ? !this.emailVerificationSubject.equals(that.emailVerificationSubject) : that.emailVerificationSubject != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lambdaConfig != null ? !this.lambdaConfig.equals(that.lambdaConfig) : that.lambdaConfig != null) return false;
            if (this.mfaConfiguration != null ? !this.mfaConfiguration.equals(that.mfaConfiguration) : that.mfaConfiguration != null) return false;
            if (this.passwordPolicy != null ? !this.passwordPolicy.equals(that.passwordPolicy) : that.passwordPolicy != null) return false;
            if (this.schema != null ? !this.schema.equals(that.schema) : that.schema != null) return false;
            if (this.signInPolicy != null ? !this.signInPolicy.equals(that.signInPolicy) : that.signInPolicy != null) return false;
            if (this.smsAuthenticationMessage != null ? !this.smsAuthenticationMessage.equals(that.smsAuthenticationMessage) : that.smsAuthenticationMessage != null) return false;
            if (this.smsConfiguration != null ? !this.smsConfiguration.equals(that.smsConfiguration) : that.smsConfiguration != null) return false;
            if (this.smsVerificationMessage != null ? !this.smsVerificationMessage.equals(that.smsVerificationMessage) : that.smsVerificationMessage != null) return false;
            if (this.softwareTokenMfaConfiguration != null ? !this.softwareTokenMfaConfiguration.equals(that.softwareTokenMfaConfiguration) : that.softwareTokenMfaConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.userAttributeUpdateSettings != null ? !this.userAttributeUpdateSettings.equals(that.userAttributeUpdateSettings) : that.userAttributeUpdateSettings != null) return false;
            if (this.usernameAttributes != null ? !this.usernameAttributes.equals(that.usernameAttributes) : that.usernameAttributes != null) return false;
            if (this.usernameConfiguration != null ? !this.usernameConfiguration.equals(that.usernameConfiguration) : that.usernameConfiguration != null) return false;
            if (this.userPoolAddOns != null ? !this.userPoolAddOns.equals(that.userPoolAddOns) : that.userPoolAddOns != null) return false;
            if (this.userPoolTier != null ? !this.userPoolTier.equals(that.userPoolTier) : that.userPoolTier != null) return false;
            if (this.verificationMessageTemplate != null ? !this.verificationMessageTemplate.equals(that.verificationMessageTemplate) : that.verificationMessageTemplate != null) return false;
            if (this.webAuthnConfiguration != null ? !this.webAuthnConfiguration.equals(that.webAuthnConfiguration) : that.webAuthnConfiguration != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.accountRecoverySetting != null ? this.accountRecoverySetting.hashCode() : 0);
            result = 31 * result + (this.adminCreateUserConfig != null ? this.adminCreateUserConfig.hashCode() : 0);
            result = 31 * result + (this.aliasAttributes != null ? this.aliasAttributes.hashCode() : 0);
            result = 31 * result + (this.autoVerifiedAttributes != null ? this.autoVerifiedAttributes.hashCode() : 0);
            result = 31 * result + (this.deletionProtection != null ? this.deletionProtection.hashCode() : 0);
            result = 31 * result + (this.deviceConfiguration != null ? this.deviceConfiguration.hashCode() : 0);
            result = 31 * result + (this.emailConfiguration != null ? this.emailConfiguration.hashCode() : 0);
            result = 31 * result + (this.emailMfaConfiguration != null ? this.emailMfaConfiguration.hashCode() : 0);
            result = 31 * result + (this.emailVerificationMessage != null ? this.emailVerificationMessage.hashCode() : 0);
            result = 31 * result + (this.emailVerificationSubject != null ? this.emailVerificationSubject.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lambdaConfig != null ? this.lambdaConfig.hashCode() : 0);
            result = 31 * result + (this.mfaConfiguration != null ? this.mfaConfiguration.hashCode() : 0);
            result = 31 * result + (this.passwordPolicy != null ? this.passwordPolicy.hashCode() : 0);
            result = 31 * result + (this.schema != null ? this.schema.hashCode() : 0);
            result = 31 * result + (this.signInPolicy != null ? this.signInPolicy.hashCode() : 0);
            result = 31 * result + (this.smsAuthenticationMessage != null ? this.smsAuthenticationMessage.hashCode() : 0);
            result = 31 * result + (this.smsConfiguration != null ? this.smsConfiguration.hashCode() : 0);
            result = 31 * result + (this.smsVerificationMessage != null ? this.smsVerificationMessage.hashCode() : 0);
            result = 31 * result + (this.softwareTokenMfaConfiguration != null ? this.softwareTokenMfaConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.userAttributeUpdateSettings != null ? this.userAttributeUpdateSettings.hashCode() : 0);
            result = 31 * result + (this.usernameAttributes != null ? this.usernameAttributes.hashCode() : 0);
            result = 31 * result + (this.usernameConfiguration != null ? this.usernameConfiguration.hashCode() : 0);
            result = 31 * result + (this.userPoolAddOns != null ? this.userPoolAddOns.hashCode() : 0);
            result = 31 * result + (this.userPoolTier != null ? this.userPoolTier.hashCode() : 0);
            result = 31 * result + (this.verificationMessageTemplate != null ? this.verificationMessageTemplate.hashCode() : 0);
            result = 31 * result + (this.webAuthnConfiguration != null ? this.webAuthnConfiguration.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
