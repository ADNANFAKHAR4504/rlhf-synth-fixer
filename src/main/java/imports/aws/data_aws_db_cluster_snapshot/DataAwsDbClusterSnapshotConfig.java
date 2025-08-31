package imports.aws.data_aws_db_cluster_snapshot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.544Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsDbClusterSnapshot.DataAwsDbClusterSnapshotConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsDbClusterSnapshotConfig.Jsii$Proxy.class)
public interface DataAwsDbClusterSnapshotConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#db_cluster_identifier DataAwsDbClusterSnapshot#db_cluster_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbClusterIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#db_cluster_snapshot_identifier DataAwsDbClusterSnapshot#db_cluster_snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbClusterSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#id DataAwsDbClusterSnapshot#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#include_public DataAwsDbClusterSnapshot#include_public}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludePublic() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#include_shared DataAwsDbClusterSnapshot#include_shared}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeShared() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#most_recent DataAwsDbClusterSnapshot#most_recent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMostRecent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#snapshot_type DataAwsDbClusterSnapshot#snapshot_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#tags DataAwsDbClusterSnapshot#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsDbClusterSnapshotConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsDbClusterSnapshotConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsDbClusterSnapshotConfig> {
        java.lang.String dbClusterIdentifier;
        java.lang.String dbClusterSnapshotIdentifier;
        java.lang.String id;
        java.lang.Object includePublic;
        java.lang.Object includeShared;
        java.lang.Object mostRecent;
        java.lang.String snapshotType;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getDbClusterIdentifier}
         * @param dbClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#db_cluster_identifier DataAwsDbClusterSnapshot#db_cluster_identifier}.
         * @return {@code this}
         */
        public Builder dbClusterIdentifier(java.lang.String dbClusterIdentifier) {
            this.dbClusterIdentifier = dbClusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getDbClusterSnapshotIdentifier}
         * @param dbClusterSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#db_cluster_snapshot_identifier DataAwsDbClusterSnapshot#db_cluster_snapshot_identifier}.
         * @return {@code this}
         */
        public Builder dbClusterSnapshotIdentifier(java.lang.String dbClusterSnapshotIdentifier) {
            this.dbClusterSnapshotIdentifier = dbClusterSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#id DataAwsDbClusterSnapshot#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getIncludePublic}
         * @param includePublic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#include_public DataAwsDbClusterSnapshot#include_public}.
         * @return {@code this}
         */
        public Builder includePublic(java.lang.Boolean includePublic) {
            this.includePublic = includePublic;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getIncludePublic}
         * @param includePublic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#include_public DataAwsDbClusterSnapshot#include_public}.
         * @return {@code this}
         */
        public Builder includePublic(com.hashicorp.cdktf.IResolvable includePublic) {
            this.includePublic = includePublic;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getIncludeShared}
         * @param includeShared Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#include_shared DataAwsDbClusterSnapshot#include_shared}.
         * @return {@code this}
         */
        public Builder includeShared(java.lang.Boolean includeShared) {
            this.includeShared = includeShared;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getIncludeShared}
         * @param includeShared Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#include_shared DataAwsDbClusterSnapshot#include_shared}.
         * @return {@code this}
         */
        public Builder includeShared(com.hashicorp.cdktf.IResolvable includeShared) {
            this.includeShared = includeShared;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getMostRecent}
         * @param mostRecent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#most_recent DataAwsDbClusterSnapshot#most_recent}.
         * @return {@code this}
         */
        public Builder mostRecent(java.lang.Boolean mostRecent) {
            this.mostRecent = mostRecent;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getMostRecent}
         * @param mostRecent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#most_recent DataAwsDbClusterSnapshot#most_recent}.
         * @return {@code this}
         */
        public Builder mostRecent(com.hashicorp.cdktf.IResolvable mostRecent) {
            this.mostRecent = mostRecent;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getSnapshotType}
         * @param snapshotType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#snapshot_type DataAwsDbClusterSnapshot#snapshot_type}.
         * @return {@code this}
         */
        public Builder snapshotType(java.lang.String snapshotType) {
            this.snapshotType = snapshotType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/db_cluster_snapshot#tags DataAwsDbClusterSnapshot#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsDbClusterSnapshotConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsDbClusterSnapshotConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsDbClusterSnapshotConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsDbClusterSnapshotConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsDbClusterSnapshotConfig {
        private final java.lang.String dbClusterIdentifier;
        private final java.lang.String dbClusterSnapshotIdentifier;
        private final java.lang.String id;
        private final java.lang.Object includePublic;
        private final java.lang.Object includeShared;
        private final java.lang.Object mostRecent;
        private final java.lang.String snapshotType;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
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
            this.dbClusterSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "dbClusterSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includePublic = software.amazon.jsii.Kernel.get(this, "includePublic", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeShared = software.amazon.jsii.Kernel.get(this, "includeShared", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.mostRecent = software.amazon.jsii.Kernel.get(this, "mostRecent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snapshotType = software.amazon.jsii.Kernel.get(this, "snapshotType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.dbClusterIdentifier = builder.dbClusterIdentifier;
            this.dbClusterSnapshotIdentifier = builder.dbClusterSnapshotIdentifier;
            this.id = builder.id;
            this.includePublic = builder.includePublic;
            this.includeShared = builder.includeShared;
            this.mostRecent = builder.mostRecent;
            this.snapshotType = builder.snapshotType;
            this.tags = builder.tags;
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
        public final java.lang.String getDbClusterSnapshotIdentifier() {
            return this.dbClusterSnapshotIdentifier;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIncludePublic() {
            return this.includePublic;
        }

        @Override
        public final java.lang.Object getIncludeShared() {
            return this.includeShared;
        }

        @Override
        public final java.lang.Object getMostRecent() {
            return this.mostRecent;
        }

        @Override
        public final java.lang.String getSnapshotType() {
            return this.snapshotType;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
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

            if (this.getDbClusterIdentifier() != null) {
                data.set("dbClusterIdentifier", om.valueToTree(this.getDbClusterIdentifier()));
            }
            if (this.getDbClusterSnapshotIdentifier() != null) {
                data.set("dbClusterSnapshotIdentifier", om.valueToTree(this.getDbClusterSnapshotIdentifier()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludePublic() != null) {
                data.set("includePublic", om.valueToTree(this.getIncludePublic()));
            }
            if (this.getIncludeShared() != null) {
                data.set("includeShared", om.valueToTree(this.getIncludeShared()));
            }
            if (this.getMostRecent() != null) {
                data.set("mostRecent", om.valueToTree(this.getMostRecent()));
            }
            if (this.getSnapshotType() != null) {
                data.set("snapshotType", om.valueToTree(this.getSnapshotType()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsDbClusterSnapshot.DataAwsDbClusterSnapshotConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsDbClusterSnapshotConfig.Jsii$Proxy that = (DataAwsDbClusterSnapshotConfig.Jsii$Proxy) o;

            if (this.dbClusterIdentifier != null ? !this.dbClusterIdentifier.equals(that.dbClusterIdentifier) : that.dbClusterIdentifier != null) return false;
            if (this.dbClusterSnapshotIdentifier != null ? !this.dbClusterSnapshotIdentifier.equals(that.dbClusterSnapshotIdentifier) : that.dbClusterSnapshotIdentifier != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includePublic != null ? !this.includePublic.equals(that.includePublic) : that.includePublic != null) return false;
            if (this.includeShared != null ? !this.includeShared.equals(that.includeShared) : that.includeShared != null) return false;
            if (this.mostRecent != null ? !this.mostRecent.equals(that.mostRecent) : that.mostRecent != null) return false;
            if (this.snapshotType != null ? !this.snapshotType.equals(that.snapshotType) : that.snapshotType != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            int result = this.dbClusterIdentifier != null ? this.dbClusterIdentifier.hashCode() : 0;
            result = 31 * result + (this.dbClusterSnapshotIdentifier != null ? this.dbClusterSnapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includePublic != null ? this.includePublic.hashCode() : 0);
            result = 31 * result + (this.includeShared != null ? this.includeShared.hashCode() : 0);
            result = 31 * result + (this.mostRecent != null ? this.mostRecent.hashCode() : 0);
            result = 31 * result + (this.snapshotType != null ? this.snapshotType.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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
