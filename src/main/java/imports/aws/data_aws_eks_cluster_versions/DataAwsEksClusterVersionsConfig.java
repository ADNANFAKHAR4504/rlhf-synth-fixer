package imports.aws.data_aws_eks_cluster_versions;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.641Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEksClusterVersions.DataAwsEksClusterVersionsConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsEksClusterVersionsConfig.Jsii$Proxy.class)
public interface DataAwsEksClusterVersionsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#cluster_type DataAwsEksClusterVersions#cluster_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#cluster_versions_only DataAwsEksClusterVersions#cluster_versions_only}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClusterVersionsOnly() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#default_only DataAwsEksClusterVersions#default_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefaultOnly() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#include_all DataAwsEksClusterVersions#include_all}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#version_status DataAwsEksClusterVersions#version_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersionStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEksClusterVersionsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEksClusterVersionsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEksClusterVersionsConfig> {
        java.lang.String clusterType;
        java.util.List<java.lang.String> clusterVersionsOnly;
        java.lang.Object defaultOnly;
        java.lang.Object includeAll;
        java.lang.String versionStatus;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getClusterType}
         * @param clusterType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#cluster_type DataAwsEksClusterVersions#cluster_type}.
         * @return {@code this}
         */
        public Builder clusterType(java.lang.String clusterType) {
            this.clusterType = clusterType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getClusterVersionsOnly}
         * @param clusterVersionsOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#cluster_versions_only DataAwsEksClusterVersions#cluster_versions_only}.
         * @return {@code this}
         */
        public Builder clusterVersionsOnly(java.util.List<java.lang.String> clusterVersionsOnly) {
            this.clusterVersionsOnly = clusterVersionsOnly;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getDefaultOnly}
         * @param defaultOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#default_only DataAwsEksClusterVersions#default_only}.
         * @return {@code this}
         */
        public Builder defaultOnly(java.lang.Boolean defaultOnly) {
            this.defaultOnly = defaultOnly;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getDefaultOnly}
         * @param defaultOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#default_only DataAwsEksClusterVersions#default_only}.
         * @return {@code this}
         */
        public Builder defaultOnly(com.hashicorp.cdktf.IResolvable defaultOnly) {
            this.defaultOnly = defaultOnly;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getIncludeAll}
         * @param includeAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#include_all DataAwsEksClusterVersions#include_all}.
         * @return {@code this}
         */
        public Builder includeAll(java.lang.Boolean includeAll) {
            this.includeAll = includeAll;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getIncludeAll}
         * @param includeAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#include_all DataAwsEksClusterVersions#include_all}.
         * @return {@code this}
         */
        public Builder includeAll(com.hashicorp.cdktf.IResolvable includeAll) {
            this.includeAll = includeAll;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getVersionStatus}
         * @param versionStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/eks_cluster_versions#version_status DataAwsEksClusterVersions#version_status}.
         * @return {@code this}
         */
        public Builder versionStatus(java.lang.String versionStatus) {
            this.versionStatus = versionStatus;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEksClusterVersionsConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEksClusterVersionsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEksClusterVersionsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEksClusterVersionsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEksClusterVersionsConfig {
        private final java.lang.String clusterType;
        private final java.util.List<java.lang.String> clusterVersionsOnly;
        private final java.lang.Object defaultOnly;
        private final java.lang.Object includeAll;
        private final java.lang.String versionStatus;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clusterType = software.amazon.jsii.Kernel.get(this, "clusterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterVersionsOnly = software.amazon.jsii.Kernel.get(this, "clusterVersionsOnly", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.defaultOnly = software.amazon.jsii.Kernel.get(this, "defaultOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeAll = software.amazon.jsii.Kernel.get(this, "includeAll", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.versionStatus = software.amazon.jsii.Kernel.get(this, "versionStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clusterType = builder.clusterType;
            this.clusterVersionsOnly = builder.clusterVersionsOnly;
            this.defaultOnly = builder.defaultOnly;
            this.includeAll = builder.includeAll;
            this.versionStatus = builder.versionStatus;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getClusterType() {
            return this.clusterType;
        }

        @Override
        public final java.util.List<java.lang.String> getClusterVersionsOnly() {
            return this.clusterVersionsOnly;
        }

        @Override
        public final java.lang.Object getDefaultOnly() {
            return this.defaultOnly;
        }

        @Override
        public final java.lang.Object getIncludeAll() {
            return this.includeAll;
        }

        @Override
        public final java.lang.String getVersionStatus() {
            return this.versionStatus;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getClusterType() != null) {
                data.set("clusterType", om.valueToTree(this.getClusterType()));
            }
            if (this.getClusterVersionsOnly() != null) {
                data.set("clusterVersionsOnly", om.valueToTree(this.getClusterVersionsOnly()));
            }
            if (this.getDefaultOnly() != null) {
                data.set("defaultOnly", om.valueToTree(this.getDefaultOnly()));
            }
            if (this.getIncludeAll() != null) {
                data.set("includeAll", om.valueToTree(this.getIncludeAll()));
            }
            if (this.getVersionStatus() != null) {
                data.set("versionStatus", om.valueToTree(this.getVersionStatus()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEksClusterVersions.DataAwsEksClusterVersionsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEksClusterVersionsConfig.Jsii$Proxy that = (DataAwsEksClusterVersionsConfig.Jsii$Proxy) o;

            if (this.clusterType != null ? !this.clusterType.equals(that.clusterType) : that.clusterType != null) return false;
            if (this.clusterVersionsOnly != null ? !this.clusterVersionsOnly.equals(that.clusterVersionsOnly) : that.clusterVersionsOnly != null) return false;
            if (this.defaultOnly != null ? !this.defaultOnly.equals(that.defaultOnly) : that.defaultOnly != null) return false;
            if (this.includeAll != null ? !this.includeAll.equals(that.includeAll) : that.includeAll != null) return false;
            if (this.versionStatus != null ? !this.versionStatus.equals(that.versionStatus) : that.versionStatus != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clusterType != null ? this.clusterType.hashCode() : 0;
            result = 31 * result + (this.clusterVersionsOnly != null ? this.clusterVersionsOnly.hashCode() : 0);
            result = 31 * result + (this.defaultOnly != null ? this.defaultOnly.hashCode() : 0);
            result = 31 * result + (this.includeAll != null ? this.includeAll.hashCode() : 0);
            result = 31 * result + (this.versionStatus != null ? this.versionStatus.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
