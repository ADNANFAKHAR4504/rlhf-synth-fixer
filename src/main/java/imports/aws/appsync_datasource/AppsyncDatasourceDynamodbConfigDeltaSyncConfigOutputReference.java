package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfigOutputReference")
public class AppsyncDatasourceDynamodbConfigDeltaSyncConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncDatasourceDynamodbConfigDeltaSyncConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncDatasourceDynamodbConfigDeltaSyncConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncDatasourceDynamodbConfigDeltaSyncConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBaseTableTtl() {
        software.amazon.jsii.Kernel.call(this, "resetBaseTableTtl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeltaSyncTableTtl() {
        software.amazon.jsii.Kernel.call(this, "resetDeltaSyncTableTtl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBaseTableTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "baseTableTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeltaSyncTableNameInput() {
        return software.amazon.jsii.Kernel.get(this, "deltaSyncTableNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDeltaSyncTableTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "deltaSyncTableTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBaseTableTtl() {
        return software.amazon.jsii.Kernel.get(this, "baseTableTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBaseTableTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "baseTableTtl", java.util.Objects.requireNonNull(value, "baseTableTtl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeltaSyncTableName() {
        return software.amazon.jsii.Kernel.get(this, "deltaSyncTableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeltaSyncTableName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deltaSyncTableName", java.util.Objects.requireNonNull(value, "deltaSyncTableName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDeltaSyncTableTtl() {
        return software.amazon.jsii.Kernel.get(this, "deltaSyncTableTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDeltaSyncTableTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "deltaSyncTableTtl", java.util.Objects.requireNonNull(value, "deltaSyncTableTtl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
