package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceRelationalDatabaseConfigOutputReference")
public class AppsyncDatasourceRelationalDatabaseConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncDatasourceRelationalDatabaseConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncDatasourceRelationalDatabaseConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncDatasourceRelationalDatabaseConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHttpEndpointConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig value) {
        software.amazon.jsii.Kernel.call(this, "putHttpEndpointConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHttpEndpointConfig() {
        software.amazon.jsii.Kernel.call(this, "resetHttpEndpointConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceType() {
        software.amazon.jsii.Kernel.call(this, "resetSourceType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfigOutputReference getHttpEndpointConfig() {
        return software.amazon.jsii.Kernel.get(this, "httpEndpointConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig getHttpEndpointConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "httpEndpointConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceType() {
        return software.amazon.jsii.Kernel.get(this, "sourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceType", java.util.Objects.requireNonNull(value, "sourceType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
