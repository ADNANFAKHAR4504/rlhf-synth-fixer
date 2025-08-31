package imports.aws.vpclattice_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.619Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListener.VpclatticeListenerDefaultActionOutputReference")
public class VpclatticeListenerDefaultActionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpclatticeListenerDefaultActionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpclatticeListenerDefaultActionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpclatticeListenerDefaultActionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putFixedResponse(final @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionFixedResponse value) {
        software.amazon.jsii.Kernel.call(this, "putFixedResponse", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putForward(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionForward>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionForward> __cast_cd4240 = (java.util.List<imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionForward>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionForward __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putForward", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFixedResponse() {
        software.amazon.jsii.Kernel.call(this, "resetFixedResponse", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForward() {
        software.amazon.jsii.Kernel.call(this, "resetForward", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionFixedResponseOutputReference getFixedResponse() {
        return software.amazon.jsii.Kernel.get(this, "fixedResponse", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionFixedResponseOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionForwardList getForward() {
        return software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionForwardList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionFixedResponse getFixedResponseInput() {
        return software.amazon.jsii.Kernel.get(this, "fixedResponseInput", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionFixedResponse.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForwardInput() {
        return software.amazon.jsii.Kernel.get(this, "forwardInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener.VpclatticeListenerDefaultAction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener.VpclatticeListenerDefaultAction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener.VpclatticeListenerDefaultAction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
