package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.181Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainSnapshotOptionsOutputReference")
public class ElasticsearchDomainSnapshotOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticsearchDomainSnapshotOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticsearchDomainSnapshotOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElasticsearchDomainSnapshotOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAutomatedSnapshotStartHourInput() {
        return software.amazon.jsii.Kernel.get(this, "automatedSnapshotStartHourInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAutomatedSnapshotStartHour() {
        return software.amazon.jsii.Kernel.get(this, "automatedSnapshotStartHour", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAutomatedSnapshotStartHour(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "automatedSnapshotStartHour", java.util.Objects.requireNonNull(value, "automatedSnapshotStartHour is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
