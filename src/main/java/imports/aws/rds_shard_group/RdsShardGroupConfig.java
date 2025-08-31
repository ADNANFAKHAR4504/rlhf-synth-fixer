package imports.aws.rds_shard_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.153Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsShardGroup.RdsShardGroupConfig")
@software.amazon.jsii.Jsii.Proxy(RdsShardGroupConfig.Jsii$Proxy.class)
public interface RdsShardGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#db_cluster_identifier RdsShardGroup#db_cluster_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDbClusterIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#db_shard_group_identifier RdsShardGroup#db_shard_group_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDbShardGroupIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#max_acu RdsShardGroup#max_acu}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxAcu();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#compute_redundancy RdsShardGroup#compute_redundancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getComputeRedundancy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#min_acu RdsShardGroup#min_acu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinAcu() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#publicly_accessible RdsShardGroup#publicly_accessible}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessible() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#tags RdsShardGroup#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#timeouts RdsShardGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_shard_group.RdsShardGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RdsShardGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RdsShardGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RdsShardGroupConfig> {
        java.lang.String dbClusterIdentifier;
        java.lang.String dbShardGroupIdentifier;
        java.lang.Number maxAcu;
        java.lang.Number computeRedundancy;
        java.lang.Number minAcu;
        java.lang.Object publiclyAccessible;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.rds_shard_group.RdsShardGroupTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RdsShardGroupConfig#getDbClusterIdentifier}
         * @param dbClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#db_cluster_identifier RdsShardGroup#db_cluster_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder dbClusterIdentifier(java.lang.String dbClusterIdentifier) {
            this.dbClusterIdentifier = dbClusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getDbShardGroupIdentifier}
         * @param dbShardGroupIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#db_shard_group_identifier RdsShardGroup#db_shard_group_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder dbShardGroupIdentifier(java.lang.String dbShardGroupIdentifier) {
            this.dbShardGroupIdentifier = dbShardGroupIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getMaxAcu}
         * @param maxAcu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#max_acu RdsShardGroup#max_acu}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxAcu(java.lang.Number maxAcu) {
            this.maxAcu = maxAcu;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getComputeRedundancy}
         * @param computeRedundancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#compute_redundancy RdsShardGroup#compute_redundancy}.
         * @return {@code this}
         */
        public Builder computeRedundancy(java.lang.Number computeRedundancy) {
            this.computeRedundancy = computeRedundancy;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getMinAcu}
         * @param minAcu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#min_acu RdsShardGroup#min_acu}.
         * @return {@code this}
         */
        public Builder minAcu(java.lang.Number minAcu) {
            this.minAcu = minAcu;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#publicly_accessible RdsShardGroup#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(java.lang.Boolean publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#publicly_accessible RdsShardGroup#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#tags RdsShardGroup#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_shard_group#timeouts RdsShardGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.rds_shard_group.RdsShardGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getDependsOn}
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
         * Sets the value of {@link RdsShardGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RdsShardGroupConfig#getProvisioners}
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
         * @return a new instance of {@link RdsShardGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RdsShardGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RdsShardGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RdsShardGroupConfig {
        private final java.lang.String dbClusterIdentifier;
        private final java.lang.String dbShardGroupIdentifier;
        private final java.lang.Number maxAcu;
        private final java.lang.Number computeRedundancy;
        private final java.lang.Number minAcu;
        private final java.lang.Object publiclyAccessible;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.rds_shard_group.RdsShardGroupTimeouts timeouts;
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
            this.dbClusterIdentifier = software.amazon.jsii.Kernel.get(this, "dbClusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbShardGroupIdentifier = software.amazon.jsii.Kernel.get(this, "dbShardGroupIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxAcu = software.amazon.jsii.Kernel.get(this, "maxAcu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.computeRedundancy = software.amazon.jsii.Kernel.get(this, "computeRedundancy", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minAcu = software.amazon.jsii.Kernel.get(this, "minAcu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.publiclyAccessible = software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rds_shard_group.RdsShardGroupTimeouts.class));
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
            this.dbClusterIdentifier = java.util.Objects.requireNonNull(builder.dbClusterIdentifier, "dbClusterIdentifier is required");
            this.dbShardGroupIdentifier = java.util.Objects.requireNonNull(builder.dbShardGroupIdentifier, "dbShardGroupIdentifier is required");
            this.maxAcu = java.util.Objects.requireNonNull(builder.maxAcu, "maxAcu is required");
            this.computeRedundancy = builder.computeRedundancy;
            this.minAcu = builder.minAcu;
            this.publiclyAccessible = builder.publiclyAccessible;
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
        public final java.lang.String getDbClusterIdentifier() {
            return this.dbClusterIdentifier;
        }

        @Override
        public final java.lang.String getDbShardGroupIdentifier() {
            return this.dbShardGroupIdentifier;
        }

        @Override
        public final java.lang.Number getMaxAcu() {
            return this.maxAcu;
        }

        @Override
        public final java.lang.Number getComputeRedundancy() {
            return this.computeRedundancy;
        }

        @Override
        public final java.lang.Number getMinAcu() {
            return this.minAcu;
        }

        @Override
        public final java.lang.Object getPubliclyAccessible() {
            return this.publiclyAccessible;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.rds_shard_group.RdsShardGroupTimeouts getTimeouts() {
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

            data.set("dbClusterIdentifier", om.valueToTree(this.getDbClusterIdentifier()));
            data.set("dbShardGroupIdentifier", om.valueToTree(this.getDbShardGroupIdentifier()));
            data.set("maxAcu", om.valueToTree(this.getMaxAcu()));
            if (this.getComputeRedundancy() != null) {
                data.set("computeRedundancy", om.valueToTree(this.getComputeRedundancy()));
            }
            if (this.getMinAcu() != null) {
                data.set("minAcu", om.valueToTree(this.getMinAcu()));
            }
            if (this.getPubliclyAccessible() != null) {
                data.set("publiclyAccessible", om.valueToTree(this.getPubliclyAccessible()));
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
            struct.set("fqn", om.valueToTree("aws.rdsShardGroup.RdsShardGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RdsShardGroupConfig.Jsii$Proxy that = (RdsShardGroupConfig.Jsii$Proxy) o;

            if (!dbClusterIdentifier.equals(that.dbClusterIdentifier)) return false;
            if (!dbShardGroupIdentifier.equals(that.dbShardGroupIdentifier)) return false;
            if (!maxAcu.equals(that.maxAcu)) return false;
            if (this.computeRedundancy != null ? !this.computeRedundancy.equals(that.computeRedundancy) : that.computeRedundancy != null) return false;
            if (this.minAcu != null ? !this.minAcu.equals(that.minAcu) : that.minAcu != null) return false;
            if (this.publiclyAccessible != null ? !this.publiclyAccessible.equals(that.publiclyAccessible) : that.publiclyAccessible != null) return false;
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
            int result = this.dbClusterIdentifier.hashCode();
            result = 31 * result + (this.dbShardGroupIdentifier.hashCode());
            result = 31 * result + (this.maxAcu.hashCode());
            result = 31 * result + (this.computeRedundancy != null ? this.computeRedundancy.hashCode() : 0);
            result = 31 * result + (this.minAcu != null ? this.minAcu.hashCode() : 0);
            result = 31 * result + (this.publiclyAccessible != null ? this.publiclyAccessible.hashCode() : 0);
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
