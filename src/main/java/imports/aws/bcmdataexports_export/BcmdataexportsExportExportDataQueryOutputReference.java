package imports.aws.bcmdataexports_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.137Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bcmdataexportsExport.BcmdataexportsExportExportDataQueryOutputReference")
public class BcmdataexportsExportExportDataQueryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BcmdataexportsExportExportDataQueryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BcmdataexportsExportExportDataQueryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BcmdataexportsExportExportDataQueryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetTableConfigurations() {
        software.amazon.jsii.Kernel.call(this, "resetTableConfigurations", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQueryStatementInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStatementInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTableConfigurationsInput() {
        return software.amazon.jsii.Kernel.get(this, "tableConfigurationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQueryStatement() {
        return software.amazon.jsii.Kernel.get(this, "queryStatement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQueryStatement(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "queryStatement", java.util.Objects.requireNonNull(value, "queryStatement is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTableConfigurations() {
        return software.amazon.jsii.Kernel.get(this, "tableConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTableConfigurations(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "tableConfigurations", java.util.Objects.requireNonNull(value, "tableConfigurations is required"));
    }

    public void setTableConfigurations(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.util.Map<java.lang.String, java.lang.String>> value) {
        software.amazon.jsii.Kernel.set(this, "tableConfigurations", java.util.Objects.requireNonNull(value, "tableConfigurations is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bcmdataexports_export.BcmdataexportsExportExportDataQuery value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
