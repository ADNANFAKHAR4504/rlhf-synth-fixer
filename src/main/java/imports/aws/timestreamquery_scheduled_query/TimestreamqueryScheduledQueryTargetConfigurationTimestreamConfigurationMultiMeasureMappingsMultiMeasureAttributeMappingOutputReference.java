package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.555Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference")
public class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMappingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetTargetMultiMeasureAttributeName() {
        software.amazon.jsii.Kernel.call(this, "resetTargetMultiMeasureAttributeName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMeasureValueTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "measureValueTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceColumnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceColumnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetMultiMeasureAttributeNameInput() {
        return software.amazon.jsii.Kernel.get(this, "targetMultiMeasureAttributeNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMeasureValueType() {
        return software.amazon.jsii.Kernel.get(this, "measureValueType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMeasureValueType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "measureValueType", java.util.Objects.requireNonNull(value, "measureValueType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceColumn() {
        return software.amazon.jsii.Kernel.get(this, "sourceColumn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceColumn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceColumn", java.util.Objects.requireNonNull(value, "sourceColumn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetMultiMeasureAttributeName() {
        return software.amazon.jsii.Kernel.get(this, "targetMultiMeasureAttributeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetMultiMeasureAttributeName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetMultiMeasureAttributeName", java.util.Objects.requireNonNull(value, "targetMultiMeasureAttributeName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
