package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.555Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference")
public class TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDimensionMapping(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDimensionMapping", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMixedMeasureMapping(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMixedMeasureMapping", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMultiMeasureMappings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMultiMeasureMappings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDimensionMapping() {
        software.amazon.jsii.Kernel.call(this, "resetDimensionMapping", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMeasureNameColumn() {
        software.amazon.jsii.Kernel.call(this, "resetMeasureNameColumn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMixedMeasureMapping() {
        software.amazon.jsii.Kernel.call(this, "resetMixedMeasureMapping", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiMeasureMappings() {
        software.amazon.jsii.Kernel.call(this, "resetMultiMeasureMappings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingList getDimensionMapping() {
        return software.amazon.jsii.Kernel.get(this, "dimensionMapping", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMappingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingList getMixedMeasureMapping() {
        return software.amazon.jsii.Kernel.get(this, "mixedMeasureMapping", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsList getMultiMeasureMappings() {
        return software.amazon.jsii.Kernel.get(this, "multiMeasureMappings", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDimensionMappingInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionMappingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMeasureNameColumnInput() {
        return software.amazon.jsii.Kernel.get(this, "measureNameColumnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMixedMeasureMappingInput() {
        return software.amazon.jsii.Kernel.get(this, "mixedMeasureMappingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiMeasureMappingsInput() {
        return software.amazon.jsii.Kernel.get(this, "multiMeasureMappingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableNameInput() {
        return software.amazon.jsii.Kernel.get(this, "tableNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimeColumnInput() {
        return software.amazon.jsii.Kernel.get(this, "timeColumnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseName", java.util.Objects.requireNonNull(value, "databaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMeasureNameColumn() {
        return software.amazon.jsii.Kernel.get(this, "measureNameColumn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMeasureNameColumn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "measureNameColumn", java.util.Objects.requireNonNull(value, "measureNameColumn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTableName() {
        return software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTableName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tableName", java.util.Objects.requireNonNull(value, "tableName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimeColumn() {
        return software.amazon.jsii.Kernel.get(this, "timeColumn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimeColumn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timeColumn", java.util.Objects.requireNonNull(value, "timeColumn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
