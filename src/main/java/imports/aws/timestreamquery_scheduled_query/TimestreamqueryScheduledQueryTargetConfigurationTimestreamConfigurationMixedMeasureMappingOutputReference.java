package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.555Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference")
public class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putMultiMeasureAttributeMapping(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMultiMeasureAttributeMapping", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMeasureName() {
        software.amazon.jsii.Kernel.call(this, "resetMeasureName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiMeasureAttributeMapping() {
        software.amazon.jsii.Kernel.call(this, "resetMultiMeasureAttributeMapping", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceColumn() {
        software.amazon.jsii.Kernel.call(this, "resetSourceColumn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetMeasureName() {
        software.amazon.jsii.Kernel.call(this, "resetTargetMeasureName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingList getMultiMeasureAttributeMapping() {
        return software.amazon.jsii.Kernel.get(this, "multiMeasureAttributeMapping", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMappingList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMeasureNameInput() {
        return software.amazon.jsii.Kernel.get(this, "measureNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMeasureValueTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "measureValueTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiMeasureAttributeMappingInput() {
        return software.amazon.jsii.Kernel.get(this, "multiMeasureAttributeMappingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceColumnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceColumnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetMeasureNameInput() {
        return software.amazon.jsii.Kernel.get(this, "targetMeasureNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMeasureName() {
        return software.amazon.jsii.Kernel.get(this, "measureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMeasureName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "measureName", java.util.Objects.requireNonNull(value, "measureName is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetMeasureName() {
        return software.amazon.jsii.Kernel.get(this, "targetMeasureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetMeasureName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetMeasureName", java.util.Objects.requireNonNull(value, "targetMeasureName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
