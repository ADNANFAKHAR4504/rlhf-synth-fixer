package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.288Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerCatalogTargetOutputReference")
public class GlueCrawlerCatalogTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCrawlerCatalogTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCrawlerCatalogTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlueCrawlerCatalogTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetConnectionName() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDlqEventQueueArn() {
        software.amazon.jsii.Kernel.call(this, "resetDlqEventQueueArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventQueueArn() {
        software.amazon.jsii.Kernel.call(this, "resetEventQueueArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDlqEventQueueArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dlqEventQueueArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventQueueArnInput() {
        return software.amazon.jsii.Kernel.get(this, "eventQueueArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTablesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tablesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionName() {
        return software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionName", java.util.Objects.requireNonNull(value, "connectionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseName", java.util.Objects.requireNonNull(value, "databaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDlqEventQueueArn() {
        return software.amazon.jsii.Kernel.get(this, "dlqEventQueueArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDlqEventQueueArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dlqEventQueueArn", java.util.Objects.requireNonNull(value, "dlqEventQueueArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventQueueArn() {
        return software.amazon.jsii.Kernel.get(this, "eventQueueArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventQueueArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventQueueArn", java.util.Objects.requireNonNull(value, "eventQueueArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTables() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tables", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTables(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tables", java.util.Objects.requireNonNull(value, "tables is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerCatalogTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
