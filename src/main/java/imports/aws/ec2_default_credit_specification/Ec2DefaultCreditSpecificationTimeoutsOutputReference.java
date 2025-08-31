package imports.aws.ec2_default_credit_specification;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.074Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2DefaultCreditSpecification.Ec2DefaultCreditSpecificationTimeoutsOutputReference")
public class Ec2DefaultCreditSpecificationTimeoutsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2DefaultCreditSpecificationTimeoutsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2DefaultCreditSpecificationTimeoutsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2DefaultCreditSpecificationTimeoutsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCreate() {
        software.amazon.jsii.Kernel.call(this, "resetCreate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdate() {
        software.amazon.jsii.Kernel.call(this, "resetUpdate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCreateInput() {
        return software.amazon.jsii.Kernel.get(this, "createInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUpdateInput() {
        return software.amazon.jsii.Kernel.get(this, "updateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreate() {
        return software.amazon.jsii.Kernel.get(this, "create", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCreate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "create", java.util.Objects.requireNonNull(value, "create is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUpdate() {
        return software.amazon.jsii.Kernel.get(this, "update", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUpdate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "update", java.util.Objects.requireNonNull(value, "update is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_default_credit_specification.Ec2DefaultCreditSpecificationTimeouts value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
