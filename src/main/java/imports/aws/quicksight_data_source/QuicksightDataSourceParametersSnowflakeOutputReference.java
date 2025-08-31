package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.116Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersSnowflakeOutputReference")
public class QuicksightDataSourceParametersSnowflakeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSourceParametersSnowflakeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSourceParametersSnowflakeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSourceParametersSnowflakeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostInput() {
        return software.amazon.jsii.Kernel.get(this, "hostInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWarehouseInput() {
        return software.amazon.jsii.Kernel.get(this, "warehouseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabase() {
        return software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabase(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "database", java.util.Objects.requireNonNull(value, "database is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHost() {
        return software.amazon.jsii.Kernel.get(this, "host", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHost(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "host", java.util.Objects.requireNonNull(value, "host is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWarehouse() {
        return software.amazon.jsii.Kernel.get(this, "warehouse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWarehouse(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "warehouse", java.util.Objects.requireNonNull(value, "warehouse is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersSnowflake getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersSnowflake.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersSnowflake value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
