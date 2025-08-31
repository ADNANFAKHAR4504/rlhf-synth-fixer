package imports.aws.batch_compute_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironmentEksConfigurationOutputReference")
public class BatchComputeEnvironmentEksConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchComputeEnvironmentEksConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchComputeEnvironmentEksConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BatchComputeEnvironmentEksConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEksClusterArnInput() {
        return software.amazon.jsii.Kernel.get(this, "eksClusterArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKubernetesNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "kubernetesNamespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEksClusterArn() {
        return software.amazon.jsii.Kernel.get(this, "eksClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEksClusterArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eksClusterArn", java.util.Objects.requireNonNull(value, "eksClusterArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKubernetesNamespace() {
        return software.amazon.jsii.Kernel.get(this, "kubernetesNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKubernetesNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kubernetesNamespace", java.util.Objects.requireNonNull(value, "kubernetesNamespace is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
