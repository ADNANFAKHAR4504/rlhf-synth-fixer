package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.070Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference")
public class PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAwsVpcConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAwsVpcConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsVpcConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAwsVpcConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference getAwsVpcConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "awsVpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration getAwsVpcConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "awsVpcConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
