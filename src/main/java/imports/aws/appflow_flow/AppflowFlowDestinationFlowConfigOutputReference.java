package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigOutputReference")
public class AppflowFlowDestinationFlowConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowDestinationFlowConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowDestinationFlowConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AppflowFlowDestinationFlowConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDestinationConnectorProperties(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties value) {
        software.amazon.jsii.Kernel.call(this, "putDestinationConnectorProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApiVersion() {
        software.amazon.jsii.Kernel.call(this, "resetApiVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectorProfileName() {
        software.amazon.jsii.Kernel.call(this, "resetConnectorProfileName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesOutputReference getDestinationConnectorProperties() {
        return software.amazon.jsii.Kernel.get(this, "destinationConnectorProperties", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "apiVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectorProfileNameInput() {
        return software.amazon.jsii.Kernel.get(this, "connectorProfileNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectorTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "connectorTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties getDestinationConnectorPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationConnectorPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorProperties.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiVersion() {
        return software.amazon.jsii.Kernel.get(this, "apiVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiVersion", java.util.Objects.requireNonNull(value, "apiVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectorProfileName() {
        return software.amazon.jsii.Kernel.get(this, "connectorProfileName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectorProfileName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectorProfileName", java.util.Objects.requireNonNull(value, "connectorProfileName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectorType() {
        return software.amazon.jsii.Kernel.get(this, "connectorType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectorType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectorType", java.util.Objects.requireNonNull(value, "connectorType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
