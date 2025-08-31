package imports.aws.eks_node_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.161Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksNodeGroup.EksNodeGroupRemoteAccessOutputReference")
public class EksNodeGroupRemoteAccessOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksNodeGroupRemoteAccessOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksNodeGroupRemoteAccessOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksNodeGroupRemoteAccessOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEc2SshKey() {
        software.amazon.jsii.Kernel.call(this, "resetEc2SshKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSourceSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEc2SshKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2SshKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSourceSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "sourceSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEc2SshKey() {
        return software.amazon.jsii.Kernel.get(this, "ec2SshKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEc2SshKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ec2SshKey", java.util.Objects.requireNonNull(value, "ec2SshKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSourceSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "sourceSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSourceSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "sourceSecurityGroupIds", java.util.Objects.requireNonNull(value, "sourceSecurityGroupIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupRemoteAccess getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupRemoteAccess.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupRemoteAccess value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
