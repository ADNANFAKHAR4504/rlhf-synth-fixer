package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference")
public class QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putColumnDescription(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription value) {
        software.amazon.jsii.Kernel.call(this, "putColumnDescription", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetColumnDescription() {
        software.amazon.jsii.Kernel.call(this, "resetColumnDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColumnGeographicRole() {
        software.amazon.jsii.Kernel.call(this, "resetColumnGeographicRole", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescriptionOutputReference getColumnDescription() {
        return software.amazon.jsii.Kernel.get(this, "columnDescription", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescriptionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription getColumnDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "columnDescriptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTagsColumnDescription.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColumnGeographicRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "columnGeographicRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColumnGeographicRole() {
        return software.amazon.jsii.Kernel.get(this, "columnGeographicRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColumnGeographicRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "columnGeographicRole", java.util.Objects.requireNonNull(value, "columnGeographicRole is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperationTags value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
