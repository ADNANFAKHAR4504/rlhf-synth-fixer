package imports.aws.data_aws_opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.787Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsOpensearchDomain.DataAwsOpensearchDomainOffPeakWindowOptionsOutputReference")
public class DataAwsOpensearchDomainOffPeakWindowOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsOpensearchDomainOffPeakWindowOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsOpensearchDomainOffPeakWindowOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsOpensearchDomainOffPeakWindowOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_opensearch_domain.DataAwsOpensearchDomainOffPeakWindowOptionsOffPeakWindowList getOffPeakWindow() {
        return software.amazon.jsii.Kernel.get(this, "offPeakWindow", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_opensearch_domain.DataAwsOpensearchDomainOffPeakWindowOptionsOffPeakWindowList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_opensearch_domain.DataAwsOpensearchDomainOffPeakWindowOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_opensearch_domain.DataAwsOpensearchDomainOffPeakWindowOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_opensearch_domain.DataAwsOpensearchDomainOffPeakWindowOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
