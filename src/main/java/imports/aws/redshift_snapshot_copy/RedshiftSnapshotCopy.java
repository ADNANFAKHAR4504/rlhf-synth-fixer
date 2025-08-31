package imports.aws.redshift_snapshot_copy;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy aws_redshift_snapshot_copy}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.166Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftSnapshotCopy.RedshiftSnapshotCopy")
public class RedshiftSnapshotCopy extends com.hashicorp.cdktf.TerraformResource {

    protected RedshiftSnapshotCopy(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftSnapshotCopy(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopy.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy aws_redshift_snapshot_copy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public RedshiftSnapshotCopy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a RedshiftSnapshotCopy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftSnapshotCopy to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftSnapshotCopy that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the RedshiftSnapshotCopy to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a RedshiftSnapshotCopy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftSnapshotCopy to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftSnapshotCopy that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetManualSnapshotRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetManualSnapshotRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotCopyGrantName() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotCopyGrantName", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getManualSnapshotRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "manualSnapshotRetentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotCopyGrantNameInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotCopyGrantNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterIdentifier", java.util.Objects.requireNonNull(value, "clusterIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationRegion() {
        return software.amazon.jsii.Kernel.get(this, "destinationRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationRegion", java.util.Objects.requireNonNull(value, "destinationRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getManualSnapshotRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "manualSnapshotRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setManualSnapshotRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "manualSnapshotRetentionPeriod", java.util.Objects.requireNonNull(value, "manualSnapshotRetentionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retentionPeriod", java.util.Objects.requireNonNull(value, "retentionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotCopyGrantName() {
        return software.amazon.jsii.Kernel.get(this, "snapshotCopyGrantName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotCopyGrantName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotCopyGrantName", java.util.Objects.requireNonNull(value, "snapshotCopyGrantName is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopy}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopy> {
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
        private final imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopyConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#cluster_identifier RedshiftSnapshotCopy#cluster_identifier}.
         * <p>
         * @return {@code this}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#cluster_identifier RedshiftSnapshotCopy#cluster_identifier}. This parameter is required.
         */
        public Builder clusterIdentifier(final java.lang.String clusterIdentifier) {
            this.config.clusterIdentifier(clusterIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#destination_region RedshiftSnapshotCopy#destination_region}.
         * <p>
         * @return {@code this}
         * @param destinationRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#destination_region RedshiftSnapshotCopy#destination_region}. This parameter is required.
         */
        public Builder destinationRegion(final java.lang.String destinationRegion) {
            this.config.destinationRegion(destinationRegion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#manual_snapshot_retention_period RedshiftSnapshotCopy#manual_snapshot_retention_period}.
         * <p>
         * @return {@code this}
         * @param manualSnapshotRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#manual_snapshot_retention_period RedshiftSnapshotCopy#manual_snapshot_retention_period}. This parameter is required.
         */
        public Builder manualSnapshotRetentionPeriod(final java.lang.Number manualSnapshotRetentionPeriod) {
            this.config.manualSnapshotRetentionPeriod(manualSnapshotRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#retention_period RedshiftSnapshotCopy#retention_period}.
         * <p>
         * @return {@code this}
         * @param retentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#retention_period RedshiftSnapshotCopy#retention_period}. This parameter is required.
         */
        public Builder retentionPeriod(final java.lang.Number retentionPeriod) {
            this.config.retentionPeriod(retentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#snapshot_copy_grant_name RedshiftSnapshotCopy#snapshot_copy_grant_name}.
         * <p>
         * @return {@code this}
         * @param snapshotCopyGrantName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_snapshot_copy#snapshot_copy_grant_name RedshiftSnapshotCopy#snapshot_copy_grant_name}. This parameter is required.
         */
        public Builder snapshotCopyGrantName(final java.lang.String snapshotCopyGrantName) {
            this.config.snapshotCopyGrantName(snapshotCopyGrantName);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopy}.
         */
        @Override
        public imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopy build() {
            return new imports.aws.redshift_snapshot_copy.RedshiftSnapshotCopy(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
