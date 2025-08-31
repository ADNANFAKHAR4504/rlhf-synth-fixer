package imports.aws.appsync_graphql_api;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api aws_appsync_graphql_api}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.071Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApi")
public class AppsyncGraphqlApi extends com.hashicorp.cdktf.TerraformResource {

    protected AppsyncGraphqlApi(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncGraphqlApi(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.appsync_graphql_api.AppsyncGraphqlApi.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api aws_appsync_graphql_api} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AppsyncGraphqlApi(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AppsyncGraphqlApi resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncGraphqlApi to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncGraphqlApi that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AppsyncGraphqlApi to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_graphql_api.AppsyncGraphqlApi.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AppsyncGraphqlApi resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncGraphqlApi to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncGraphqlApi that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_graphql_api.AppsyncGraphqlApi.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAdditionalAuthenticationProvider(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProvider>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProvider> __cast_cd4240 = (java.util.List<imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProvider>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProvider __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAdditionalAuthenticationProvider", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnhancedMetricsConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfig value) {
        software.amazon.jsii.Kernel.call(this, "putEnhancedMetricsConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaAuthorizerConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiLambdaAuthorizerConfig value) {
        software.amazon.jsii.Kernel.call(this, "putLambdaAuthorizerConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfig value) {
        software.amazon.jsii.Kernel.call(this, "putLogConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOpenidConnectConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiOpenidConnectConfig value) {
        software.amazon.jsii.Kernel.call(this, "putOpenidConnectConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUserPoolConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiUserPoolConfig value) {
        software.amazon.jsii.Kernel.call(this, "putUserPoolConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdditionalAuthenticationProvider() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalAuthenticationProvider", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApiType() {
        software.amazon.jsii.Kernel.call(this, "resetApiType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnhancedMetricsConfig() {
        software.amazon.jsii.Kernel.call(this, "resetEnhancedMetricsConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIntrospectionConfig() {
        software.amazon.jsii.Kernel.call(this, "resetIntrospectionConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaAuthorizerConfig() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaAuthorizerConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogConfig() {
        software.amazon.jsii.Kernel.call(this, "resetLogConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMergedApiExecutionRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetMergedApiExecutionRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpenidConnectConfig() {
        software.amazon.jsii.Kernel.call(this, "resetOpenidConnectConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueryDepthLimit() {
        software.amazon.jsii.Kernel.call(this, "resetQueryDepthLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResolverCountLimit() {
        software.amazon.jsii.Kernel.call(this, "resetResolverCountLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchema() {
        software.amazon.jsii.Kernel.call(this, "resetSchema", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserPoolConfig() {
        software.amazon.jsii.Kernel.call(this, "resetUserPoolConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVisibility() {
        software.amazon.jsii.Kernel.call(this, "resetVisibility", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXrayEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetXrayEnabled", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderList getAdditionalAuthenticationProvider() {
        return software.amazon.jsii.Kernel.get(this, "additionalAuthenticationProvider", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfigOutputReference getEnhancedMetricsConfig() {
        return software.amazon.jsii.Kernel.get(this, "enhancedMetricsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiLambdaAuthorizerConfigOutputReference getLambdaAuthorizerConfig() {
        return software.amazon.jsii.Kernel.get(this, "lambdaAuthorizerConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiLambdaAuthorizerConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfigOutputReference getLogConfig() {
        return software.amazon.jsii.Kernel.get(this, "logConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiOpenidConnectConfigOutputReference getOpenidConnectConfig() {
        return software.amazon.jsii.Kernel.get(this, "openidConnectConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiOpenidConnectConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getUris() {
        return software.amazon.jsii.Kernel.get(this, "uris", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_graphql_api.AppsyncGraphqlApiUserPoolConfigOutputReference getUserPoolConfig() {
        return software.amazon.jsii.Kernel.get(this, "userPoolConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiUserPoolConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAdditionalAuthenticationProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "additionalAuthenticationProviderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "apiTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfig getEnhancedMetricsConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "enhancedMetricsConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntrospectionConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "introspectionConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiLambdaAuthorizerConfig getLambdaAuthorizerConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaAuthorizerConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiLambdaAuthorizerConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfig getLogConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "logConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMergedApiExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "mergedApiExecutionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiOpenidConnectConfig getOpenidConnectConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "openidConnectConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiOpenidConnectConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getQueryDepthLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "queryDepthLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getResolverCountLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "resolverCountLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "schemaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiUserPoolConfig getUserPoolConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "userPoolConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiUserPoolConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVisibilityInput() {
        return software.amazon.jsii.Kernel.get(this, "visibilityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getXrayEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "xrayEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiType() {
        return software.amazon.jsii.Kernel.get(this, "apiType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiType", java.util.Objects.requireNonNull(value, "apiType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationType() {
        return software.amazon.jsii.Kernel.get(this, "authenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthenticationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authenticationType", java.util.Objects.requireNonNull(value, "authenticationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntrospectionConfig() {
        return software.amazon.jsii.Kernel.get(this, "introspectionConfig", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntrospectionConfig(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "introspectionConfig", java.util.Objects.requireNonNull(value, "introspectionConfig is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMergedApiExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "mergedApiExecutionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMergedApiExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mergedApiExecutionRoleArn", java.util.Objects.requireNonNull(value, "mergedApiExecutionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getQueryDepthLimit() {
        return software.amazon.jsii.Kernel.get(this, "queryDepthLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setQueryDepthLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "queryDepthLimit", java.util.Objects.requireNonNull(value, "queryDepthLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getResolverCountLimit() {
        return software.amazon.jsii.Kernel.get(this, "resolverCountLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setResolverCountLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "resolverCountLimit", java.util.Objects.requireNonNull(value, "resolverCountLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSchema() {
        return software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSchema(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "schema", java.util.Objects.requireNonNull(value, "schema is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVisibility() {
        return software.amazon.jsii.Kernel.get(this, "visibility", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVisibility(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "visibility", java.util.Objects.requireNonNull(value, "visibility is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getXrayEnabled() {
        return software.amazon.jsii.Kernel.get(this, "xrayEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setXrayEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "xrayEnabled", java.util.Objects.requireNonNull(value, "xrayEnabled is required"));
    }

    public void setXrayEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "xrayEnabled", java.util.Objects.requireNonNull(value, "xrayEnabled is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.appsync_graphql_api.AppsyncGraphqlApi}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.appsync_graphql_api.AppsyncGraphqlApi> {
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
        private final imports.aws.appsync_graphql_api.AppsyncGraphqlApiConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.appsync_graphql_api.AppsyncGraphqlApiConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#authentication_type AppsyncGraphqlApi#authentication_type}.
         * <p>
         * @return {@code this}
         * @param authenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#authentication_type AppsyncGraphqlApi#authentication_type}. This parameter is required.
         */
        public Builder authenticationType(final java.lang.String authenticationType) {
            this.config.authenticationType(authenticationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#name AppsyncGraphqlApi#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#name AppsyncGraphqlApi#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * additional_authentication_provider block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#additional_authentication_provider AppsyncGraphqlApi#additional_authentication_provider}
         * <p>
         * @return {@code this}
         * @param additionalAuthenticationProvider additional_authentication_provider block. This parameter is required.
         */
        public Builder additionalAuthenticationProvider(final com.hashicorp.cdktf.IResolvable additionalAuthenticationProvider) {
            this.config.additionalAuthenticationProvider(additionalAuthenticationProvider);
            return this;
        }
        /**
         * additional_authentication_provider block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#additional_authentication_provider AppsyncGraphqlApi#additional_authentication_provider}
         * <p>
         * @return {@code this}
         * @param additionalAuthenticationProvider additional_authentication_provider block. This parameter is required.
         */
        public Builder additionalAuthenticationProvider(final java.util.List<? extends imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProvider> additionalAuthenticationProvider) {
            this.config.additionalAuthenticationProvider(additionalAuthenticationProvider);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#api_type AppsyncGraphqlApi#api_type}.
         * <p>
         * @return {@code this}
         * @param apiType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#api_type AppsyncGraphqlApi#api_type}. This parameter is required.
         */
        public Builder apiType(final java.lang.String apiType) {
            this.config.apiType(apiType);
            return this;
        }

        /**
         * enhanced_metrics_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#enhanced_metrics_config AppsyncGraphqlApi#enhanced_metrics_config}
         * <p>
         * @return {@code this}
         * @param enhancedMetricsConfig enhanced_metrics_config block. This parameter is required.
         */
        public Builder enhancedMetricsConfig(final imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfig enhancedMetricsConfig) {
            this.config.enhancedMetricsConfig(enhancedMetricsConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#id AppsyncGraphqlApi#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#id AppsyncGraphqlApi#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#introspection_config AppsyncGraphqlApi#introspection_config}.
         * <p>
         * @return {@code this}
         * @param introspectionConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#introspection_config AppsyncGraphqlApi#introspection_config}. This parameter is required.
         */
        public Builder introspectionConfig(final java.lang.String introspectionConfig) {
            this.config.introspectionConfig(introspectionConfig);
            return this;
        }

        /**
         * lambda_authorizer_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#lambda_authorizer_config AppsyncGraphqlApi#lambda_authorizer_config}
         * <p>
         * @return {@code this}
         * @param lambdaAuthorizerConfig lambda_authorizer_config block. This parameter is required.
         */
        public Builder lambdaAuthorizerConfig(final imports.aws.appsync_graphql_api.AppsyncGraphqlApiLambdaAuthorizerConfig lambdaAuthorizerConfig) {
            this.config.lambdaAuthorizerConfig(lambdaAuthorizerConfig);
            return this;
        }

        /**
         * log_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#log_config AppsyncGraphqlApi#log_config}
         * <p>
         * @return {@code this}
         * @param logConfig log_config block. This parameter is required.
         */
        public Builder logConfig(final imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfig logConfig) {
            this.config.logConfig(logConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#merged_api_execution_role_arn AppsyncGraphqlApi#merged_api_execution_role_arn}.
         * <p>
         * @return {@code this}
         * @param mergedApiExecutionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#merged_api_execution_role_arn AppsyncGraphqlApi#merged_api_execution_role_arn}. This parameter is required.
         */
        public Builder mergedApiExecutionRoleArn(final java.lang.String mergedApiExecutionRoleArn) {
            this.config.mergedApiExecutionRoleArn(mergedApiExecutionRoleArn);
            return this;
        }

        /**
         * openid_connect_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#openid_connect_config AppsyncGraphqlApi#openid_connect_config}
         * <p>
         * @return {@code this}
         * @param openidConnectConfig openid_connect_config block. This parameter is required.
         */
        public Builder openidConnectConfig(final imports.aws.appsync_graphql_api.AppsyncGraphqlApiOpenidConnectConfig openidConnectConfig) {
            this.config.openidConnectConfig(openidConnectConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#query_depth_limit AppsyncGraphqlApi#query_depth_limit}.
         * <p>
         * @return {@code this}
         * @param queryDepthLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#query_depth_limit AppsyncGraphqlApi#query_depth_limit}. This parameter is required.
         */
        public Builder queryDepthLimit(final java.lang.Number queryDepthLimit) {
            this.config.queryDepthLimit(queryDepthLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#resolver_count_limit AppsyncGraphqlApi#resolver_count_limit}.
         * <p>
         * @return {@code this}
         * @param resolverCountLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#resolver_count_limit AppsyncGraphqlApi#resolver_count_limit}. This parameter is required.
         */
        public Builder resolverCountLimit(final java.lang.Number resolverCountLimit) {
            this.config.resolverCountLimit(resolverCountLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#schema AppsyncGraphqlApi#schema}.
         * <p>
         * @return {@code this}
         * @param schema Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#schema AppsyncGraphqlApi#schema}. This parameter is required.
         */
        public Builder schema(final java.lang.String schema) {
            this.config.schema(schema);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#tags AppsyncGraphqlApi#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#tags AppsyncGraphqlApi#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#tags_all AppsyncGraphqlApi#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#tags_all AppsyncGraphqlApi#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * user_pool_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#user_pool_config AppsyncGraphqlApi#user_pool_config}
         * <p>
         * @return {@code this}
         * @param userPoolConfig user_pool_config block. This parameter is required.
         */
        public Builder userPoolConfig(final imports.aws.appsync_graphql_api.AppsyncGraphqlApiUserPoolConfig userPoolConfig) {
            this.config.userPoolConfig(userPoolConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#visibility AppsyncGraphqlApi#visibility}.
         * <p>
         * @return {@code this}
         * @param visibility Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#visibility AppsyncGraphqlApi#visibility}. This parameter is required.
         */
        public Builder visibility(final java.lang.String visibility) {
            this.config.visibility(visibility);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#xray_enabled AppsyncGraphqlApi#xray_enabled}.
         * <p>
         * @return {@code this}
         * @param xrayEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#xray_enabled AppsyncGraphqlApi#xray_enabled}. This parameter is required.
         */
        public Builder xrayEnabled(final java.lang.Boolean xrayEnabled) {
            this.config.xrayEnabled(xrayEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#xray_enabled AppsyncGraphqlApi#xray_enabled}.
         * <p>
         * @return {@code this}
         * @param xrayEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#xray_enabled AppsyncGraphqlApi#xray_enabled}. This parameter is required.
         */
        public Builder xrayEnabled(final com.hashicorp.cdktf.IResolvable xrayEnabled) {
            this.config.xrayEnabled(xrayEnabled);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.appsync_graphql_api.AppsyncGraphqlApi}.
         */
        @Override
        public imports.aws.appsync_graphql_api.AppsyncGraphqlApi build() {
            return new imports.aws.appsync_graphql_api.AppsyncGraphqlApi(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
