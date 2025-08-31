package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceHttpConfigOutputReference")
public class AppsyncDatasourceHttpConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncDatasourceHttpConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncDatasourceHttpConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncDatasourceHttpConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAuthorizationConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putAuthorizationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuthorizationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfigOutputReference getAuthorizationConfig() {
        return software.amazon.jsii.Kernel.get(this, "authorizationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig getAuthorizationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigAuthorizationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpoint", java.util.Objects.requireNonNull(value, "endpoint is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
