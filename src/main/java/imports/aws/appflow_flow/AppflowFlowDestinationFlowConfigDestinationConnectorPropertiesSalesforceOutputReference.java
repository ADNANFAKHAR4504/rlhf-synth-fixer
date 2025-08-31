package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceOutputReference")
public class AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putErrorHandlingConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfig value) {
        software.amazon.jsii.Kernel.call(this, "putErrorHandlingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataTransferApi() {
        software.amazon.jsii.Kernel.call(this, "resetDataTransferApi", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfigOutputReference getErrorHandlingConfig() {
        return software.amazon.jsii.Kernel.get(this, "errorHandlingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataTransferApiInput() {
        return software.amazon.jsii.Kernel.get(this, "dataTransferApiInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfig getErrorHandlingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "errorHandlingConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIdFieldNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "idFieldNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectInput() {
        return software.amazon.jsii.Kernel.get(this, "objectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWriteOperationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "writeOperationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataTransferApi() {
        return software.amazon.jsii.Kernel.get(this, "dataTransferApi", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataTransferApi(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataTransferApi", java.util.Objects.requireNonNull(value, "dataTransferApi is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIdFieldNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "idFieldNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIdFieldNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "idFieldNames", java.util.Objects.requireNonNull(value, "idFieldNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObject() {
        return software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObject(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "object", java.util.Objects.requireNonNull(value, "object is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWriteOperationType() {
        return software.amazon.jsii.Kernel.get(this, "writeOperationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWriteOperationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "writeOperationType", java.util.Objects.requireNonNull(value, "writeOperationType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforce getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforce.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforce value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
