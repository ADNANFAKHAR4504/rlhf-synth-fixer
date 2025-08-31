package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.070Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference")
public class PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAssignPublicIp() {
        software.amazon.jsii.Kernel.call(this, "resetAssignPublicIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnets() {
        software.amazon.jsii.Kernel.call(this, "resetSubnets", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssignPublicIpInput() {
        return software.amazon.jsii.Kernel.get(this, "assignPublicIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssignPublicIp() {
        return software.amazon.jsii.Kernel.get(this, "assignPublicIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssignPublicIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "assignPublicIp", java.util.Objects.requireNonNull(value, "assignPublicIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnets(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnets", java.util.Objects.requireNonNull(value, "subnets is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
