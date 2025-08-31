package imports.aws.db_instance_automated_backups_replication;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication aws_db_instance_automated_backups_replication}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.971Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dbInstanceAutomatedBackupsReplication.DbInstanceAutomatedBackupsReplication")
public class DbInstanceAutomatedBackupsReplication extends com.hashicorp.cdktf.TerraformResource {

    protected DbInstanceAutomatedBackupsReplication(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DbInstanceAutomatedBackupsReplication(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplication.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication aws_db_instance_automated_backups_replication} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DbInstanceAutomatedBackupsReplication(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplicationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DbInstanceAutomatedBackupsReplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DbInstanceAutomatedBackupsReplication to import. This parameter is required.
     * @param importFromId The id of the existing DbInstanceAutomatedBackupsReplication that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DbInstanceAutomatedBackupsReplication to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DbInstanceAutomatedBackupsReplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DbInstanceAutomatedBackupsReplication to import. This parameter is required.
     * @param importFromId The id of the existing DbInstanceAutomatedBackupsReplication that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplicationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreSignedUrl() {
        software.amazon.jsii.Kernel.call(this, "resetPreSignedUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplicationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplicationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreSignedUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "preSignedUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceDbInstanceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDbInstanceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreSignedUrl() {
        return software.amazon.jsii.Kernel.get(this, "preSignedUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreSignedUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preSignedUrl", java.util.Objects.requireNonNull(value, "preSignedUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retentionPeriod", java.util.Objects.requireNonNull(value, "retentionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceDbInstanceArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceDbInstanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceDbInstanceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceDbInstanceArn", java.util.Objects.requireNonNull(value, "sourceDbInstanceArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplication}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplication> {
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
        private final imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplicationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplicationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#source_db_instance_arn DbInstanceAutomatedBackupsReplication#source_db_instance_arn}.
         * <p>
         * @return {@code this}
         * @param sourceDbInstanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#source_db_instance_arn DbInstanceAutomatedBackupsReplication#source_db_instance_arn}. This parameter is required.
         */
        public Builder sourceDbInstanceArn(final java.lang.String sourceDbInstanceArn) {
            this.config.sourceDbInstanceArn(sourceDbInstanceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#id DbInstanceAutomatedBackupsReplication#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#id DbInstanceAutomatedBackupsReplication#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#kms_key_id DbInstanceAutomatedBackupsReplication#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#kms_key_id DbInstanceAutomatedBackupsReplication#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#pre_signed_url DbInstanceAutomatedBackupsReplication#pre_signed_url}.
         * <p>
         * @return {@code this}
         * @param preSignedUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#pre_signed_url DbInstanceAutomatedBackupsReplication#pre_signed_url}. This parameter is required.
         */
        public Builder preSignedUrl(final java.lang.String preSignedUrl) {
            this.config.preSignedUrl(preSignedUrl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#retention_period DbInstanceAutomatedBackupsReplication#retention_period}.
         * <p>
         * @return {@code this}
         * @param retentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#retention_period DbInstanceAutomatedBackupsReplication#retention_period}. This parameter is required.
         */
        public Builder retentionPeriod(final java.lang.Number retentionPeriod) {
            this.config.retentionPeriod(retentionPeriod);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance_automated_backups_replication#timeouts DbInstanceAutomatedBackupsReplication#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplicationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplication}.
         */
        @Override
        public imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplication build() {
            return new imports.aws.db_instance_automated_backups_replication.DbInstanceAutomatedBackupsReplication(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
