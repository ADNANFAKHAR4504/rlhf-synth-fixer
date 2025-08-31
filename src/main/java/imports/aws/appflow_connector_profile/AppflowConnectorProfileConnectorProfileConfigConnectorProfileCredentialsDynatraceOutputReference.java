package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.002Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDynatraceOutputReference")
public class AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDynatraceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDynatraceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDynatraceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDynatraceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "apiTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiToken() {
        return software.amazon.jsii.Kernel.get(this, "apiToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiToken", java.util.Objects.requireNonNull(value, "apiToken is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDynatrace getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDynatrace.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDynatrace value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
