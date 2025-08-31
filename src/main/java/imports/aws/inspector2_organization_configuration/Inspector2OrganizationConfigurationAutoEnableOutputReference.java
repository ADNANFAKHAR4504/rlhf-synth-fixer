package imports.aws.inspector2_organization_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.385Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2OrganizationConfiguration.Inspector2OrganizationConfigurationAutoEnableOutputReference")
public class Inspector2OrganizationConfigurationAutoEnableOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Inspector2OrganizationConfigurationAutoEnableOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Inspector2OrganizationConfigurationAutoEnableOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Inspector2OrganizationConfigurationAutoEnableOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLambda() {
        software.amazon.jsii.Kernel.call(this, "resetLambda", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaCode() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaCode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEc2Input() {
        return software.amazon.jsii.Kernel.get(this, "ec2Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEcrInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEc2() {
        return software.amazon.jsii.Kernel.get(this, "ec2", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEc2(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ec2", java.util.Objects.requireNonNull(value, "ec2 is required"));
    }

    public void setEc2(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ec2", java.util.Objects.requireNonNull(value, "ec2 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEcr() {
        return software.amazon.jsii.Kernel.get(this, "ecr", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEcr(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ecr", java.util.Objects.requireNonNull(value, "ecr is required"));
    }

    public void setEcr(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ecr", java.util.Objects.requireNonNull(value, "ecr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getLambda() {
        return software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setLambda(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "lambda", java.util.Objects.requireNonNull(value, "lambda is required"));
    }

    public void setLambda(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "lambda", java.util.Objects.requireNonNull(value, "lambda is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getLambdaCode() {
        return software.amazon.jsii.Kernel.get(this, "lambdaCode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setLambdaCode(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "lambdaCode", java.util.Objects.requireNonNull(value, "lambdaCode is required"));
    }

    public void setLambdaCode(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "lambdaCode", java.util.Objects.requireNonNull(value, "lambdaCode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.inspector2_organization_configuration.Inspector2OrganizationConfigurationAutoEnable getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_organization_configuration.Inspector2OrganizationConfigurationAutoEnable.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.inspector2_organization_configuration.Inspector2OrganizationConfigurationAutoEnable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
