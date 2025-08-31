package imports.aws.cognito_managed_user_pool_client;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.345Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientConfig")
@software.amazon.jsii.Jsii.Proxy(CognitoManagedUserPoolClientConfig.Jsii$Proxy.class)
public interface CognitoManagedUserPoolClientConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#user_pool_id CognitoManagedUserPoolClient#user_pool_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserPoolId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token_validity CognitoManagedUserPoolClient#access_token_validity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAccessTokenValidity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows CognitoManagedUserPoolClient#allowed_oauth_flows}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedOauthFlows() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows_user_pool_client CognitoManagedUserPoolClient#allowed_oauth_flows_user_pool_client}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowedOauthFlowsUserPoolClient() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_scopes CognitoManagedUserPoolClient#allowed_oauth_scopes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedOauthScopes() {
        return null;
    }

    /**
     * analytics_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#analytics_configuration CognitoManagedUserPoolClient#analytics_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAnalyticsConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#auth_session_validity CognitoManagedUserPoolClient#auth_session_validity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAuthSessionValidity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#callback_urls CognitoManagedUserPoolClient#callback_urls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCallbackUrls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#default_redirect_uri CognitoManagedUserPoolClient#default_redirect_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultRedirectUri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_propagate_additional_user_context_data CognitoManagedUserPoolClient#enable_propagate_additional_user_context_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePropagateAdditionalUserContextData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_token_revocation CognitoManagedUserPoolClient#enable_token_revocation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableTokenRevocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#explicit_auth_flows CognitoManagedUserPoolClient#explicit_auth_flows}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExplicitAuthFlows() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token_validity CognitoManagedUserPoolClient#id_token_validity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdTokenValidity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#logout_urls CognitoManagedUserPoolClient#logout_urls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLogoutUrls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_pattern CognitoManagedUserPoolClient#name_pattern}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePattern() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_prefix CognitoManagedUserPoolClient#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#prevent_user_existence_errors CognitoManagedUserPoolClient#prevent_user_existence_errors}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreventUserExistenceErrors() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#read_attributes CognitoManagedUserPoolClient#read_attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReadAttributes() {
        return null;
    }

    /**
     * refresh_token_rotation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_rotation CognitoManagedUserPoolClient#refresh_token_rotation}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRefreshTokenRotation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_validity CognitoManagedUserPoolClient#refresh_token_validity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRefreshTokenValidity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#supported_identity_providers CognitoManagedUserPoolClient#supported_identity_providers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSupportedIdentityProviders() {
        return null;
    }

    /**
     * token_validity_units block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#token_validity_units CognitoManagedUserPoolClient#token_validity_units}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTokenValidityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#write_attributes CognitoManagedUserPoolClient#write_attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getWriteAttributes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoManagedUserPoolClientConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoManagedUserPoolClientConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoManagedUserPoolClientConfig> {
        java.lang.String userPoolId;
        java.lang.Number accessTokenValidity;
        java.util.List<java.lang.String> allowedOauthFlows;
        java.lang.Object allowedOauthFlowsUserPoolClient;
        java.util.List<java.lang.String> allowedOauthScopes;
        java.lang.Object analyticsConfiguration;
        java.lang.Number authSessionValidity;
        java.util.List<java.lang.String> callbackUrls;
        java.lang.String defaultRedirectUri;
        java.lang.Object enablePropagateAdditionalUserContextData;
        java.lang.Object enableTokenRevocation;
        java.util.List<java.lang.String> explicitAuthFlows;
        java.lang.Number idTokenValidity;
        java.util.List<java.lang.String> logoutUrls;
        java.lang.String namePattern;
        java.lang.String namePrefix;
        java.lang.String preventUserExistenceErrors;
        java.util.List<java.lang.String> readAttributes;
        java.lang.Object refreshTokenRotation;
        java.lang.Number refreshTokenValidity;
        java.util.List<java.lang.String> supportedIdentityProviders;
        java.lang.Object tokenValidityUnits;
        java.util.List<java.lang.String> writeAttributes;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getUserPoolId}
         * @param userPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#user_pool_id CognitoManagedUserPoolClient#user_pool_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder userPoolId(java.lang.String userPoolId) {
            this.userPoolId = userPoolId;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getAccessTokenValidity}
         * @param accessTokenValidity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token_validity CognitoManagedUserPoolClient#access_token_validity}.
         * @return {@code this}
         */
        public Builder accessTokenValidity(java.lang.Number accessTokenValidity) {
            this.accessTokenValidity = accessTokenValidity;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getAllowedOauthFlows}
         * @param allowedOauthFlows Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows CognitoManagedUserPoolClient#allowed_oauth_flows}.
         * @return {@code this}
         */
        public Builder allowedOauthFlows(java.util.List<java.lang.String> allowedOauthFlows) {
            this.allowedOauthFlows = allowedOauthFlows;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getAllowedOauthFlowsUserPoolClient}
         * @param allowedOauthFlowsUserPoolClient Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows_user_pool_client CognitoManagedUserPoolClient#allowed_oauth_flows_user_pool_client}.
         * @return {@code this}
         */
        public Builder allowedOauthFlowsUserPoolClient(java.lang.Boolean allowedOauthFlowsUserPoolClient) {
            this.allowedOauthFlowsUserPoolClient = allowedOauthFlowsUserPoolClient;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getAllowedOauthFlowsUserPoolClient}
         * @param allowedOauthFlowsUserPoolClient Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows_user_pool_client CognitoManagedUserPoolClient#allowed_oauth_flows_user_pool_client}.
         * @return {@code this}
         */
        public Builder allowedOauthFlowsUserPoolClient(com.hashicorp.cdktf.IResolvable allowedOauthFlowsUserPoolClient) {
            this.allowedOauthFlowsUserPoolClient = allowedOauthFlowsUserPoolClient;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getAllowedOauthScopes}
         * @param allowedOauthScopes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_scopes CognitoManagedUserPoolClient#allowed_oauth_scopes}.
         * @return {@code this}
         */
        public Builder allowedOauthScopes(java.util.List<java.lang.String> allowedOauthScopes) {
            this.allowedOauthScopes = allowedOauthScopes;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getAnalyticsConfiguration}
         * @param analyticsConfiguration analytics_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#analytics_configuration CognitoManagedUserPoolClient#analytics_configuration}
         * @return {@code this}
         */
        public Builder analyticsConfiguration(com.hashicorp.cdktf.IResolvable analyticsConfiguration) {
            this.analyticsConfiguration = analyticsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getAnalyticsConfiguration}
         * @param analyticsConfiguration analytics_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#analytics_configuration CognitoManagedUserPoolClient#analytics_configuration}
         * @return {@code this}
         */
        public Builder analyticsConfiguration(java.util.List<? extends imports.aws.cognito_managed_user_pool_client.CognitoManagedUserPoolClientAnalyticsConfiguration> analyticsConfiguration) {
            this.analyticsConfiguration = analyticsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getAuthSessionValidity}
         * @param authSessionValidity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#auth_session_validity CognitoManagedUserPoolClient#auth_session_validity}.
         * @return {@code this}
         */
        public Builder authSessionValidity(java.lang.Number authSessionValidity) {
            this.authSessionValidity = authSessionValidity;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getCallbackUrls}
         * @param callbackUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#callback_urls CognitoManagedUserPoolClient#callback_urls}.
         * @return {@code this}
         */
        public Builder callbackUrls(java.util.List<java.lang.String> callbackUrls) {
            this.callbackUrls = callbackUrls;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getDefaultRedirectUri}
         * @param defaultRedirectUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#default_redirect_uri CognitoManagedUserPoolClient#default_redirect_uri}.
         * @return {@code this}
         */
        public Builder defaultRedirectUri(java.lang.String defaultRedirectUri) {
            this.defaultRedirectUri = defaultRedirectUri;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getEnablePropagateAdditionalUserContextData}
         * @param enablePropagateAdditionalUserContextData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_propagate_additional_user_context_data CognitoManagedUserPoolClient#enable_propagate_additional_user_context_data}.
         * @return {@code this}
         */
        public Builder enablePropagateAdditionalUserContextData(java.lang.Boolean enablePropagateAdditionalUserContextData) {
            this.enablePropagateAdditionalUserContextData = enablePropagateAdditionalUserContextData;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getEnablePropagateAdditionalUserContextData}
         * @param enablePropagateAdditionalUserContextData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_propagate_additional_user_context_data CognitoManagedUserPoolClient#enable_propagate_additional_user_context_data}.
         * @return {@code this}
         */
        public Builder enablePropagateAdditionalUserContextData(com.hashicorp.cdktf.IResolvable enablePropagateAdditionalUserContextData) {
            this.enablePropagateAdditionalUserContextData = enablePropagateAdditionalUserContextData;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getEnableTokenRevocation}
         * @param enableTokenRevocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_token_revocation CognitoManagedUserPoolClient#enable_token_revocation}.
         * @return {@code this}
         */
        public Builder enableTokenRevocation(java.lang.Boolean enableTokenRevocation) {
            this.enableTokenRevocation = enableTokenRevocation;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getEnableTokenRevocation}
         * @param enableTokenRevocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_token_revocation CognitoManagedUserPoolClient#enable_token_revocation}.
         * @return {@code this}
         */
        public Builder enableTokenRevocation(com.hashicorp.cdktf.IResolvable enableTokenRevocation) {
            this.enableTokenRevocation = enableTokenRevocation;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getExplicitAuthFlows}
         * @param explicitAuthFlows Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#explicit_auth_flows CognitoManagedUserPoolClient#explicit_auth_flows}.
         * @return {@code this}
         */
        public Builder explicitAuthFlows(java.util.List<java.lang.String> explicitAuthFlows) {
            this.explicitAuthFlows = explicitAuthFlows;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getIdTokenValidity}
         * @param idTokenValidity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token_validity CognitoManagedUserPoolClient#id_token_validity}.
         * @return {@code this}
         */
        public Builder idTokenValidity(java.lang.Number idTokenValidity) {
            this.idTokenValidity = idTokenValidity;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getLogoutUrls}
         * @param logoutUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#logout_urls CognitoManagedUserPoolClient#logout_urls}.
         * @return {@code this}
         */
        public Builder logoutUrls(java.util.List<java.lang.String> logoutUrls) {
            this.logoutUrls = logoutUrls;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getNamePattern}
         * @param namePattern Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_pattern CognitoManagedUserPoolClient#name_pattern}.
         * @return {@code this}
         */
        public Builder namePattern(java.lang.String namePattern) {
            this.namePattern = namePattern;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_prefix CognitoManagedUserPoolClient#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getPreventUserExistenceErrors}
         * @param preventUserExistenceErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#prevent_user_existence_errors CognitoManagedUserPoolClient#prevent_user_existence_errors}.
         * @return {@code this}
         */
        public Builder preventUserExistenceErrors(java.lang.String preventUserExistenceErrors) {
            this.preventUserExistenceErrors = preventUserExistenceErrors;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getReadAttributes}
         * @param readAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#read_attributes CognitoManagedUserPoolClient#read_attributes}.
         * @return {@code this}
         */
        public Builder readAttributes(java.util.List<java.lang.String> readAttributes) {
            this.readAttributes = readAttributes;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getRefreshTokenRotation}
         * @param refreshTokenRotation refresh_token_rotation block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_rotation CognitoManagedUserPoolClient#refresh_token_rotation}
         * @return {@code this}
         */
        public Builder refreshTokenRotation(com.hashicorp.cdktf.IResolvable refreshTokenRotation) {
            this.refreshTokenRotation = refreshTokenRotation;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getRefreshTokenRotation}
         * @param refreshTokenRotation refresh_token_rotation block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_rotation CognitoManagedUserPoolClient#refresh_token_rotation}
         * @return {@code this}
         */
        public Builder refreshTokenRotation(java.util.List<? extends imports.aws.cognito_managed_user_pool_client.CognitoManagedUserPoolClientRefreshTokenRotation> refreshTokenRotation) {
            this.refreshTokenRotation = refreshTokenRotation;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getRefreshTokenValidity}
         * @param refreshTokenValidity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_validity CognitoManagedUserPoolClient#refresh_token_validity}.
         * @return {@code this}
         */
        public Builder refreshTokenValidity(java.lang.Number refreshTokenValidity) {
            this.refreshTokenValidity = refreshTokenValidity;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getSupportedIdentityProviders}
         * @param supportedIdentityProviders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#supported_identity_providers CognitoManagedUserPoolClient#supported_identity_providers}.
         * @return {@code this}
         */
        public Builder supportedIdentityProviders(java.util.List<java.lang.String> supportedIdentityProviders) {
            this.supportedIdentityProviders = supportedIdentityProviders;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getTokenValidityUnits}
         * @param tokenValidityUnits token_validity_units block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#token_validity_units CognitoManagedUserPoolClient#token_validity_units}
         * @return {@code this}
         */
        public Builder tokenValidityUnits(com.hashicorp.cdktf.IResolvable tokenValidityUnits) {
            this.tokenValidityUnits = tokenValidityUnits;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getTokenValidityUnits}
         * @param tokenValidityUnits token_validity_units block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#token_validity_units CognitoManagedUserPoolClient#token_validity_units}
         * @return {@code this}
         */
        public Builder tokenValidityUnits(java.util.List<? extends imports.aws.cognito_managed_user_pool_client.CognitoManagedUserPoolClientTokenValidityUnits> tokenValidityUnits) {
            this.tokenValidityUnits = tokenValidityUnits;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getWriteAttributes}
         * @param writeAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#write_attributes CognitoManagedUserPoolClient#write_attributes}.
         * @return {@code this}
         */
        public Builder writeAttributes(java.util.List<java.lang.String> writeAttributes) {
            this.writeAttributes = writeAttributes;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getDependsOn}
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
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CognitoManagedUserPoolClientConfig#getProvisioners}
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
         * @return a new instance of {@link CognitoManagedUserPoolClientConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoManagedUserPoolClientConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoManagedUserPoolClientConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoManagedUserPoolClientConfig {
        private final java.lang.String userPoolId;
        private final java.lang.Number accessTokenValidity;
        private final java.util.List<java.lang.String> allowedOauthFlows;
        private final java.lang.Object allowedOauthFlowsUserPoolClient;
        private final java.util.List<java.lang.String> allowedOauthScopes;
        private final java.lang.Object analyticsConfiguration;
        private final java.lang.Number authSessionValidity;
        private final java.util.List<java.lang.String> callbackUrls;
        private final java.lang.String defaultRedirectUri;
        private final java.lang.Object enablePropagateAdditionalUserContextData;
        private final java.lang.Object enableTokenRevocation;
        private final java.util.List<java.lang.String> explicitAuthFlows;
        private final java.lang.Number idTokenValidity;
        private final java.util.List<java.lang.String> logoutUrls;
        private final java.lang.String namePattern;
        private final java.lang.String namePrefix;
        private final java.lang.String preventUserExistenceErrors;
        private final java.util.List<java.lang.String> readAttributes;
        private final java.lang.Object refreshTokenRotation;
        private final java.lang.Number refreshTokenValidity;
        private final java.util.List<java.lang.String> supportedIdentityProviders;
        private final java.lang.Object tokenValidityUnits;
        private final java.util.List<java.lang.String> writeAttributes;
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
            this.userPoolId = software.amazon.jsii.Kernel.get(this, "userPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessTokenValidity = software.amazon.jsii.Kernel.get(this, "accessTokenValidity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allowedOauthFlows = software.amazon.jsii.Kernel.get(this, "allowedOauthFlows", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allowedOauthFlowsUserPoolClient = software.amazon.jsii.Kernel.get(this, "allowedOauthFlowsUserPoolClient", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowedOauthScopes = software.amazon.jsii.Kernel.get(this, "allowedOauthScopes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.analyticsConfiguration = software.amazon.jsii.Kernel.get(this, "analyticsConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.authSessionValidity = software.amazon.jsii.Kernel.get(this, "authSessionValidity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.callbackUrls = software.amazon.jsii.Kernel.get(this, "callbackUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.defaultRedirectUri = software.amazon.jsii.Kernel.get(this, "defaultRedirectUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enablePropagateAdditionalUserContextData = software.amazon.jsii.Kernel.get(this, "enablePropagateAdditionalUserContextData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableTokenRevocation = software.amazon.jsii.Kernel.get(this, "enableTokenRevocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.explicitAuthFlows = software.amazon.jsii.Kernel.get(this, "explicitAuthFlows", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.idTokenValidity = software.amazon.jsii.Kernel.get(this, "idTokenValidity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.logoutUrls = software.amazon.jsii.Kernel.get(this, "logoutUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.namePattern = software.amazon.jsii.Kernel.get(this, "namePattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preventUserExistenceErrors = software.amazon.jsii.Kernel.get(this, "preventUserExistenceErrors", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.readAttributes = software.amazon.jsii.Kernel.get(this, "readAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.refreshTokenRotation = software.amazon.jsii.Kernel.get(this, "refreshTokenRotation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.refreshTokenValidity = software.amazon.jsii.Kernel.get(this, "refreshTokenValidity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.supportedIdentityProviders = software.amazon.jsii.Kernel.get(this, "supportedIdentityProviders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tokenValidityUnits = software.amazon.jsii.Kernel.get(this, "tokenValidityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.writeAttributes = software.amazon.jsii.Kernel.get(this, "writeAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.userPoolId = java.util.Objects.requireNonNull(builder.userPoolId, "userPoolId is required");
            this.accessTokenValidity = builder.accessTokenValidity;
            this.allowedOauthFlows = builder.allowedOauthFlows;
            this.allowedOauthFlowsUserPoolClient = builder.allowedOauthFlowsUserPoolClient;
            this.allowedOauthScopes = builder.allowedOauthScopes;
            this.analyticsConfiguration = builder.analyticsConfiguration;
            this.authSessionValidity = builder.authSessionValidity;
            this.callbackUrls = builder.callbackUrls;
            this.defaultRedirectUri = builder.defaultRedirectUri;
            this.enablePropagateAdditionalUserContextData = builder.enablePropagateAdditionalUserContextData;
            this.enableTokenRevocation = builder.enableTokenRevocation;
            this.explicitAuthFlows = builder.explicitAuthFlows;
            this.idTokenValidity = builder.idTokenValidity;
            this.logoutUrls = builder.logoutUrls;
            this.namePattern = builder.namePattern;
            this.namePrefix = builder.namePrefix;
            this.preventUserExistenceErrors = builder.preventUserExistenceErrors;
            this.readAttributes = builder.readAttributes;
            this.refreshTokenRotation = builder.refreshTokenRotation;
            this.refreshTokenValidity = builder.refreshTokenValidity;
            this.supportedIdentityProviders = builder.supportedIdentityProviders;
            this.tokenValidityUnits = builder.tokenValidityUnits;
            this.writeAttributes = builder.writeAttributes;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getUserPoolId() {
            return this.userPoolId;
        }

        @Override
        public final java.lang.Number getAccessTokenValidity() {
            return this.accessTokenValidity;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedOauthFlows() {
            return this.allowedOauthFlows;
        }

        @Override
        public final java.lang.Object getAllowedOauthFlowsUserPoolClient() {
            return this.allowedOauthFlowsUserPoolClient;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedOauthScopes() {
            return this.allowedOauthScopes;
        }

        @Override
        public final java.lang.Object getAnalyticsConfiguration() {
            return this.analyticsConfiguration;
        }

        @Override
        public final java.lang.Number getAuthSessionValidity() {
            return this.authSessionValidity;
        }

        @Override
        public final java.util.List<java.lang.String> getCallbackUrls() {
            return this.callbackUrls;
        }

        @Override
        public final java.lang.String getDefaultRedirectUri() {
            return this.defaultRedirectUri;
        }

        @Override
        public final java.lang.Object getEnablePropagateAdditionalUserContextData() {
            return this.enablePropagateAdditionalUserContextData;
        }

        @Override
        public final java.lang.Object getEnableTokenRevocation() {
            return this.enableTokenRevocation;
        }

        @Override
        public final java.util.List<java.lang.String> getExplicitAuthFlows() {
            return this.explicitAuthFlows;
        }

        @Override
        public final java.lang.Number getIdTokenValidity() {
            return this.idTokenValidity;
        }

        @Override
        public final java.util.List<java.lang.String> getLogoutUrls() {
            return this.logoutUrls;
        }

        @Override
        public final java.lang.String getNamePattern() {
            return this.namePattern;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.String getPreventUserExistenceErrors() {
            return this.preventUserExistenceErrors;
        }

        @Override
        public final java.util.List<java.lang.String> getReadAttributes() {
            return this.readAttributes;
        }

        @Override
        public final java.lang.Object getRefreshTokenRotation() {
            return this.refreshTokenRotation;
        }

        @Override
        public final java.lang.Number getRefreshTokenValidity() {
            return this.refreshTokenValidity;
        }

        @Override
        public final java.util.List<java.lang.String> getSupportedIdentityProviders() {
            return this.supportedIdentityProviders;
        }

        @Override
        public final java.lang.Object getTokenValidityUnits() {
            return this.tokenValidityUnits;
        }

        @Override
        public final java.util.List<java.lang.String> getWriteAttributes() {
            return this.writeAttributes;
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

            data.set("userPoolId", om.valueToTree(this.getUserPoolId()));
            if (this.getAccessTokenValidity() != null) {
                data.set("accessTokenValidity", om.valueToTree(this.getAccessTokenValidity()));
            }
            if (this.getAllowedOauthFlows() != null) {
                data.set("allowedOauthFlows", om.valueToTree(this.getAllowedOauthFlows()));
            }
            if (this.getAllowedOauthFlowsUserPoolClient() != null) {
                data.set("allowedOauthFlowsUserPoolClient", om.valueToTree(this.getAllowedOauthFlowsUserPoolClient()));
            }
            if (this.getAllowedOauthScopes() != null) {
                data.set("allowedOauthScopes", om.valueToTree(this.getAllowedOauthScopes()));
            }
            if (this.getAnalyticsConfiguration() != null) {
                data.set("analyticsConfiguration", om.valueToTree(this.getAnalyticsConfiguration()));
            }
            if (this.getAuthSessionValidity() != null) {
                data.set("authSessionValidity", om.valueToTree(this.getAuthSessionValidity()));
            }
            if (this.getCallbackUrls() != null) {
                data.set("callbackUrls", om.valueToTree(this.getCallbackUrls()));
            }
            if (this.getDefaultRedirectUri() != null) {
                data.set("defaultRedirectUri", om.valueToTree(this.getDefaultRedirectUri()));
            }
            if (this.getEnablePropagateAdditionalUserContextData() != null) {
                data.set("enablePropagateAdditionalUserContextData", om.valueToTree(this.getEnablePropagateAdditionalUserContextData()));
            }
            if (this.getEnableTokenRevocation() != null) {
                data.set("enableTokenRevocation", om.valueToTree(this.getEnableTokenRevocation()));
            }
            if (this.getExplicitAuthFlows() != null) {
                data.set("explicitAuthFlows", om.valueToTree(this.getExplicitAuthFlows()));
            }
            if (this.getIdTokenValidity() != null) {
                data.set("idTokenValidity", om.valueToTree(this.getIdTokenValidity()));
            }
            if (this.getLogoutUrls() != null) {
                data.set("logoutUrls", om.valueToTree(this.getLogoutUrls()));
            }
            if (this.getNamePattern() != null) {
                data.set("namePattern", om.valueToTree(this.getNamePattern()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getPreventUserExistenceErrors() != null) {
                data.set("preventUserExistenceErrors", om.valueToTree(this.getPreventUserExistenceErrors()));
            }
            if (this.getReadAttributes() != null) {
                data.set("readAttributes", om.valueToTree(this.getReadAttributes()));
            }
            if (this.getRefreshTokenRotation() != null) {
                data.set("refreshTokenRotation", om.valueToTree(this.getRefreshTokenRotation()));
            }
            if (this.getRefreshTokenValidity() != null) {
                data.set("refreshTokenValidity", om.valueToTree(this.getRefreshTokenValidity()));
            }
            if (this.getSupportedIdentityProviders() != null) {
                data.set("supportedIdentityProviders", om.valueToTree(this.getSupportedIdentityProviders()));
            }
            if (this.getTokenValidityUnits() != null) {
                data.set("tokenValidityUnits", om.valueToTree(this.getTokenValidityUnits()));
            }
            if (this.getWriteAttributes() != null) {
                data.set("writeAttributes", om.valueToTree(this.getWriteAttributes()));
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
            struct.set("fqn", om.valueToTree("aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoManagedUserPoolClientConfig.Jsii$Proxy that = (CognitoManagedUserPoolClientConfig.Jsii$Proxy) o;

            if (!userPoolId.equals(that.userPoolId)) return false;
            if (this.accessTokenValidity != null ? !this.accessTokenValidity.equals(that.accessTokenValidity) : that.accessTokenValidity != null) return false;
            if (this.allowedOauthFlows != null ? !this.allowedOauthFlows.equals(that.allowedOauthFlows) : that.allowedOauthFlows != null) return false;
            if (this.allowedOauthFlowsUserPoolClient != null ? !this.allowedOauthFlowsUserPoolClient.equals(that.allowedOauthFlowsUserPoolClient) : that.allowedOauthFlowsUserPoolClient != null) return false;
            if (this.allowedOauthScopes != null ? !this.allowedOauthScopes.equals(that.allowedOauthScopes) : that.allowedOauthScopes != null) return false;
            if (this.analyticsConfiguration != null ? !this.analyticsConfiguration.equals(that.analyticsConfiguration) : that.analyticsConfiguration != null) return false;
            if (this.authSessionValidity != null ? !this.authSessionValidity.equals(that.authSessionValidity) : that.authSessionValidity != null) return false;
            if (this.callbackUrls != null ? !this.callbackUrls.equals(that.callbackUrls) : that.callbackUrls != null) return false;
            if (this.defaultRedirectUri != null ? !this.defaultRedirectUri.equals(that.defaultRedirectUri) : that.defaultRedirectUri != null) return false;
            if (this.enablePropagateAdditionalUserContextData != null ? !this.enablePropagateAdditionalUserContextData.equals(that.enablePropagateAdditionalUserContextData) : that.enablePropagateAdditionalUserContextData != null) return false;
            if (this.enableTokenRevocation != null ? !this.enableTokenRevocation.equals(that.enableTokenRevocation) : that.enableTokenRevocation != null) return false;
            if (this.explicitAuthFlows != null ? !this.explicitAuthFlows.equals(that.explicitAuthFlows) : that.explicitAuthFlows != null) return false;
            if (this.idTokenValidity != null ? !this.idTokenValidity.equals(that.idTokenValidity) : that.idTokenValidity != null) return false;
            if (this.logoutUrls != null ? !this.logoutUrls.equals(that.logoutUrls) : that.logoutUrls != null) return false;
            if (this.namePattern != null ? !this.namePattern.equals(that.namePattern) : that.namePattern != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.preventUserExistenceErrors != null ? !this.preventUserExistenceErrors.equals(that.preventUserExistenceErrors) : that.preventUserExistenceErrors != null) return false;
            if (this.readAttributes != null ? !this.readAttributes.equals(that.readAttributes) : that.readAttributes != null) return false;
            if (this.refreshTokenRotation != null ? !this.refreshTokenRotation.equals(that.refreshTokenRotation) : that.refreshTokenRotation != null) return false;
            if (this.refreshTokenValidity != null ? !this.refreshTokenValidity.equals(that.refreshTokenValidity) : that.refreshTokenValidity != null) return false;
            if (this.supportedIdentityProviders != null ? !this.supportedIdentityProviders.equals(that.supportedIdentityProviders) : that.supportedIdentityProviders != null) return false;
            if (this.tokenValidityUnits != null ? !this.tokenValidityUnits.equals(that.tokenValidityUnits) : that.tokenValidityUnits != null) return false;
            if (this.writeAttributes != null ? !this.writeAttributes.equals(that.writeAttributes) : that.writeAttributes != null) return false;
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
            int result = this.userPoolId.hashCode();
            result = 31 * result + (this.accessTokenValidity != null ? this.accessTokenValidity.hashCode() : 0);
            result = 31 * result + (this.allowedOauthFlows != null ? this.allowedOauthFlows.hashCode() : 0);
            result = 31 * result + (this.allowedOauthFlowsUserPoolClient != null ? this.allowedOauthFlowsUserPoolClient.hashCode() : 0);
            result = 31 * result + (this.allowedOauthScopes != null ? this.allowedOauthScopes.hashCode() : 0);
            result = 31 * result + (this.analyticsConfiguration != null ? this.analyticsConfiguration.hashCode() : 0);
            result = 31 * result + (this.authSessionValidity != null ? this.authSessionValidity.hashCode() : 0);
            result = 31 * result + (this.callbackUrls != null ? this.callbackUrls.hashCode() : 0);
            result = 31 * result + (this.defaultRedirectUri != null ? this.defaultRedirectUri.hashCode() : 0);
            result = 31 * result + (this.enablePropagateAdditionalUserContextData != null ? this.enablePropagateAdditionalUserContextData.hashCode() : 0);
            result = 31 * result + (this.enableTokenRevocation != null ? this.enableTokenRevocation.hashCode() : 0);
            result = 31 * result + (this.explicitAuthFlows != null ? this.explicitAuthFlows.hashCode() : 0);
            result = 31 * result + (this.idTokenValidity != null ? this.idTokenValidity.hashCode() : 0);
            result = 31 * result + (this.logoutUrls != null ? this.logoutUrls.hashCode() : 0);
            result = 31 * result + (this.namePattern != null ? this.namePattern.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.preventUserExistenceErrors != null ? this.preventUserExistenceErrors.hashCode() : 0);
            result = 31 * result + (this.readAttributes != null ? this.readAttributes.hashCode() : 0);
            result = 31 * result + (this.refreshTokenRotation != null ? this.refreshTokenRotation.hashCode() : 0);
            result = 31 * result + (this.refreshTokenValidity != null ? this.refreshTokenValidity.hashCode() : 0);
            result = 31 * result + (this.supportedIdentityProviders != null ? this.supportedIdentityProviders.hashCode() : 0);
            result = 31 * result + (this.tokenValidityUnits != null ? this.tokenValidityUnits.hashCode() : 0);
            result = 31 * result + (this.writeAttributes != null ? this.writeAttributes.hashCode() : 0);
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
