package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.008Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorOutputReference")
public class AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putErrorHandlingConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorErrorHandlingConfig value) {
        software.amazon.jsii.Kernel.call(this, "putErrorHandlingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomProperties() {
        software.amazon.jsii.Kernel.call(this, "resetCustomProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetErrorHandlingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetErrorHandlingConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdFieldNames() {
        software.amazon.jsii.Kernel.call(this, "resetIdFieldNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWriteOperationType() {
        software.amazon.jsii.Kernel.call(this, "resetWriteOperationType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorErrorHandlingConfigOutputReference getErrorHandlingConfig() {
        return software.amazon.jsii.Kernel.get(this, "errorHandlingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorErrorHandlingConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getCustomPropertiesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customPropertiesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEntityNameInput() {
        return software.amazon.jsii.Kernel.get(this, "entityNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorErrorHandlingConfig getErrorHandlingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "errorHandlingConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnectorErrorHandlingConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIdFieldNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "idFieldNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWriteOperationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "writeOperationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getCustomProperties() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "customProperties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomProperties(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customProperties", java.util.Objects.requireNonNull(value, "customProperties is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEntityName() {
        return software.amazon.jsii.Kernel.get(this, "entityName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEntityName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "entityName", java.util.Objects.requireNonNull(value, "entityName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIdFieldNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "idFieldNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIdFieldNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "idFieldNames", java.util.Objects.requireNonNull(value, "idFieldNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWriteOperationType() {
        return software.amazon.jsii.Kernel.get(this, "writeOperationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWriteOperationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "writeOperationType", java.util.Objects.requireNonNull(value, "writeOperationType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnector getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnector.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesCustomConnector value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
