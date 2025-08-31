package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.990Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainSoftwareUpdateOptionsOutputReference")
public class OpensearchDomainSoftwareUpdateOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpensearchDomainSoftwareUpdateOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchDomainSoftwareUpdateOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpensearchDomainSoftwareUpdateOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAutoSoftwareUpdateEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAutoSoftwareUpdateEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoSoftwareUpdateEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "autoSoftwareUpdateEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoSoftwareUpdateEnabled() {
        return software.amazon.jsii.Kernel.get(this, "autoSoftwareUpdateEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoSoftwareUpdateEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoSoftwareUpdateEnabled", java.util.Objects.requireNonNull(value, "autoSoftwareUpdateEnabled is required"));
    }

    public void setAutoSoftwareUpdateEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoSoftwareUpdateEnabled", java.util.Objects.requireNonNull(value, "autoSoftwareUpdateEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
