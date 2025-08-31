package imports.aws.rds_cluster_snapshot_copy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.144Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsClusterSnapshotCopy.RdsClusterSnapshotCopyConfig")
@software.amazon.jsii.Jsii.Proxy(RdsClusterSnapshotCopyConfig.Jsii$Proxy.class)
public interface RdsClusterSnapshotCopyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#source_db_cluster_snapshot_identifier RdsClusterSnapshotCopy#source_db_cluster_snapshot_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceDbClusterSnapshotIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#target_db_cluster_snapshot_identifier RdsClusterSnapshotCopy#target_db_cluster_snapshot_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetDbClusterSnapshotIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#copy_tags RdsClusterSnapshotCopy#copy_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#destination_region RdsClusterSnapshotCopy#destination_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestinationRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#kms_key_id RdsClusterSnapshotCopy#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#presigned_url RdsClusterSnapshotCopy#presigned_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPresignedUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#shared_accounts RdsClusterSnapshotCopy#shared_accounts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSharedAccounts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#tags RdsClusterSnapshotCopy#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#timeouts RdsClusterSnapshotCopy#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_cluster_snapshot_copy.RdsClusterSnapshotCopyTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RdsClusterSnapshotCopyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RdsClusterSnapshotCopyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RdsClusterSnapshotCopyConfig> {
        java.lang.String sourceDbClusterSnapshotIdentifier;
        java.lang.String targetDbClusterSnapshotIdentifier;
        java.lang.Object copyTags;
        java.lang.String destinationRegion;
        java.lang.String kmsKeyId;
        java.lang.String presignedUrl;
        java.util.List<java.lang.String> sharedAccounts;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.rds_cluster_snapshot_copy.RdsClusterSnapshotCopyTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getSourceDbClusterSnapshotIdentifier}
         * @param sourceDbClusterSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#source_db_cluster_snapshot_identifier RdsClusterSnapshotCopy#source_db_cluster_snapshot_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceDbClusterSnapshotIdentifier(java.lang.String sourceDbClusterSnapshotIdentifier) {
            this.sourceDbClusterSnapshotIdentifier = sourceDbClusterSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getTargetDbClusterSnapshotIdentifier}
         * @param targetDbClusterSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#target_db_cluster_snapshot_identifier RdsClusterSnapshotCopy#target_db_cluster_snapshot_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetDbClusterSnapshotIdentifier(java.lang.String targetDbClusterSnapshotIdentifier) {
            this.targetDbClusterSnapshotIdentifier = targetDbClusterSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getCopyTags}
         * @param copyTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#copy_tags RdsClusterSnapshotCopy#copy_tags}.
         * @return {@code this}
         */
        public Builder copyTags(java.lang.Boolean copyTags) {
            this.copyTags = copyTags;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getCopyTags}
         * @param copyTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#copy_tags RdsClusterSnapshotCopy#copy_tags}.
         * @return {@code this}
         */
        public Builder copyTags(com.hashicorp.cdktf.IResolvable copyTags) {
            this.copyTags = copyTags;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getDestinationRegion}
         * @param destinationRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#destination_region RdsClusterSnapshotCopy#destination_region}.
         * @return {@code this}
         */
        public Builder destinationRegion(java.lang.String destinationRegion) {
            this.destinationRegion = destinationRegion;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#kms_key_id RdsClusterSnapshotCopy#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getPresignedUrl}
         * @param presignedUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#presigned_url RdsClusterSnapshotCopy#presigned_url}.
         * @return {@code this}
         */
        public Builder presignedUrl(java.lang.String presignedUrl) {
            this.presignedUrl = presignedUrl;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getSharedAccounts}
         * @param sharedAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#shared_accounts RdsClusterSnapshotCopy#shared_accounts}.
         * @return {@code this}
         */
        public Builder sharedAccounts(java.util.List<java.lang.String> sharedAccounts) {
            this.sharedAccounts = sharedAccounts;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#tags RdsClusterSnapshotCopy#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_snapshot_copy#timeouts RdsClusterSnapshotCopy#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.rds_cluster_snapshot_copy.RdsClusterSnapshotCopyTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getDependsOn}
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
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterSnapshotCopyConfig#getProvisioners}
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
         * @return a new instance of {@link RdsClusterSnapshotCopyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RdsClusterSnapshotCopyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RdsClusterSnapshotCopyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RdsClusterSnapshotCopyConfig {
        private final java.lang.String sourceDbClusterSnapshotIdentifier;
        private final java.lang.String targetDbClusterSnapshotIdentifier;
        private final java.lang.Object copyTags;
        private final java.lang.String destinationRegion;
        private final java.lang.String kmsKeyId;
        private final java.lang.String presignedUrl;
        private final java.util.List<java.lang.String> sharedAccounts;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.rds_cluster_snapshot_copy.RdsClusterSnapshotCopyTimeouts timeouts;
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
            this.sourceDbClusterSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "sourceDbClusterSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetDbClusterSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "targetDbClusterSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTags = software.amazon.jsii.Kernel.get(this, "copyTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.destinationRegion = software.amazon.jsii.Kernel.get(this, "destinationRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.presignedUrl = software.amazon.jsii.Kernel.get(this, "presignedUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sharedAccounts = software.amazon.jsii.Kernel.get(this, "sharedAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster_snapshot_copy.RdsClusterSnapshotCopyTimeouts.class));
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
            this.sourceDbClusterSnapshotIdentifier = java.util.Objects.requireNonNull(builder.sourceDbClusterSnapshotIdentifier, "sourceDbClusterSnapshotIdentifier is required");
            this.targetDbClusterSnapshotIdentifier = java.util.Objects.requireNonNull(builder.targetDbClusterSnapshotIdentifier, "targetDbClusterSnapshotIdentifier is required");
            this.copyTags = builder.copyTags;
            this.destinationRegion = builder.destinationRegion;
            this.kmsKeyId = builder.kmsKeyId;
            this.presignedUrl = builder.presignedUrl;
            this.sharedAccounts = builder.sharedAccounts;
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
        public final java.lang.String getSourceDbClusterSnapshotIdentifier() {
            return this.sourceDbClusterSnapshotIdentifier;
        }

        @Override
        public final java.lang.String getTargetDbClusterSnapshotIdentifier() {
            return this.targetDbClusterSnapshotIdentifier;
        }

        @Override
        public final java.lang.Object getCopyTags() {
            return this.copyTags;
        }

        @Override
        public final java.lang.String getDestinationRegion() {
            return this.destinationRegion;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getPresignedUrl() {
            return this.presignedUrl;
        }

        @Override
        public final java.util.List<java.lang.String> getSharedAccounts() {
            return this.sharedAccounts;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.rds_cluster_snapshot_copy.RdsClusterSnapshotCopyTimeouts getTimeouts() {
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

            data.set("sourceDbClusterSnapshotIdentifier", om.valueToTree(this.getSourceDbClusterSnapshotIdentifier()));
            data.set("targetDbClusterSnapshotIdentifier", om.valueToTree(this.getTargetDbClusterSnapshotIdentifier()));
            if (this.getCopyTags() != null) {
                data.set("copyTags", om.valueToTree(this.getCopyTags()));
            }
            if (this.getDestinationRegion() != null) {
                data.set("destinationRegion", om.valueToTree(this.getDestinationRegion()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getPresignedUrl() != null) {
                data.set("presignedUrl", om.valueToTree(this.getPresignedUrl()));
            }
            if (this.getSharedAccounts() != null) {
                data.set("sharedAccounts", om.valueToTree(this.getSharedAccounts()));
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
            struct.set("fqn", om.valueToTree("aws.rdsClusterSnapshotCopy.RdsClusterSnapshotCopyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RdsClusterSnapshotCopyConfig.Jsii$Proxy that = (RdsClusterSnapshotCopyConfig.Jsii$Proxy) o;

            if (!sourceDbClusterSnapshotIdentifier.equals(that.sourceDbClusterSnapshotIdentifier)) return false;
            if (!targetDbClusterSnapshotIdentifier.equals(that.targetDbClusterSnapshotIdentifier)) return false;
            if (this.copyTags != null ? !this.copyTags.equals(that.copyTags) : that.copyTags != null) return false;
            if (this.destinationRegion != null ? !this.destinationRegion.equals(that.destinationRegion) : that.destinationRegion != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.presignedUrl != null ? !this.presignedUrl.equals(that.presignedUrl) : that.presignedUrl != null) return false;
            if (this.sharedAccounts != null ? !this.sharedAccounts.equals(that.sharedAccounts) : that.sharedAccounts != null) return false;
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
            int result = this.sourceDbClusterSnapshotIdentifier.hashCode();
            result = 31 * result + (this.targetDbClusterSnapshotIdentifier.hashCode());
            result = 31 * result + (this.copyTags != null ? this.copyTags.hashCode() : 0);
            result = 31 * result + (this.destinationRegion != null ? this.destinationRegion.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.presignedUrl != null ? this.presignedUrl.hashCode() : 0);
            result = 31 * result + (this.sharedAccounts != null ? this.sharedAccounts.hashCode() : 0);
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
