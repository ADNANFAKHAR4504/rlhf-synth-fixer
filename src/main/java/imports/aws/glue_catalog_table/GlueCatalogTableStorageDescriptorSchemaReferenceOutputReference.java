package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.284Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTableStorageDescriptorSchemaReferenceOutputReference")
public class GlueCatalogTableStorageDescriptorSchemaReferenceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCatalogTableStorageDescriptorSchemaReferenceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCatalogTableStorageDescriptorSchemaReferenceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueCatalogTableStorageDescriptorSchemaReferenceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSchemaId(final @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId value) {
        software.amazon.jsii.Kernel.call(this, "putSchemaId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSchemaId() {
        software.amazon.jsii.Kernel.call(this, "resetSchemaId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchemaVersionId() {
        software.amazon.jsii.Kernel.call(this, "resetSchemaVersionId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaIdOutputReference getSchemaId() {
        return software.amazon.jsii.Kernel.get(this, "schemaId", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaIdOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId getSchemaIdInput() {
        return software.amazon.jsii.Kernel.get(this, "schemaIdInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSchemaVersionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "schemaVersionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSchemaVersionNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "schemaVersionNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSchemaVersionId() {
        return software.amazon.jsii.Kernel.get(this, "schemaVersionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSchemaVersionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "schemaVersionId", java.util.Objects.requireNonNull(value, "schemaVersionId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSchemaVersionNumber() {
        return software.amazon.jsii.Kernel.get(this, "schemaVersionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSchemaVersionNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "schemaVersionNumber", java.util.Objects.requireNonNull(value, "schemaVersionNumber is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReference getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReference.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReference value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
