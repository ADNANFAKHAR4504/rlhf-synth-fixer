package imports.aws.sesv2_account_vdm_attributes;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.455Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2AccountVdmAttributes.Sesv2AccountVdmAttributesGuardianAttributesOutputReference")
public class Sesv2AccountVdmAttributesGuardianAttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2AccountVdmAttributesGuardianAttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2AccountVdmAttributesGuardianAttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2AccountVdmAttributesGuardianAttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOptimizedSharedDelivery() {
        software.amazon.jsii.Kernel.call(this, "resetOptimizedSharedDelivery", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOptimizedSharedDeliveryInput() {
        return software.amazon.jsii.Kernel.get(this, "optimizedSharedDeliveryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOptimizedSharedDelivery() {
        return software.amazon.jsii.Kernel.get(this, "optimizedSharedDelivery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOptimizedSharedDelivery(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "optimizedSharedDelivery", java.util.Objects.requireNonNull(value, "optimizedSharedDelivery is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
