package imports.aws.data_aws_eks_cluster_versions;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions aws_eks_cluster_versions}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.641Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEksClusterVersions.DataAwsEksClusterVersions")
public class DataAwsEksClusterVersions extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsEksClusterVersions(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsEksClusterVersions(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersions.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions aws_eks_cluster_versions} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DataAwsEksClusterVersions(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions aws_eks_cluster_versions} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DataAwsEksClusterVersions(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsEksClusterVersions resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsEksClusterVersions to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsEksClusterVersions that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsEksClusterVersions to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersions.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsEksClusterVersions resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsEksClusterVersions to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsEksClusterVersions that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersions.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetClusterType() {
        software.amazon.jsii.Kernel.call(this, "resetClusterType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterVersionsOnly() {
        software.amazon.jsii.Kernel.call(this, "resetClusterVersionsOnly", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultOnly() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultOnly", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeAll() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersionStatus() {
        software.amazon.jsii.Kernel.call(this, "resetVersionStatus", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsClusterVersionsList getClusterVersions() {
        return software.amazon.jsii.Kernel.get(this, "clusterVersions", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsClusterVersionsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClusterVersionsOnlyInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "clusterVersionsOnlyInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDefaultOnlyInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultOnlyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeAllInput() {
        return software.amazon.jsii.Kernel.get(this, "includeAllInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "versionStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterType() {
        return software.amazon.jsii.Kernel.get(this, "clusterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterType", java.util.Objects.requireNonNull(value, "clusterType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getClusterVersionsOnly() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "clusterVersionsOnly", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setClusterVersionsOnly(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "clusterVersionsOnly", java.util.Objects.requireNonNull(value, "clusterVersionsOnly is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDefaultOnly() {
        return software.amazon.jsii.Kernel.get(this, "defaultOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDefaultOnly(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "defaultOnly", java.util.Objects.requireNonNull(value, "defaultOnly is required"));
    }

    public void setDefaultOnly(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "defaultOnly", java.util.Objects.requireNonNull(value, "defaultOnly is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeAll() {
        return software.amazon.jsii.Kernel.get(this, "includeAll", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeAll(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeAll", java.util.Objects.requireNonNull(value, "includeAll is required"));
    }

    public void setIncludeAll(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeAll", java.util.Objects.requireNonNull(value, "includeAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionStatus() {
        return software.amazon.jsii.Kernel.get(this, "versionStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersionStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "versionStatus", java.util.Objects.requireNonNull(value, "versionStatus is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersions}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersions> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#cluster_type DataAwsEksClusterVersions#cluster_type}.
         * <p>
         * @return {@code this}
         * @param clusterType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#cluster_type DataAwsEksClusterVersions#cluster_type}. This parameter is required.
         */
        public Builder clusterType(final java.lang.String clusterType) {
            this.config().clusterType(clusterType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#cluster_versions_only DataAwsEksClusterVersions#cluster_versions_only}.
         * <p>
         * @return {@code this}
         * @param clusterVersionsOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#cluster_versions_only DataAwsEksClusterVersions#cluster_versions_only}. This parameter is required.
         */
        public Builder clusterVersionsOnly(final java.util.List<java.lang.String> clusterVersionsOnly) {
            this.config().clusterVersionsOnly(clusterVersionsOnly);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#default_only DataAwsEksClusterVersions#default_only}.
         * <p>
         * @return {@code this}
         * @param defaultOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#default_only DataAwsEksClusterVersions#default_only}. This parameter is required.
         */
        public Builder defaultOnly(final java.lang.Boolean defaultOnly) {
            this.config().defaultOnly(defaultOnly);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#default_only DataAwsEksClusterVersions#default_only}.
         * <p>
         * @return {@code this}
         * @param defaultOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#default_only DataAwsEksClusterVersions#default_only}. This parameter is required.
         */
        public Builder defaultOnly(final com.hashicorp.cdktf.IResolvable defaultOnly) {
            this.config().defaultOnly(defaultOnly);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#include_all DataAwsEksClusterVersions#include_all}.
         * <p>
         * @return {@code this}
         * @param includeAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#include_all DataAwsEksClusterVersions#include_all}. This parameter is required.
         */
        public Builder includeAll(final java.lang.Boolean includeAll) {
            this.config().includeAll(includeAll);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#include_all DataAwsEksClusterVersions#include_all}.
         * <p>
         * @return {@code this}
         * @param includeAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#include_all DataAwsEksClusterVersions#include_all}. This parameter is required.
         */
        public Builder includeAll(final com.hashicorp.cdktf.IResolvable includeAll) {
            this.config().includeAll(includeAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#version_status DataAwsEksClusterVersions#version_status}.
         * <p>
         * @return {@code this}
         * @param versionStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#version_status DataAwsEksClusterVersions#version_status}. This parameter is required.
         */
        public Builder versionStatus(final java.lang.String versionStatus) {
            this.config().versionStatus(versionStatus);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersions}.
         */
        @Override
        public imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersions build() {
            return new imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersions(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.data_aws_eks_cluster_versions.DataAwsEksClusterVersionsConfig.Builder();
            }
            return this.config;
        }
    }
}
