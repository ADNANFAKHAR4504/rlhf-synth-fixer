package imports.aws.signer_signing_job;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job aws_signer_signing_job}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.468Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.signerSigningJob.SignerSigningJob")
public class SignerSigningJob extends com.hashicorp.cdktf.TerraformResource {

    protected SignerSigningJob(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SignerSigningJob(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.signer_signing_job.SignerSigningJob.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job aws_signer_signing_job} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SignerSigningJob(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SignerSigningJob resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SignerSigningJob to import. This parameter is required.
     * @param importFromId The id of the existing SignerSigningJob that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SignerSigningJob to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.signer_signing_job.SignerSigningJob.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SignerSigningJob resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SignerSigningJob to import. This parameter is required.
     * @param importFromId The id of the existing SignerSigningJob that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.signer_signing_job.SignerSigningJob.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDestination(final @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobDestination value) {
        software.amazon.jsii.Kernel.call(this, "putDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSource(final @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobSource value) {
        software.amazon.jsii.Kernel.call(this, "putSource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIgnoreSigningJobFailure() {
        software.amazon.jsii.Kernel.call(this, "resetIgnoreSigningJobFailure", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCompletedAt() {
        return software.amazon.jsii.Kernel.get(this, "completedAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobDestinationOutputReference getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobId() {
        return software.amazon.jsii.Kernel.get(this, "jobId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobInvoker() {
        return software.amazon.jsii.Kernel.get(this, "jobInvoker", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobOwner() {
        return software.amazon.jsii.Kernel.get(this, "jobOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "platformDisplayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformId() {
        return software.amazon.jsii.Kernel.get(this, "platformId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfileVersion() {
        return software.amazon.jsii.Kernel.get(this, "profileVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRequestedBy() {
        return software.amazon.jsii.Kernel.get(this, "requestedBy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobRevocationRecordList getRevocationRecord() {
        return software.amazon.jsii.Kernel.get(this, "revocationRecord", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobRevocationRecordList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSignatureExpiresAt() {
        return software.amazon.jsii.Kernel.get(this, "signatureExpiresAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobSignedObjectList getSignedObject() {
        return software.amazon.jsii.Kernel.get(this, "signedObject", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobSignedObjectList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobSourceOutputReference getSource() {
        return software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobSourceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatusReason() {
        return software.amazon.jsii.Kernel.get(this, "statusReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.signer_signing_job.SignerSigningJobDestination getDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIgnoreSigningJobFailureInput() {
        return software.amazon.jsii.Kernel.get(this, "ignoreSigningJobFailureInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProfileNameInput() {
        return software.amazon.jsii.Kernel.get(this, "profileNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.signer_signing_job.SignerSigningJobSource getSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceInput", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobSource.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIgnoreSigningJobFailure() {
        return software.amazon.jsii.Kernel.get(this, "ignoreSigningJobFailure", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIgnoreSigningJobFailure(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ignoreSigningJobFailure", java.util.Objects.requireNonNull(value, "ignoreSigningJobFailure is required"));
    }

    public void setIgnoreSigningJobFailure(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ignoreSigningJobFailure", java.util.Objects.requireNonNull(value, "ignoreSigningJobFailure is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfileName() {
        return software.amazon.jsii.Kernel.get(this, "profileName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProfileName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "profileName", java.util.Objects.requireNonNull(value, "profileName is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.signer_signing_job.SignerSigningJob}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.signer_signing_job.SignerSigningJob> {
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
        private final imports.aws.signer_signing_job.SignerSigningJobConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.signer_signing_job.SignerSigningJobConfig.Builder();
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
         * destination block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#destination SignerSigningJob#destination}
         * <p>
         * @return {@code this}
         * @param destination destination block. This parameter is required.
         */
        public Builder destination(final imports.aws.signer_signing_job.SignerSigningJobDestination destination) {
            this.config.destination(destination);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#profile_name SignerSigningJob#profile_name}.
         * <p>
         * @return {@code this}
         * @param profileName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#profile_name SignerSigningJob#profile_name}. This parameter is required.
         */
        public Builder profileName(final java.lang.String profileName) {
            this.config.profileName(profileName);
            return this;
        }

        /**
         * source block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#source SignerSigningJob#source}
         * <p>
         * @return {@code this}
         * @param source source block. This parameter is required.
         */
        public Builder source(final imports.aws.signer_signing_job.SignerSigningJobSource source) {
            this.config.source(source);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#id SignerSigningJob#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#id SignerSigningJob#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#ignore_signing_job_failure SignerSigningJob#ignore_signing_job_failure}.
         * <p>
         * @return {@code this}
         * @param ignoreSigningJobFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#ignore_signing_job_failure SignerSigningJob#ignore_signing_job_failure}. This parameter is required.
         */
        public Builder ignoreSigningJobFailure(final java.lang.Boolean ignoreSigningJobFailure) {
            this.config.ignoreSigningJobFailure(ignoreSigningJobFailure);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#ignore_signing_job_failure SignerSigningJob#ignore_signing_job_failure}.
         * <p>
         * @return {@code this}
         * @param ignoreSigningJobFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#ignore_signing_job_failure SignerSigningJob#ignore_signing_job_failure}. This parameter is required.
         */
        public Builder ignoreSigningJobFailure(final com.hashicorp.cdktf.IResolvable ignoreSigningJobFailure) {
            this.config.ignoreSigningJobFailure(ignoreSigningJobFailure);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.signer_signing_job.SignerSigningJob}.
         */
        @Override
        public imports.aws.signer_signing_job.SignerSigningJob build() {
            return new imports.aws.signer_signing_job.SignerSigningJob(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
