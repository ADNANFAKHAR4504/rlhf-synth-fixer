package imports.aws.redshift_snapshot_copy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.166Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftSnapshotCopy.RedshiftSnapshotCopyConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftSnapshotCopyConfig.Jsii$Proxy.class)
public interface RedshiftSnapshotCopyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#cluster_identifier RedshiftSnapshotCopy#cluster_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#destination_region RedshiftSnapshotCopy#destination_region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationRegion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#manual_snapshot_retention_period RedshiftSnapshotCopy#manual_snapshot_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getManualSnapshotRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#retention_period RedshiftSnapshotCopy#retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#snapshot_copy_grant_name RedshiftSnapshotCopy#snapshot_copy_grant_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotCopyGrantName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftSnapshotCopyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftSnapshotCopyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftSnapshotCopyConfig> {
        java.lang.String clusterIdentifier;
        java.lang.String destinationRegion;
        java.lang.Number manualSnapshotRetentionPeriod;
        java.lang.Number retentionPeriod;
        java.lang.String snapshotCopyGrantName;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#cluster_identifier RedshiftSnapshotCopy#cluster_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getDestinationRegion}
         * @param destinationRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#destination_region RedshiftSnapshotCopy#destination_region}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationRegion(java.lang.String destinationRegion) {
            this.destinationRegion = destinationRegion;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getManualSnapshotRetentionPeriod}
         * @param manualSnapshotRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#manual_snapshot_retention_period RedshiftSnapshotCopy#manual_snapshot_retention_period}.
         * @return {@code this}
         */
        public Builder manualSnapshotRetentionPeriod(java.lang.Number manualSnapshotRetentionPeriod) {
            this.manualSnapshotRetentionPeriod = manualSnapshotRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getRetentionPeriod}
         * @param retentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#retention_period RedshiftSnapshotCopy#retention_period}.
         * @return {@code this}
         */
        public Builder retentionPeriod(java.lang.Number retentionPeriod) {
            this.retentionPeriod = retentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getSnapshotCopyGrantName}
         * @param snapshotCopyGrantName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#snapshot_copy_grant_name RedshiftSnapshotCopy#snapshot_copy_grant_name}.
         * @return {@code this}
         */
        public Builder snapshotCopyGrantName(java.lang.String snapshotCopyGrantName) {
            this.snapshotCopyGrantName = snapshotCopyGrantName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getDependsOn}
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
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftSnapshotCopyConfig#getProvisioners}
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
         * @return a new instance of {@link RedshiftSnapshotCopyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftSnapshotCopyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftSnapshotCopyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftSnapshotCopyConfig {
        private final java.lang.String clusterIdentifier;
        private final java.lang.String destinationRegion;
        private final java.lang.Number manualSnapshotRetentionPeriod;
        private final java.lang.Number retentionPeriod;
        private final java.lang.String snapshotCopyGrantName;
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
            this.clusterIdentifier = software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationRegion = software.amazon.jsii.Kernel.get(this, "destinationRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manualSnapshotRetentionPeriod = software.amazon.jsii.Kernel.get(this, "manualSnapshotRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.retentionPeriod = software.amazon.jsii.Kernel.get(this, "retentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.snapshotCopyGrantName = software.amazon.jsii.Kernel.get(this, "snapshotCopyGrantName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.clusterIdentifier = java.util.Objects.requireNonNull(builder.clusterIdentifier, "clusterIdentifier is required");
            this.destinationRegion = java.util.Objects.requireNonNull(builder.destinationRegion, "destinationRegion is required");
            this.manualSnapshotRetentionPeriod = builder.manualSnapshotRetentionPeriod;
            this.retentionPeriod = builder.retentionPeriod;
            this.snapshotCopyGrantName = builder.snapshotCopyGrantName;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getClusterIdentifier() {
            return this.clusterIdentifier;
        }

        @Override
        public final java.lang.String getDestinationRegion() {
            return this.destinationRegion;
        }

        @Override
        public final java.lang.Number getManualSnapshotRetentionPeriod() {
            return this.manualSnapshotRetentionPeriod;
        }

        @Override
        public final java.lang.Number getRetentionPeriod() {
            return this.retentionPeriod;
        }

        @Override
        public final java.lang.String getSnapshotCopyGrantName() {
            return this.snapshotCopyGrantName;
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

            data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            data.set("destinationRegion", om.valueToTree(this.getDestinationRegion()));
            if (this.getManualSnapshotRetentionPeriod() != null) {
                data.set("manualSnapshotRetentionPeriod", om.valueToTree(this.getManualSnapshotRetentionPeriod()));
            }
            if (this.getRetentionPeriod() != null) {
                data.set("retentionPeriod", om.valueToTree(this.getRetentionPeriod()));
            }
            if (this.getSnapshotCopyGrantName() != null) {
                data.set("snapshotCopyGrantName", om.valueToTree(this.getSnapshotCopyGrantName()));
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
            struct.set("fqn", om.valueToTree("aws.redshiftSnapshotCopy.RedshiftSnapshotCopyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftSnapshotCopyConfig.Jsii$Proxy that = (RedshiftSnapshotCopyConfig.Jsii$Proxy) o;

            if (!clusterIdentifier.equals(that.clusterIdentifier)) return false;
            if (!destinationRegion.equals(that.destinationRegion)) return false;
            if (this.manualSnapshotRetentionPeriod != null ? !this.manualSnapshotRetentionPeriod.equals(that.manualSnapshotRetentionPeriod) : that.manualSnapshotRetentionPeriod != null) return false;
            if (this.retentionPeriod != null ? !this.retentionPeriod.equals(that.retentionPeriod) : that.retentionPeriod != null) return false;
            if (this.snapshotCopyGrantName != null ? !this.snapshotCopyGrantName.equals(that.snapshotCopyGrantName) : that.snapshotCopyGrantName != null) return false;
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
            int result = this.clusterIdentifier.hashCode();
            result = 31 * result + (this.destinationRegion.hashCode());
            result = 31 * result + (this.manualSnapshotRetentionPeriod != null ? this.manualSnapshotRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.retentionPeriod != null ? this.retentionPeriod.hashCode() : 0);
            result = 31 * result + (this.snapshotCopyGrantName != null ? this.snapshotCopyGrantName.hashCode() : 0);
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
