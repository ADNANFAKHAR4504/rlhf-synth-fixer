package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.279Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTableOpenTableFormatInputOutputReference")
public class GlueCatalogTableOpenTableFormatInputOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCatalogTableOpenTableFormatInputOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCatalogTableOpenTableFormatInputOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueCatalogTableOpenTableFormatInputOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIcebergInput(final @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput value) {
        software.amazon.jsii.Kernel.call(this, "putIcebergInput", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInputOutputReference getIcebergInput() {
        return software.amazon.jsii.Kernel.get(this, "icebergInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInputOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput getIcebergInputInput() {
        return software.amazon.jsii.Kernel.get(this, "icebergInputInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInputIcebergInput.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
