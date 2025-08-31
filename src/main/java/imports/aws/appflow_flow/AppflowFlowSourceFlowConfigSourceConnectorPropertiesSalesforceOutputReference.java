package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforceOutputReference")
public class AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDataTransferApi() {
        software.amazon.jsii.Kernel.call(this, "resetDataTransferApi", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDynamicFieldUpdate() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDynamicFieldUpdate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeDeletedRecords() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeDeletedRecords", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataTransferApiInput() {
        return software.amazon.jsii.Kernel.get(this, "dataTransferApiInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDynamicFieldUpdateInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDynamicFieldUpdateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeDeletedRecordsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeDeletedRecordsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectInput() {
        return software.amazon.jsii.Kernel.get(this, "objectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataTransferApi() {
        return software.amazon.jsii.Kernel.get(this, "dataTransferApi", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataTransferApi(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataTransferApi", java.util.Objects.requireNonNull(value, "dataTransferApi is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDynamicFieldUpdate() {
        return software.amazon.jsii.Kernel.get(this, "enableDynamicFieldUpdate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDynamicFieldUpdate(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDynamicFieldUpdate", java.util.Objects.requireNonNull(value, "enableDynamicFieldUpdate is required"));
    }

    public void setEnableDynamicFieldUpdate(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDynamicFieldUpdate", java.util.Objects.requireNonNull(value, "enableDynamicFieldUpdate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeDeletedRecords() {
        return software.amazon.jsii.Kernel.get(this, "includeDeletedRecords", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeDeletedRecords(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeDeletedRecords", java.util.Objects.requireNonNull(value, "includeDeletedRecords is required"));
    }

    public void setIncludeDeletedRecords(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeDeletedRecords", java.util.Objects.requireNonNull(value, "includeDeletedRecords is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObject() {
        return software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObject(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "object", java.util.Objects.requireNonNull(value, "object is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
