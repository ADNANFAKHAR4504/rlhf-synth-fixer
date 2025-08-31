package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.289Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerDeltaTargetOutputReference")
public class GlueCrawlerDeltaTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCrawlerDeltaTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCrawlerDeltaTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlueCrawlerDeltaTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetConnectionName() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreateNativeDeltaTable() {
        software.amazon.jsii.Kernel.call(this, "resetCreateNativeDeltaTable", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCreateNativeDeltaTableInput() {
        return software.amazon.jsii.Kernel.get(this, "createNativeDeltaTableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDeltaTablesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "deltaTablesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWriteManifestInput() {
        return software.amazon.jsii.Kernel.get(this, "writeManifestInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionName() {
        return software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionName", java.util.Objects.requireNonNull(value, "connectionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCreateNativeDeltaTable() {
        return software.amazon.jsii.Kernel.get(this, "createNativeDeltaTable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCreateNativeDeltaTable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "createNativeDeltaTable", java.util.Objects.requireNonNull(value, "createNativeDeltaTable is required"));
    }

    public void setCreateNativeDeltaTable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "createNativeDeltaTable", java.util.Objects.requireNonNull(value, "createNativeDeltaTable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDeltaTables() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "deltaTables", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDeltaTables(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "deltaTables", java.util.Objects.requireNonNull(value, "deltaTables is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWriteManifest() {
        return software.amazon.jsii.Kernel.get(this, "writeManifest", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWriteManifest(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "writeManifest", java.util.Objects.requireNonNull(value, "writeManifest is required"));
    }

    public void setWriteManifest(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "writeManifest", java.util.Objects.requireNonNull(value, "writeManifest is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerDeltaTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
