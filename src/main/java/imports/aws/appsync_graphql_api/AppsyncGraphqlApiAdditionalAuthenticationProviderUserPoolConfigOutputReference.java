package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.072Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfigOutputReference")
public class AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAppIdClientRegex() {
        software.amazon.jsii.Kernel.call(this, "resetAppIdClientRegex", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAwsRegion() {
        software.amazon.jsii.Kernel.call(this, "resetAwsRegion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppIdClientRegexInput() {
        return software.amazon.jsii.Kernel.get(this, "appIdClientRegexInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "awsRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "userPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppIdClientRegex() {
        return software.amazon.jsii.Kernel.get(this, "appIdClientRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppIdClientRegex(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appIdClientRegex", java.util.Objects.requireNonNull(value, "appIdClientRegex is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsRegion() {
        return software.amazon.jsii.Kernel.get(this, "awsRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsRegion", java.util.Objects.requireNonNull(value, "awsRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserPoolId() {
        return software.amazon.jsii.Kernel.get(this, "userPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserPoolId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userPoolId", java.util.Objects.requireNonNull(value, "userPoolId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiAdditionalAuthenticationProviderUserPoolConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
