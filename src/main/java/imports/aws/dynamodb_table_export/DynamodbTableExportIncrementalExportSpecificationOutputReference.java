package imports.aws.dynamodb_table_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.055Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTableExport.DynamodbTableExportIncrementalExportSpecificationOutputReference")
public class DynamodbTableExportIncrementalExportSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DynamodbTableExportIncrementalExportSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DynamodbTableExportIncrementalExportSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DynamodbTableExportIncrementalExportSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetExportFromTime() {
        software.amazon.jsii.Kernel.call(this, "resetExportFromTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportToTime() {
        software.amazon.jsii.Kernel.call(this, "resetExportToTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportViewType() {
        software.amazon.jsii.Kernel.call(this, "resetExportViewType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExportFromTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "exportFromTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExportToTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "exportToTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExportViewTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "exportViewTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportFromTime() {
        return software.amazon.jsii.Kernel.get(this, "exportFromTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExportFromTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exportFromTime", java.util.Objects.requireNonNull(value, "exportFromTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportToTime() {
        return software.amazon.jsii.Kernel.get(this, "exportToTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExportToTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exportToTime", java.util.Objects.requireNonNull(value, "exportToTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportViewType() {
        return software.amazon.jsii.Kernel.get(this, "exportViewType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExportViewType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exportViewType", java.util.Objects.requireNonNull(value, "exportViewType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
