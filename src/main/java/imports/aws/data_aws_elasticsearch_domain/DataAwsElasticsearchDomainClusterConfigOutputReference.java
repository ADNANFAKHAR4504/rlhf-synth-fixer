package imports.aws.data_aws_elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.650Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsElasticsearchDomain.DataAwsElasticsearchDomainClusterConfigOutputReference")
public class DataAwsElasticsearchDomainClusterConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsElasticsearchDomainClusterConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsElasticsearchDomainClusterConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsElasticsearchDomainClusterConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_elasticsearch_domain.DataAwsElasticsearchDomainClusterConfigColdStorageOptionsList getColdStorageOptions() {
        return software.amazon.jsii.Kernel.get(this, "coldStorageOptions", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_elasticsearch_domain.DataAwsElasticsearchDomainClusterConfigColdStorageOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDedicatedMasterCount() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getDedicatedMasterEnabled() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDedicatedMasterType() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedMasterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstanceCount() {
        return software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWarmCount() {
        return software.amazon.jsii.Kernel.get(this, "warmCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getWarmEnabled() {
        return software.amazon.jsii.Kernel.get(this, "warmEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWarmType() {
        return software.amazon.jsii.Kernel.get(this, "warmType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_elasticsearch_domain.DataAwsElasticsearchDomainClusterConfigZoneAwarenessConfigList getZoneAwarenessConfig() {
        return software.amazon.jsii.Kernel.get(this, "zoneAwarenessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_elasticsearch_domain.DataAwsElasticsearchDomainClusterConfigZoneAwarenessConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getZoneAwarenessEnabled() {
        return software.amazon.jsii.Kernel.get(this, "zoneAwarenessEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_elasticsearch_domain.DataAwsElasticsearchDomainClusterConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_elasticsearch_domain.DataAwsElasticsearchDomainClusterConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_elasticsearch_domain.DataAwsElasticsearchDomainClusterConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
