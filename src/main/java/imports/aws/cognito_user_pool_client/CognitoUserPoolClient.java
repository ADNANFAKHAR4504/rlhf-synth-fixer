package imports.aws.cognito_user_pool_client;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client aws_cognito_user_pool_client}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPoolClient.CognitoUserPoolClient")
public class CognitoUserPoolClient extends com.hashicorp.cdktf.TerraformResource {

    protected CognitoUserPoolClient(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolClient(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cognito_user_pool_client.CognitoUserPoolClient.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client aws_cognito_user_pool_client} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CognitoUserPoolClient(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool_client.CognitoUserPoolClientConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CognitoUserPoolClient resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CognitoUserPoolClient to import. This parameter is required.
     * @param importFromId The id of the existing CognitoUserPoolClient that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CognitoUserPoolClient to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cognito_user_pool_client.CognitoUserPoolClient.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CognitoUserPoolClient resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CognitoUserPoolClient to import. This parameter is required.
     * @param importFromId The id of the existing CognitoUserPoolClient that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cognito_user_pool_client.CognitoUserPoolClient.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAnalyticsConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientAnalyticsConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientAnalyticsConfiguration> __cast_cd4240 = (java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientAnalyticsConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cognito_user_pool_client.CognitoUserPoolClientAnalyticsConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAnalyticsConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRefreshTokenRotation(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientRefreshTokenRotation>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientRefreshTokenRotation> __cast_cd4240 = (java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientRefreshTokenRotation>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cognito_user_pool_client.CognitoUserPoolClientRefreshTokenRotation __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRefreshTokenRotation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTokenValidityUnits(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientTokenValidityUnits>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientTokenValidityUnits> __cast_cd4240 = (java.util.List<imports.aws.cognito_user_pool_client.CognitoUserPoolClientTokenValidityUnits>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cognito_user_pool_client.CognitoUserPoolClientTokenValidityUnits __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTokenValidityUnits", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessTokenValidity() {
        software.amazon.jsii.Kernel.call(this, "resetAccessTokenValidity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowedOauthFlows() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedOauthFlows", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowedOauthFlowsUserPoolClient() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedOauthFlowsUserPoolClient", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowedOauthScopes() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedOauthScopes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAnalyticsConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAnalyticsConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthSessionValidity() {
        software.amazon.jsii.Kernel.call(this, "resetAuthSessionValidity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCallbackUrls() {
        software.amazon.jsii.Kernel.call(this, "resetCallbackUrls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultRedirectUri() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultRedirectUri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnablePropagateAdditionalUserContextData() {
        software.amazon.jsii.Kernel.call(this, "resetEnablePropagateAdditionalUserContextData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableTokenRevocation() {
        software.amazon.jsii.Kernel.call(this, "resetEnableTokenRevocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExplicitAuthFlows() {
        software.amazon.jsii.Kernel.call(this, "resetExplicitAuthFlows", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGenerateSecret() {
        software.amazon.jsii.Kernel.call(this, "resetGenerateSecret", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdTokenValidity() {
        software.amazon.jsii.Kernel.call(this, "resetIdTokenValidity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogoutUrls() {
        software.amazon.jsii.Kernel.call(this, "resetLogoutUrls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreventUserExistenceErrors() {
        software.amazon.jsii.Kernel.call(this, "resetPreventUserExistenceErrors", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetReadAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRefreshTokenRotation() {
        software.amazon.jsii.Kernel.call(this, "resetRefreshTokenRotation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRefreshTokenValidity() {
        software.amazon.jsii.Kernel.call(this, "resetRefreshTokenValidity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportedIdentityProviders() {
        software.amazon.jsii.Kernel.call(this, "resetSupportedIdentityProviders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTokenValidityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetTokenValidityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWriteAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetWriteAttributes", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool_client.CognitoUserPoolClientAnalyticsConfigurationList getAnalyticsConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "analyticsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool_client.CognitoUserPoolClientAnalyticsConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientSecret() {
        return software.amazon.jsii.Kernel.get(this, "clientSecret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool_client.CognitoUserPoolClientRefreshTokenRotationList getRefreshTokenRotation() {
        return software.amazon.jsii.Kernel.get(this, "refreshTokenRotation", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool_client.CognitoUserPoolClientRefreshTokenRotationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool_client.CognitoUserPoolClientTokenValidityUnitsList getTokenValidityUnits() {
        return software.amazon.jsii.Kernel.get(this, "tokenValidityUnits", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool_client.CognitoUserPoolClientTokenValidityUnitsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAccessTokenValidityInput() {
        return software.amazon.jsii.Kernel.get(this, "accessTokenValidityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedOauthFlowsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowedOauthFlowsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowedOauthFlowsUserPoolClientInput() {
        return software.amazon.jsii.Kernel.get(this, "allowedOauthFlowsUserPoolClientInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedOauthScopesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowedOauthScopesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAnalyticsConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "analyticsConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAuthSessionValidityInput() {
        return software.amazon.jsii.Kernel.get(this, "authSessionValidityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCallbackUrlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "callbackUrlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultRedirectUriInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultRedirectUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnablePropagateAdditionalUserContextDataInput() {
        return software.amazon.jsii.Kernel.get(this, "enablePropagateAdditionalUserContextDataInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableTokenRevocationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableTokenRevocationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExplicitAuthFlowsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "explicitAuthFlowsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGenerateSecretInput() {
        return software.amazon.jsii.Kernel.get(this, "generateSecretInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdTokenValidityInput() {
        return software.amazon.jsii.Kernel.get(this, "idTokenValidityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLogoutUrlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "logoutUrlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreventUserExistenceErrorsInput() {
        return software.amazon.jsii.Kernel.get(this, "preventUserExistenceErrorsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReadAttributesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "readAttributesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRefreshTokenRotationInput() {
        return software.amazon.jsii.Kernel.get(this, "refreshTokenRotationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRefreshTokenValidityInput() {
        return software.amazon.jsii.Kernel.get(this, "refreshTokenValidityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSupportedIdentityProvidersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "supportedIdentityProvidersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTokenValidityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "tokenValidityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "userPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getWriteAttributesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "writeAttributesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAccessTokenValidity() {
        return software.amazon.jsii.Kernel.get(this, "accessTokenValidity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAccessTokenValidity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "accessTokenValidity", java.util.Objects.requireNonNull(value, "accessTokenValidity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedOauthFlows() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowedOauthFlows", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowedOauthFlows(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowedOauthFlows", java.util.Objects.requireNonNull(value, "allowedOauthFlows is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowedOauthFlowsUserPoolClient() {
        return software.amazon.jsii.Kernel.get(this, "allowedOauthFlowsUserPoolClient", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowedOauthFlowsUserPoolClient(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowedOauthFlowsUserPoolClient", java.util.Objects.requireNonNull(value, "allowedOauthFlowsUserPoolClient is required"));
    }

    public void setAllowedOauthFlowsUserPoolClient(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowedOauthFlowsUserPoolClient", java.util.Objects.requireNonNull(value, "allowedOauthFlowsUserPoolClient is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedOauthScopes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowedOauthScopes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowedOauthScopes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowedOauthScopes", java.util.Objects.requireNonNull(value, "allowedOauthScopes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAuthSessionValidity() {
        return software.amazon.jsii.Kernel.get(this, "authSessionValidity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAuthSessionValidity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "authSessionValidity", java.util.Objects.requireNonNull(value, "authSessionValidity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCallbackUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "callbackUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCallbackUrls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "callbackUrls", java.util.Objects.requireNonNull(value, "callbackUrls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultRedirectUri() {
        return software.amazon.jsii.Kernel.get(this, "defaultRedirectUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultRedirectUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultRedirectUri", java.util.Objects.requireNonNull(value, "defaultRedirectUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnablePropagateAdditionalUserContextData() {
        return software.amazon.jsii.Kernel.get(this, "enablePropagateAdditionalUserContextData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnablePropagateAdditionalUserContextData(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enablePropagateAdditionalUserContextData", java.util.Objects.requireNonNull(value, "enablePropagateAdditionalUserContextData is required"));
    }

    public void setEnablePropagateAdditionalUserContextData(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enablePropagateAdditionalUserContextData", java.util.Objects.requireNonNull(value, "enablePropagateAdditionalUserContextData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableTokenRevocation() {
        return software.amazon.jsii.Kernel.get(this, "enableTokenRevocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableTokenRevocation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableTokenRevocation", java.util.Objects.requireNonNull(value, "enableTokenRevocation is required"));
    }

    public void setEnableTokenRevocation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableTokenRevocation", java.util.Objects.requireNonNull(value, "enableTokenRevocation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExplicitAuthFlows() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "explicitAuthFlows", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExplicitAuthFlows(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "explicitAuthFlows", java.util.Objects.requireNonNull(value, "explicitAuthFlows is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getGenerateSecret() {
        return software.amazon.jsii.Kernel.get(this, "generateSecret", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setGenerateSecret(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "generateSecret", java.util.Objects.requireNonNull(value, "generateSecret is required"));
    }

    public void setGenerateSecret(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "generateSecret", java.util.Objects.requireNonNull(value, "generateSecret is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdTokenValidity() {
        return software.amazon.jsii.Kernel.get(this, "idTokenValidity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdTokenValidity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idTokenValidity", java.util.Objects.requireNonNull(value, "idTokenValidity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLogoutUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "logoutUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLogoutUrls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "logoutUrls", java.util.Objects.requireNonNull(value, "logoutUrls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreventUserExistenceErrors() {
        return software.amazon.jsii.Kernel.get(this, "preventUserExistenceErrors", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreventUserExistenceErrors(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preventUserExistenceErrors", java.util.Objects.requireNonNull(value, "preventUserExistenceErrors is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getReadAttributes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "readAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setReadAttributes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "readAttributes", java.util.Objects.requireNonNull(value, "readAttributes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRefreshTokenValidity() {
        return software.amazon.jsii.Kernel.get(this, "refreshTokenValidity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRefreshTokenValidity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "refreshTokenValidity", java.util.Objects.requireNonNull(value, "refreshTokenValidity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedIdentityProviders() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedIdentityProviders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSupportedIdentityProviders(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "supportedIdentityProviders", java.util.Objects.requireNonNull(value, "supportedIdentityProviders is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserPoolId() {
        return software.amazon.jsii.Kernel.get(this, "userPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserPoolId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userPoolId", java.util.Objects.requireNonNull(value, "userPoolId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getWriteAttributes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "writeAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setWriteAttributes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "writeAttributes", java.util.Objects.requireNonNull(value, "writeAttributes is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cognito_user_pool_client.CognitoUserPoolClient}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cognito_user_pool_client.CognitoUserPoolClient> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.cognito_user_pool_client.CognitoUserPoolClientConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cognito_user_pool_client.CognitoUserPoolClientConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#name CognitoUserPoolClient#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#name CognitoUserPoolClient#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#user_pool_id CognitoUserPoolClient#user_pool_id}.
         * <p>
         * @return {@code this}
         * @param userPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#user_pool_id CognitoUserPoolClient#user_pool_id}. This parameter is required.
         */
        public Builder userPoolId(final java.lang.String userPoolId) {
            this.config.userPoolId(userPoolId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#access_token_validity CognitoUserPoolClient#access_token_validity}.
         * <p>
         * @return {@code this}
         * @param accessTokenValidity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#access_token_validity CognitoUserPoolClient#access_token_validity}. This parameter is required.
         */
        public Builder accessTokenValidity(final java.lang.Number accessTokenValidity) {
            this.config.accessTokenValidity(accessTokenValidity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#allowed_oauth_flows CognitoUserPoolClient#allowed_oauth_flows}.
         * <p>
         * @return {@code this}
         * @param allowedOauthFlows Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#allowed_oauth_flows CognitoUserPoolClient#allowed_oauth_flows}. This parameter is required.
         */
        public Builder allowedOauthFlows(final java.util.List<java.lang.String> allowedOauthFlows) {
            this.config.allowedOauthFlows(allowedOauthFlows);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#allowed_oauth_flows_user_pool_client CognitoUserPoolClient#allowed_oauth_flows_user_pool_client}.
         * <p>
         * @return {@code this}
         * @param allowedOauthFlowsUserPoolClient Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#allowed_oauth_flows_user_pool_client CognitoUserPoolClient#allowed_oauth_flows_user_pool_client}. This parameter is required.
         */
        public Builder allowedOauthFlowsUserPoolClient(final java.lang.Boolean allowedOauthFlowsUserPoolClient) {
            this.config.allowedOauthFlowsUserPoolClient(allowedOauthFlowsUserPoolClient);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#allowed_oauth_flows_user_pool_client CognitoUserPoolClient#allowed_oauth_flows_user_pool_client}.
         * <p>
         * @return {@code this}
         * @param allowedOauthFlowsUserPoolClient Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#allowed_oauth_flows_user_pool_client CognitoUserPoolClient#allowed_oauth_flows_user_pool_client}. This parameter is required.
         */
        public Builder allowedOauthFlowsUserPoolClient(final com.hashicorp.cdktf.IResolvable allowedOauthFlowsUserPoolClient) {
            this.config.allowedOauthFlowsUserPoolClient(allowedOauthFlowsUserPoolClient);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#allowed_oauth_scopes CognitoUserPoolClient#allowed_oauth_scopes}.
         * <p>
         * @return {@code this}
         * @param allowedOauthScopes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#allowed_oauth_scopes CognitoUserPoolClient#allowed_oauth_scopes}. This parameter is required.
         */
        public Builder allowedOauthScopes(final java.util.List<java.lang.String> allowedOauthScopes) {
            this.config.allowedOauthScopes(allowedOauthScopes);
            return this;
        }

        /**
         * analytics_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#analytics_configuration CognitoUserPoolClient#analytics_configuration}
         * <p>
         * @return {@code this}
         * @param analyticsConfiguration analytics_configuration block. This parameter is required.
         */
        public Builder analyticsConfiguration(final com.hashicorp.cdktf.IResolvable analyticsConfiguration) {
            this.config.analyticsConfiguration(analyticsConfiguration);
            return this;
        }
        /**
         * analytics_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#analytics_configuration CognitoUserPoolClient#analytics_configuration}
         * <p>
         * @return {@code this}
         * @param analyticsConfiguration analytics_configuration block. This parameter is required.
         */
        public Builder analyticsConfiguration(final java.util.List<? extends imports.aws.cognito_user_pool_client.CognitoUserPoolClientAnalyticsConfiguration> analyticsConfiguration) {
            this.config.analyticsConfiguration(analyticsConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#auth_session_validity CognitoUserPoolClient#auth_session_validity}.
         * <p>
         * @return {@code this}
         * @param authSessionValidity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#auth_session_validity CognitoUserPoolClient#auth_session_validity}. This parameter is required.
         */
        public Builder authSessionValidity(final java.lang.Number authSessionValidity) {
            this.config.authSessionValidity(authSessionValidity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#callback_urls CognitoUserPoolClient#callback_urls}.
         * <p>
         * @return {@code this}
         * @param callbackUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#callback_urls CognitoUserPoolClient#callback_urls}. This parameter is required.
         */
        public Builder callbackUrls(final java.util.List<java.lang.String> callbackUrls) {
            this.config.callbackUrls(callbackUrls);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#default_redirect_uri CognitoUserPoolClient#default_redirect_uri}.
         * <p>
         * @return {@code this}
         * @param defaultRedirectUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#default_redirect_uri CognitoUserPoolClient#default_redirect_uri}. This parameter is required.
         */
        public Builder defaultRedirectUri(final java.lang.String defaultRedirectUri) {
            this.config.defaultRedirectUri(defaultRedirectUri);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#enable_propagate_additional_user_context_data CognitoUserPoolClient#enable_propagate_additional_user_context_data}.
         * <p>
         * @return {@code this}
         * @param enablePropagateAdditionalUserContextData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#enable_propagate_additional_user_context_data CognitoUserPoolClient#enable_propagate_additional_user_context_data}. This parameter is required.
         */
        public Builder enablePropagateAdditionalUserContextData(final java.lang.Boolean enablePropagateAdditionalUserContextData) {
            this.config.enablePropagateAdditionalUserContextData(enablePropagateAdditionalUserContextData);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#enable_propagate_additional_user_context_data CognitoUserPoolClient#enable_propagate_additional_user_context_data}.
         * <p>
         * @return {@code this}
         * @param enablePropagateAdditionalUserContextData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#enable_propagate_additional_user_context_data CognitoUserPoolClient#enable_propagate_additional_user_context_data}. This parameter is required.
         */
        public Builder enablePropagateAdditionalUserContextData(final com.hashicorp.cdktf.IResolvable enablePropagateAdditionalUserContextData) {
            this.config.enablePropagateAdditionalUserContextData(enablePropagateAdditionalUserContextData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#enable_token_revocation CognitoUserPoolClient#enable_token_revocation}.
         * <p>
         * @return {@code this}
         * @param enableTokenRevocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#enable_token_revocation CognitoUserPoolClient#enable_token_revocation}. This parameter is required.
         */
        public Builder enableTokenRevocation(final java.lang.Boolean enableTokenRevocation) {
            this.config.enableTokenRevocation(enableTokenRevocation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#enable_token_revocation CognitoUserPoolClient#enable_token_revocation}.
         * <p>
         * @return {@code this}
         * @param enableTokenRevocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#enable_token_revocation CognitoUserPoolClient#enable_token_revocation}. This parameter is required.
         */
        public Builder enableTokenRevocation(final com.hashicorp.cdktf.IResolvable enableTokenRevocation) {
            this.config.enableTokenRevocation(enableTokenRevocation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#explicit_auth_flows CognitoUserPoolClient#explicit_auth_flows}.
         * <p>
         * @return {@code this}
         * @param explicitAuthFlows Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#explicit_auth_flows CognitoUserPoolClient#explicit_auth_flows}. This parameter is required.
         */
        public Builder explicitAuthFlows(final java.util.List<java.lang.String> explicitAuthFlows) {
            this.config.explicitAuthFlows(explicitAuthFlows);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#generate_secret CognitoUserPoolClient#generate_secret}.
         * <p>
         * @return {@code this}
         * @param generateSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#generate_secret CognitoUserPoolClient#generate_secret}. This parameter is required.
         */
        public Builder generateSecret(final java.lang.Boolean generateSecret) {
            this.config.generateSecret(generateSecret);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#generate_secret CognitoUserPoolClient#generate_secret}.
         * <p>
         * @return {@code this}
         * @param generateSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#generate_secret CognitoUserPoolClient#generate_secret}. This parameter is required.
         */
        public Builder generateSecret(final com.hashicorp.cdktf.IResolvable generateSecret) {
            this.config.generateSecret(generateSecret);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#id_token_validity CognitoUserPoolClient#id_token_validity}.
         * <p>
         * @return {@code this}
         * @param idTokenValidity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#id_token_validity CognitoUserPoolClient#id_token_validity}. This parameter is required.
         */
        public Builder idTokenValidity(final java.lang.Number idTokenValidity) {
            this.config.idTokenValidity(idTokenValidity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#logout_urls CognitoUserPoolClient#logout_urls}.
         * <p>
         * @return {@code this}
         * @param logoutUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#logout_urls CognitoUserPoolClient#logout_urls}. This parameter is required.
         */
        public Builder logoutUrls(final java.util.List<java.lang.String> logoutUrls) {
            this.config.logoutUrls(logoutUrls);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#prevent_user_existence_errors CognitoUserPoolClient#prevent_user_existence_errors}.
         * <p>
         * @return {@code this}
         * @param preventUserExistenceErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#prevent_user_existence_errors CognitoUserPoolClient#prevent_user_existence_errors}. This parameter is required.
         */
        public Builder preventUserExistenceErrors(final java.lang.String preventUserExistenceErrors) {
            this.config.preventUserExistenceErrors(preventUserExistenceErrors);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#read_attributes CognitoUserPoolClient#read_attributes}.
         * <p>
         * @return {@code this}
         * @param readAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#read_attributes CognitoUserPoolClient#read_attributes}. This parameter is required.
         */
        public Builder readAttributes(final java.util.List<java.lang.String> readAttributes) {
            this.config.readAttributes(readAttributes);
            return this;
        }

        /**
         * refresh_token_rotation block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#refresh_token_rotation CognitoUserPoolClient#refresh_token_rotation}
         * <p>
         * @return {@code this}
         * @param refreshTokenRotation refresh_token_rotation block. This parameter is required.
         */
        public Builder refreshTokenRotation(final com.hashicorp.cdktf.IResolvable refreshTokenRotation) {
            this.config.refreshTokenRotation(refreshTokenRotation);
            return this;
        }
        /**
         * refresh_token_rotation block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#refresh_token_rotation CognitoUserPoolClient#refresh_token_rotation}
         * <p>
         * @return {@code this}
         * @param refreshTokenRotation refresh_token_rotation block. This parameter is required.
         */
        public Builder refreshTokenRotation(final java.util.List<? extends imports.aws.cognito_user_pool_client.CognitoUserPoolClientRefreshTokenRotation> refreshTokenRotation) {
            this.config.refreshTokenRotation(refreshTokenRotation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#refresh_token_validity CognitoUserPoolClient#refresh_token_validity}.
         * <p>
         * @return {@code this}
         * @param refreshTokenValidity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#refresh_token_validity CognitoUserPoolClient#refresh_token_validity}. This parameter is required.
         */
        public Builder refreshTokenValidity(final java.lang.Number refreshTokenValidity) {
            this.config.refreshTokenValidity(refreshTokenValidity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#supported_identity_providers CognitoUserPoolClient#supported_identity_providers}.
         * <p>
         * @return {@code this}
         * @param supportedIdentityProviders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#supported_identity_providers CognitoUserPoolClient#supported_identity_providers}. This parameter is required.
         */
        public Builder supportedIdentityProviders(final java.util.List<java.lang.String> supportedIdentityProviders) {
            this.config.supportedIdentityProviders(supportedIdentityProviders);
            return this;
        }

        /**
         * token_validity_units block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#token_validity_units CognitoUserPoolClient#token_validity_units}
         * <p>
         * @return {@code this}
         * @param tokenValidityUnits token_validity_units block. This parameter is required.
         */
        public Builder tokenValidityUnits(final com.hashicorp.cdktf.IResolvable tokenValidityUnits) {
            this.config.tokenValidityUnits(tokenValidityUnits);
            return this;
        }
        /**
         * token_validity_units block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#token_validity_units CognitoUserPoolClient#token_validity_units}
         * <p>
         * @return {@code this}
         * @param tokenValidityUnits token_validity_units block. This parameter is required.
         */
        public Builder tokenValidityUnits(final java.util.List<? extends imports.aws.cognito_user_pool_client.CognitoUserPoolClientTokenValidityUnits> tokenValidityUnits) {
            this.config.tokenValidityUnits(tokenValidityUnits);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#write_attributes CognitoUserPoolClient#write_attributes}.
         * <p>
         * @return {@code this}
         * @param writeAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#write_attributes CognitoUserPoolClient#write_attributes}. This parameter is required.
         */
        public Builder writeAttributes(final java.util.List<java.lang.String> writeAttributes) {
            this.config.writeAttributes(writeAttributes);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cognito_user_pool_client.CognitoUserPoolClient}.
         */
        @Override
        public imports.aws.cognito_user_pool_client.CognitoUserPoolClient build() {
            return new imports.aws.cognito_user_pool_client.CognitoUserPoolClient(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
