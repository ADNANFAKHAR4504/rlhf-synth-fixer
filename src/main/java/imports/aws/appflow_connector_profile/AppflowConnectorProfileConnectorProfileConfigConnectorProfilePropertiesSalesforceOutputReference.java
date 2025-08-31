package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforceOutputReference")
public class AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetInstanceUrl() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIsSandboxEnvironment() {
        software.amazon.jsii.Kernel.call(this, "resetIsSandboxEnvironment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUsePrivatelinkForMetadataAndAuthorization() {
        software.amazon.jsii.Kernel.call(this, "resetUsePrivatelinkForMetadataAndAuthorization", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsSandboxEnvironmentInput() {
        return software.amazon.jsii.Kernel.get(this, "isSandboxEnvironmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUsePrivatelinkForMetadataAndAuthorizationInput() {
        return software.amazon.jsii.Kernel.get(this, "usePrivatelinkForMetadataAndAuthorizationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceUrl() {
        return software.amazon.jsii.Kernel.get(this, "instanceUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceUrl", java.util.Objects.requireNonNull(value, "instanceUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsSandboxEnvironment() {
        return software.amazon.jsii.Kernel.get(this, "isSandboxEnvironment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsSandboxEnvironment(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isSandboxEnvironment", java.util.Objects.requireNonNull(value, "isSandboxEnvironment is required"));
    }

    public void setIsSandboxEnvironment(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isSandboxEnvironment", java.util.Objects.requireNonNull(value, "isSandboxEnvironment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUsePrivatelinkForMetadataAndAuthorization() {
        return software.amazon.jsii.Kernel.get(this, "usePrivatelinkForMetadataAndAuthorization", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUsePrivatelinkForMetadataAndAuthorization(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "usePrivatelinkForMetadataAndAuthorization", java.util.Objects.requireNonNull(value, "usePrivatelinkForMetadataAndAuthorization is required"));
    }

    public void setUsePrivatelinkForMetadataAndAuthorization(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "usePrivatelinkForMetadataAndAuthorization", java.util.Objects.requireNonNull(value, "usePrivatelinkForMetadataAndAuthorization is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSalesforce value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
