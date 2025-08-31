package imports.aws.macie2_classification_job;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job aws_macie2_classification_job}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.847Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJob")
public class Macie2ClassificationJob extends com.hashicorp.cdktf.TerraformResource {

    protected Macie2ClassificationJob(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Macie2ClassificationJob(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.macie2_classification_job.Macie2ClassificationJob.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job aws_macie2_classification_job} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Macie2ClassificationJob(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Macie2ClassificationJob resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Macie2ClassificationJob to import. This parameter is required.
     * @param importFromId The id of the existing Macie2ClassificationJob that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Macie2ClassificationJob to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.macie2_classification_job.Macie2ClassificationJob.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Macie2ClassificationJob resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Macie2ClassificationJob to import. This parameter is required.
     * @param importFromId The id of the existing Macie2ClassificationJob that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.macie2_classification_job.Macie2ClassificationJob.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putS3JobDefinition(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinition value) {
        software.amazon.jsii.Kernel.call(this, "putS3JobDefinition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScheduleFrequency(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequency value) {
        software.amazon.jsii.Kernel.call(this, "putScheduleFrequency", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomDataIdentifierIds() {
        software.amazon.jsii.Kernel.call(this, "resetCustomDataIdentifierIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitialRun() {
        software.amazon.jsii.Kernel.call(this, "resetInitialRun", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJobStatus() {
        software.amazon.jsii.Kernel.call(this, "resetJobStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSamplingPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetSamplingPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobArn() {
        return software.amazon.jsii.Kernel.get(this, "jobArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobId() {
        return software.amazon.jsii.Kernel.get(this, "jobId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionOutputReference getS3JobDefinition() {
        return software.amazon.jsii.Kernel.get(this, "s3JobDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequencyOutputReference getScheduleFrequency() {
        return software.amazon.jsii.Kernel.get(this, "scheduleFrequency", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequencyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.macie2_classification_job.Macie2ClassificationJobUserPausedDetailsList getUserPausedDetails() {
        return software.amazon.jsii.Kernel.get(this, "userPausedDetails", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobUserPausedDetailsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomDataIdentifierIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customDataIdentifierIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInitialRunInput() {
        return software.amazon.jsii.Kernel.get(this, "initialRunInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "jobStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "jobTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinition getS3JobDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "s3JobDefinitionInput", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinition.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSamplingPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "samplingPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequency getScheduleFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleFrequencyInput", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequency.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomDataIdentifierIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customDataIdentifierIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomDataIdentifierIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customDataIdentifierIds", java.util.Objects.requireNonNull(value, "customDataIdentifierIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInitialRun() {
        return software.amazon.jsii.Kernel.get(this, "initialRun", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInitialRun(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "initialRun", java.util.Objects.requireNonNull(value, "initialRun is required"));
    }

    public void setInitialRun(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "initialRun", java.util.Objects.requireNonNull(value, "initialRun is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobStatus() {
        return software.amazon.jsii.Kernel.get(this, "jobStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobStatus", java.util.Objects.requireNonNull(value, "jobStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobType() {
        return software.amazon.jsii.Kernel.get(this, "jobType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobType", java.util.Objects.requireNonNull(value, "jobType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namePrefix", java.util.Objects.requireNonNull(value, "namePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSamplingPercentage() {
        return software.amazon.jsii.Kernel.get(this, "samplingPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSamplingPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "samplingPercentage", java.util.Objects.requireNonNull(value, "samplingPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.macie2_classification_job.Macie2ClassificationJob}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.macie2_classification_job.Macie2ClassificationJob> {
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
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.macie2_classification_job.Macie2ClassificationJobConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#job_type Macie2ClassificationJob#job_type}.
         * <p>
         * @return {@code this}
         * @param jobType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#job_type Macie2ClassificationJob#job_type}. This parameter is required.
         */
        public Builder jobType(final java.lang.String jobType) {
            this.config.jobType(jobType);
            return this;
        }

        /**
         * s3_job_definition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#s3_job_definition Macie2ClassificationJob#s3_job_definition}
         * <p>
         * @return {@code this}
         * @param s3JobDefinition s3_job_definition block. This parameter is required.
         */
        public Builder s3JobDefinition(final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinition s3JobDefinition) {
            this.config.s3JobDefinition(s3JobDefinition);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#custom_data_identifier_ids Macie2ClassificationJob#custom_data_identifier_ids}.
         * <p>
         * @return {@code this}
         * @param customDataIdentifierIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#custom_data_identifier_ids Macie2ClassificationJob#custom_data_identifier_ids}. This parameter is required.
         */
        public Builder customDataIdentifierIds(final java.util.List<java.lang.String> customDataIdentifierIds) {
            this.config.customDataIdentifierIds(customDataIdentifierIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#description Macie2ClassificationJob#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#description Macie2ClassificationJob#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#id Macie2ClassificationJob#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#id Macie2ClassificationJob#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#initial_run Macie2ClassificationJob#initial_run}.
         * <p>
         * @return {@code this}
         * @param initialRun Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#initial_run Macie2ClassificationJob#initial_run}. This parameter is required.
         */
        public Builder initialRun(final java.lang.Boolean initialRun) {
            this.config.initialRun(initialRun);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#initial_run Macie2ClassificationJob#initial_run}.
         * <p>
         * @return {@code this}
         * @param initialRun Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#initial_run Macie2ClassificationJob#initial_run}. This parameter is required.
         */
        public Builder initialRun(final com.hashicorp.cdktf.IResolvable initialRun) {
            this.config.initialRun(initialRun);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#job_status Macie2ClassificationJob#job_status}.
         * <p>
         * @return {@code this}
         * @param jobStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#job_status Macie2ClassificationJob#job_status}. This parameter is required.
         */
        public Builder jobStatus(final java.lang.String jobStatus) {
            this.config.jobStatus(jobStatus);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#name Macie2ClassificationJob#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#name Macie2ClassificationJob#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#name_prefix Macie2ClassificationJob#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#name_prefix Macie2ClassificationJob#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config.namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#sampling_percentage Macie2ClassificationJob#sampling_percentage}.
         * <p>
         * @return {@code this}
         * @param samplingPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#sampling_percentage Macie2ClassificationJob#sampling_percentage}. This parameter is required.
         */
        public Builder samplingPercentage(final java.lang.Number samplingPercentage) {
            this.config.samplingPercentage(samplingPercentage);
            return this;
        }

        /**
         * schedule_frequency block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#schedule_frequency Macie2ClassificationJob#schedule_frequency}
         * <p>
         * @return {@code this}
         * @param scheduleFrequency schedule_frequency block. This parameter is required.
         */
        public Builder scheduleFrequency(final imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequency scheduleFrequency) {
            this.config.scheduleFrequency(scheduleFrequency);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tags Macie2ClassificationJob#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tags Macie2ClassificationJob#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tags_all Macie2ClassificationJob#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tags_all Macie2ClassificationJob#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#timeouts Macie2ClassificationJob#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.macie2_classification_job.Macie2ClassificationJobTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.macie2_classification_job.Macie2ClassificationJob}.
         */
        @Override
        public imports.aws.macie2_classification_job.Macie2ClassificationJob build() {
            return new imports.aws.macie2_classification_job.Macie2ClassificationJob(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
