package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.133Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthorityOutputReference")
public class EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthorityOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthorityOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthorityOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthorityOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsPcaAuthorityArnInput() {
        return software.amazon.jsii.Kernel.get(this, "awsPcaAuthorityArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsPcaAuthorityArn() {
        return software.amazon.jsii.Kernel.get(this, "awsPcaAuthorityArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsPcaAuthorityArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsPcaAuthorityArn", java.util.Objects.requireNonNull(value, "awsPcaAuthorityArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
