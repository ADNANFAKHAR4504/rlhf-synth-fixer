package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowTaskOutputReference")
public class AppflowFlowTaskOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowTaskOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowTaskOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AppflowFlowTaskOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putConnectorOperator(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.appflow_flow.AppflowFlowTaskConnectorOperator>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.appflow_flow.AppflowFlowTaskConnectorOperator> __cast_cd4240 = (java.util.List<imports.aws.appflow_flow.AppflowFlowTaskConnectorOperator>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.appflow_flow.AppflowFlowTaskConnectorOperator __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConnectorOperator", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConnectorOperator() {
        software.amazon.jsii.Kernel.call(this, "resetConnectorOperator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationField() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceFields() {
        software.amazon.jsii.Kernel.call(this, "resetSourceFields", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskProperties() {
        software.amazon.jsii.Kernel.call(this, "resetTaskProperties", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowTaskConnectorOperatorList getConnectorOperator() {
        return software.amazon.jsii.Kernel.get(this, "connectorOperator", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowTaskConnectorOperatorList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConnectorOperatorInput() {
        return software.amazon.jsii.Kernel.get(this, "connectorOperatorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSourceFieldsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "sourceFieldsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTaskPropertiesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "taskPropertiesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "taskTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationField() {
        return software.amazon.jsii.Kernel.get(this, "destinationField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationField", java.util.Objects.requireNonNull(value, "destinationField is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSourceFields() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "sourceFields", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSourceFields(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "sourceFields", java.util.Objects.requireNonNull(value, "sourceFields is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTaskProperties() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "taskProperties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTaskProperties(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "taskProperties", java.util.Objects.requireNonNull(value, "taskProperties is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskType() {
        return software.amazon.jsii.Kernel.get(this, "taskType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskType", java.util.Objects.requireNonNull(value, "taskType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowTask value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
