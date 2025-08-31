package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.072Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfigOutputReference")
public class AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuthorizerResultTtlInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizerResultTtlInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentityValidationExpression() {
        software.amazon.jsii.Kernel.call(this, "resetIdentityValidationExpression", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAuthorizerResultTtlInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizerResultTtlInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerUriInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizerUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityValidationExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "identityValidationExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAuthorizerResultTtlInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "authorizerResultTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAuthorizerResultTtlInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "authorizerResultTtlInSeconds", java.util.Objects.requireNonNull(value, "authorizerResultTtlInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthorizerUri() {
        return software.amazon.jsii.Kernel.get(this, "authorizerUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthorizerUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authorizerUri", java.util.Objects.requireNonNull(value, "authorizerUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityValidationExpression() {
        return software.amazon.jsii.Kernel.get(this, "identityValidationExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityValidationExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityValidationExpression", java.util.Objects.requireNonNull(value, "identityValidationExpression is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderLambdaAuthorizerConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
