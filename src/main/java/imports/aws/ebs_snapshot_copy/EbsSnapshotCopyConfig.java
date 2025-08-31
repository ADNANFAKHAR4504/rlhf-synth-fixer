package imports.aws.ebs_snapshot_copy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.063Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ebsSnapshotCopy.EbsSnapshotCopyConfig")
@software.amazon.jsii.Jsii.Proxy(EbsSnapshotCopyConfig.Jsii$Proxy.class)
public interface EbsSnapshotCopyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#source_region EbsSnapshotCopy#source_region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceRegion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#source_snapshot_id EbsSnapshotCopy#source_snapshot_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceSnapshotId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#completion_duration_minutes EbsSnapshotCopy#completion_duration_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCompletionDurationMinutes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#description EbsSnapshotCopy#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#encrypted EbsSnapshotCopy#encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#id EbsSnapshotCopy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#kms_key_id EbsSnapshotCopy#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#permanent_restore EbsSnapshotCopy#permanent_restore}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPermanentRestore() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#storage_tier EbsSnapshotCopy#storage_tier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageTier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#tags EbsSnapshotCopy#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#tags_all EbsSnapshotCopy#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#temporary_restore_days EbsSnapshotCopy#temporary_restore_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTemporaryRestoreDays() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#timeouts EbsSnapshotCopy#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_copy.EbsSnapshotCopyTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EbsSnapshotCopyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EbsSnapshotCopyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EbsSnapshotCopyConfig> {
        java.lang.String sourceRegion;
        java.lang.String sourceSnapshotId;
        java.lang.Number completionDurationMinutes;
        java.lang.String description;
        java.lang.Object encrypted;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.lang.Object permanentRestore;
        java.lang.String storageTier;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number temporaryRestoreDays;
        imports.aws.ebs_snapshot_copy.EbsSnapshotCopyTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getSourceRegion}
         * @param sourceRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#source_region EbsSnapshotCopy#source_region}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceRegion(java.lang.String sourceRegion) {
            this.sourceRegion = sourceRegion;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getSourceSnapshotId}
         * @param sourceSnapshotId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#source_snapshot_id EbsSnapshotCopy#source_snapshot_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceSnapshotId(java.lang.String sourceSnapshotId) {
            this.sourceSnapshotId = sourceSnapshotId;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getCompletionDurationMinutes}
         * @param completionDurationMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#completion_duration_minutes EbsSnapshotCopy#completion_duration_minutes}.
         * @return {@code this}
         */
        public Builder completionDurationMinutes(java.lang.Number completionDurationMinutes) {
            this.completionDurationMinutes = completionDurationMinutes;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#description EbsSnapshotCopy#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#encrypted EbsSnapshotCopy#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.Boolean encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#encrypted EbsSnapshotCopy#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(com.hashicorp.cdktf.IResolvable encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#id EbsSnapshotCopy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#kms_key_id EbsSnapshotCopy#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getPermanentRestore}
         * @param permanentRestore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#permanent_restore EbsSnapshotCopy#permanent_restore}.
         * @return {@code this}
         */
        public Builder permanentRestore(java.lang.Boolean permanentRestore) {
            this.permanentRestore = permanentRestore;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getPermanentRestore}
         * @param permanentRestore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#permanent_restore EbsSnapshotCopy#permanent_restore}.
         * @return {@code this}
         */
        public Builder permanentRestore(com.hashicorp.cdktf.IResolvable permanentRestore) {
            this.permanentRestore = permanentRestore;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getStorageTier}
         * @param storageTier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#storage_tier EbsSnapshotCopy#storage_tier}.
         * @return {@code this}
         */
        public Builder storageTier(java.lang.String storageTier) {
            this.storageTier = storageTier;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#tags EbsSnapshotCopy#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#tags_all EbsSnapshotCopy#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getTemporaryRestoreDays}
         * @param temporaryRestoreDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#temporary_restore_days EbsSnapshotCopy#temporary_restore_days}.
         * @return {@code this}
         */
        public Builder temporaryRestoreDays(java.lang.Number temporaryRestoreDays) {
            this.temporaryRestoreDays = temporaryRestoreDays;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_copy#timeouts EbsSnapshotCopy#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ebs_snapshot_copy.EbsSnapshotCopyTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getDependsOn}
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
         * Sets the value of {@link EbsSnapshotCopyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotCopyConfig#getProvisioners}
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
         * @return a new instance of {@link EbsSnapshotCopyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EbsSnapshotCopyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EbsSnapshotCopyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EbsSnapshotCopyConfig {
        private final java.lang.String sourceRegion;
        private final java.lang.String sourceSnapshotId;
        private final java.lang.Number completionDurationMinutes;
        private final java.lang.String description;
        private final java.lang.Object encrypted;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.lang.Object permanentRestore;
        private final java.lang.String storageTier;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number temporaryRestoreDays;
        private final imports.aws.ebs_snapshot_copy.EbsSnapshotCopyTimeouts timeouts;
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
            this.sourceRegion = software.amazon.jsii.Kernel.get(this, "sourceRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceSnapshotId = software.amazon.jsii.Kernel.get(this, "sourceSnapshotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.completionDurationMinutes = software.amazon.jsii.Kernel.get(this, "completionDurationMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.permanentRestore = software.amazon.jsii.Kernel.get(this, "permanentRestore", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.storageTier = software.amazon.jsii.Kernel.get(this, "storageTier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.temporaryRestoreDays = software.amazon.jsii.Kernel.get(this, "temporaryRestoreDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_copy.EbsSnapshotCopyTimeouts.class));
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
            this.sourceRegion = java.util.Objects.requireNonNull(builder.sourceRegion, "sourceRegion is required");
            this.sourceSnapshotId = java.util.Objects.requireNonNull(builder.sourceSnapshotId, "sourceSnapshotId is required");
            this.completionDurationMinutes = builder.completionDurationMinutes;
            this.description = builder.description;
            this.encrypted = builder.encrypted;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.permanentRestore = builder.permanentRestore;
            this.storageTier = builder.storageTier;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.temporaryRestoreDays = builder.temporaryRestoreDays;
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
        public final java.lang.String getSourceRegion() {
            return this.sourceRegion;
        }

        @Override
        public final java.lang.String getSourceSnapshotId() {
            return this.sourceSnapshotId;
        }

        @Override
        public final java.lang.Number getCompletionDurationMinutes() {
            return this.completionDurationMinutes;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEncrypted() {
            return this.encrypted;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Object getPermanentRestore() {
            return this.permanentRestore;
        }

        @Override
        public final java.lang.String getStorageTier() {
            return this.storageTier;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Number getTemporaryRestoreDays() {
            return this.temporaryRestoreDays;
        }

        @Override
        public final imports.aws.ebs_snapshot_copy.EbsSnapshotCopyTimeouts getTimeouts() {
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

            data.set("sourceRegion", om.valueToTree(this.getSourceRegion()));
            data.set("sourceSnapshotId", om.valueToTree(this.getSourceSnapshotId()));
            if (this.getCompletionDurationMinutes() != null) {
                data.set("completionDurationMinutes", om.valueToTree(this.getCompletionDurationMinutes()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEncrypted() != null) {
                data.set("encrypted", om.valueToTree(this.getEncrypted()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getPermanentRestore() != null) {
                data.set("permanentRestore", om.valueToTree(this.getPermanentRestore()));
            }
            if (this.getStorageTier() != null) {
                data.set("storageTier", om.valueToTree(this.getStorageTier()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTemporaryRestoreDays() != null) {
                data.set("temporaryRestoreDays", om.valueToTree(this.getTemporaryRestoreDays()));
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
            struct.set("fqn", om.valueToTree("aws.ebsSnapshotCopy.EbsSnapshotCopyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EbsSnapshotCopyConfig.Jsii$Proxy that = (EbsSnapshotCopyConfig.Jsii$Proxy) o;

            if (!sourceRegion.equals(that.sourceRegion)) return false;
            if (!sourceSnapshotId.equals(that.sourceSnapshotId)) return false;
            if (this.completionDurationMinutes != null ? !this.completionDurationMinutes.equals(that.completionDurationMinutes) : that.completionDurationMinutes != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.encrypted != null ? !this.encrypted.equals(that.encrypted) : that.encrypted != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.permanentRestore != null ? !this.permanentRestore.equals(that.permanentRestore) : that.permanentRestore != null) return false;
            if (this.storageTier != null ? !this.storageTier.equals(that.storageTier) : that.storageTier != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.temporaryRestoreDays != null ? !this.temporaryRestoreDays.equals(that.temporaryRestoreDays) : that.temporaryRestoreDays != null) return false;
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
            int result = this.sourceRegion.hashCode();
            result = 31 * result + (this.sourceSnapshotId.hashCode());
            result = 31 * result + (this.completionDurationMinutes != null ? this.completionDurationMinutes.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.encrypted != null ? this.encrypted.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.permanentRestore != null ? this.permanentRestore.hashCode() : 0);
            result = 31 * result + (this.storageTier != null ? this.storageTier.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.temporaryRestoreDays != null ? this.temporaryRestoreDays.hashCode() : 0);
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
