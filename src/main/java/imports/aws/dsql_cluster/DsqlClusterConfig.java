package imports.aws.dsql_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.032Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dsqlCluster.DsqlClusterConfig")
@software.amazon.jsii.Jsii.Proxy(DsqlClusterConfig.Jsii$Proxy.class)
public interface DsqlClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#deletion_protection_enabled DsqlCluster#deletion_protection_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtectionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#kms_encryption_key DsqlCluster#kms_encryption_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsEncryptionKey() {
        return null;
    }

    /**
     * multi_region_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#multi_region_properties DsqlCluster#multi_region_properties}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiRegionProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#tags DsqlCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#timeouts DsqlCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dsql_cluster.DsqlClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DsqlClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DsqlClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DsqlClusterConfig> {
        java.lang.Object deletionProtectionEnabled;
        java.lang.String kmsEncryptionKey;
        java.lang.Object multiRegionProperties;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.dsql_cluster.DsqlClusterTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DsqlClusterConfig#getDeletionProtectionEnabled}
         * @param deletionProtectionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#deletion_protection_enabled DsqlCluster#deletion_protection_enabled}.
         * @return {@code this}
         */
        public Builder deletionProtectionEnabled(java.lang.Boolean deletionProtectionEnabled) {
            this.deletionProtectionEnabled = deletionProtectionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getDeletionProtectionEnabled}
         * @param deletionProtectionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#deletion_protection_enabled DsqlCluster#deletion_protection_enabled}.
         * @return {@code this}
         */
        public Builder deletionProtectionEnabled(com.hashicorp.cdktf.IResolvable deletionProtectionEnabled) {
            this.deletionProtectionEnabled = deletionProtectionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getKmsEncryptionKey}
         * @param kmsEncryptionKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#kms_encryption_key DsqlCluster#kms_encryption_key}.
         * @return {@code this}
         */
        public Builder kmsEncryptionKey(java.lang.String kmsEncryptionKey) {
            this.kmsEncryptionKey = kmsEncryptionKey;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getMultiRegionProperties}
         * @param multiRegionProperties multi_region_properties block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#multi_region_properties DsqlCluster#multi_region_properties}
         * @return {@code this}
         */
        public Builder multiRegionProperties(com.hashicorp.cdktf.IResolvable multiRegionProperties) {
            this.multiRegionProperties = multiRegionProperties;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getMultiRegionProperties}
         * @param multiRegionProperties multi_region_properties block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#multi_region_properties DsqlCluster#multi_region_properties}
         * @return {@code this}
         */
        public Builder multiRegionProperties(java.util.List<? extends imports.aws.dsql_cluster.DsqlClusterMultiRegionProperties> multiRegionProperties) {
            this.multiRegionProperties = multiRegionProperties;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#tags DsqlCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#timeouts DsqlCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.dsql_cluster.DsqlClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getDependsOn}
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
         * Sets the value of {@link DsqlClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterConfig#getProvisioners}
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
         * @return a new instance of {@link DsqlClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DsqlClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DsqlClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DsqlClusterConfig {
        private final java.lang.Object deletionProtectionEnabled;
        private final java.lang.String kmsEncryptionKey;
        private final java.lang.Object multiRegionProperties;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.dsql_cluster.DsqlClusterTimeouts timeouts;
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
            this.deletionProtectionEnabled = software.amazon.jsii.Kernel.get(this, "deletionProtectionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsEncryptionKey = software.amazon.jsii.Kernel.get(this, "kmsEncryptionKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiRegionProperties = software.amazon.jsii.Kernel.get(this, "multiRegionProperties", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dsql_cluster.DsqlClusterTimeouts.class));
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
            this.deletionProtectionEnabled = builder.deletionProtectionEnabled;
            this.kmsEncryptionKey = builder.kmsEncryptionKey;
            this.multiRegionProperties = builder.multiRegionProperties;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getDeletionProtectionEnabled() {
            return this.deletionProtectionEnabled;
        }

        @Override
        public final java.lang.String getKmsEncryptionKey() {
            return this.kmsEncryptionKey;
        }

        @Override
        public final java.lang.Object getMultiRegionProperties() {
            return this.multiRegionProperties;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.dsql_cluster.DsqlClusterTimeouts getTimeouts() {
            return this.timeouts;
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

            if (this.getDeletionProtectionEnabled() != null) {
                data.set("deletionProtectionEnabled", om.valueToTree(this.getDeletionProtectionEnabled()));
            }
            if (this.getKmsEncryptionKey() != null) {
                data.set("kmsEncryptionKey", om.valueToTree(this.getKmsEncryptionKey()));
            }
            if (this.getMultiRegionProperties() != null) {
                data.set("multiRegionProperties", om.valueToTree(this.getMultiRegionProperties()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.dsqlCluster.DsqlClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DsqlClusterConfig.Jsii$Proxy that = (DsqlClusterConfig.Jsii$Proxy) o;

            if (this.deletionProtectionEnabled != null ? !this.deletionProtectionEnabled.equals(that.deletionProtectionEnabled) : that.deletionProtectionEnabled != null) return false;
            if (this.kmsEncryptionKey != null ? !this.kmsEncryptionKey.equals(that.kmsEncryptionKey) : that.kmsEncryptionKey != null) return false;
            if (this.multiRegionProperties != null ? !this.multiRegionProperties.equals(that.multiRegionProperties) : that.multiRegionProperties != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.deletionProtectionEnabled != null ? this.deletionProtectionEnabled.hashCode() : 0;
            result = 31 * result + (this.kmsEncryptionKey != null ? this.kmsEncryptionKey.hashCode() : 0);
            result = 31 * result + (this.multiRegionProperties != null ? this.multiRegionProperties.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
