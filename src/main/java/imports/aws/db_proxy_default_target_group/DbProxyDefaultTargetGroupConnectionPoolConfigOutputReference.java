package imports.aws.db_proxy_default_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.974Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dbProxyDefaultTargetGroup.DbProxyDefaultTargetGroupConnectionPoolConfigOutputReference")
public class DbProxyDefaultTargetGroupConnectionPoolConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DbProxyDefaultTargetGroupConnectionPoolConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DbProxyDefaultTargetGroupConnectionPoolConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DbProxyDefaultTargetGroupConnectionPoolConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConnectionBorrowTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionBorrowTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitQuery() {
        software.amazon.jsii.Kernel.call(this, "resetInitQuery", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxConnectionsPercent() {
        software.amazon.jsii.Kernel.call(this, "resetMaxConnectionsPercent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxIdleConnectionsPercent() {
        software.amazon.jsii.Kernel.call(this, "resetMaxIdleConnectionsPercent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSessionPinningFilters() {
        software.amazon.jsii.Kernel.call(this, "resetSessionPinningFilters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConnectionBorrowTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionBorrowTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInitQueryInput() {
        return software.amazon.jsii.Kernel.get(this, "initQueryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxConnectionsPercentInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConnectionsPercentInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxIdleConnectionsPercentInput() {
        return software.amazon.jsii.Kernel.get(this, "maxIdleConnectionsPercentInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSessionPinningFiltersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "sessionPinningFiltersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConnectionBorrowTimeout() {
        return software.amazon.jsii.Kernel.get(this, "connectionBorrowTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConnectionBorrowTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "connectionBorrowTimeout", java.util.Objects.requireNonNull(value, "connectionBorrowTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInitQuery() {
        return software.amazon.jsii.Kernel.get(this, "initQuery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInitQuery(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "initQuery", java.util.Objects.requireNonNull(value, "initQuery is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxConnectionsPercent() {
        return software.amazon.jsii.Kernel.get(this, "maxConnectionsPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxConnectionsPercent(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxConnectionsPercent", java.util.Objects.requireNonNull(value, "maxConnectionsPercent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxIdleConnectionsPercent() {
        return software.amazon.jsii.Kernel.get(this, "maxIdleConnectionsPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxIdleConnectionsPercent(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxIdleConnectionsPercent", java.util.Objects.requireNonNull(value, "maxIdleConnectionsPercent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSessionPinningFilters() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "sessionPinningFilters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSessionPinningFilters(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "sessionPinningFilters", java.util.Objects.requireNonNull(value, "sessionPinningFilters is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.db_proxy_default_target_group.DbProxyDefaultTargetGroupConnectionPoolConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.db_proxy_default_target_group.DbProxyDefaultTargetGroupConnectionPoolConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.db_proxy_default_target_group.DbProxyDefaultTargetGroupConnectionPoolConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
