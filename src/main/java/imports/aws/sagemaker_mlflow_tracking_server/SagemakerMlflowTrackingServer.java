package imports.aws.sagemaker_mlflow_tracking_server;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server aws_sagemaker_mlflow_tracking_server}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerMlflowTrackingServer.SagemakerMlflowTrackingServer")
public class SagemakerMlflowTrackingServer extends com.hashicorp.cdktf.TerraformResource {

    protected SagemakerMlflowTrackingServer(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerMlflowTrackingServer(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServer.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server aws_sagemaker_mlflow_tracking_server} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SagemakerMlflowTrackingServer(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServerConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SagemakerMlflowTrackingServer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SagemakerMlflowTrackingServer to import. This parameter is required.
     * @param importFromId The id of the existing SagemakerMlflowTrackingServer that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SagemakerMlflowTrackingServer to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SagemakerMlflowTrackingServer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SagemakerMlflowTrackingServer to import. This parameter is required.
     * @param importFromId The id of the existing SagemakerMlflowTrackingServer that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAutomaticModelRegistration() {
        software.amazon.jsii.Kernel.call(this, "resetAutomaticModelRegistration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMlflowVersion() {
        software.amazon.jsii.Kernel.call(this, "resetMlflowVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrackingServerSize() {
        software.amazon.jsii.Kernel.call(this, "resetTrackingServerSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeeklyMaintenanceWindowStart() {
        software.amazon.jsii.Kernel.call(this, "resetWeeklyMaintenanceWindowStart", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrackingServerUrl() {
        return software.amazon.jsii.Kernel.get(this, "trackingServerUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArtifactStoreUriInput() {
        return software.amazon.jsii.Kernel.get(this, "artifactStoreUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutomaticModelRegistrationInput() {
        return software.amazon.jsii.Kernel.get(this, "automaticModelRegistrationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMlflowVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "mlflowVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrackingServerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "trackingServerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrackingServerSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "trackingServerSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWeeklyMaintenanceWindowStartInput() {
        return software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceWindowStartInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArtifactStoreUri() {
        return software.amazon.jsii.Kernel.get(this, "artifactStoreUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArtifactStoreUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "artifactStoreUri", java.util.Objects.requireNonNull(value, "artifactStoreUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutomaticModelRegistration() {
        return software.amazon.jsii.Kernel.get(this, "automaticModelRegistration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutomaticModelRegistration(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "automaticModelRegistration", java.util.Objects.requireNonNull(value, "automaticModelRegistration is required"));
    }

    public void setAutomaticModelRegistration(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "automaticModelRegistration", java.util.Objects.requireNonNull(value, "automaticModelRegistration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMlflowVersion() {
        return software.amazon.jsii.Kernel.get(this, "mlflowVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMlflowVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mlflowVersion", java.util.Objects.requireNonNull(value, "mlflowVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTrackingServerName() {
        return software.amazon.jsii.Kernel.get(this, "trackingServerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrackingServerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trackingServerName", java.util.Objects.requireNonNull(value, "trackingServerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrackingServerSize() {
        return software.amazon.jsii.Kernel.get(this, "trackingServerSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrackingServerSize(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trackingServerSize", java.util.Objects.requireNonNull(value, "trackingServerSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWeeklyMaintenanceWindowStart() {
        return software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceWindowStart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWeeklyMaintenanceWindowStart(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "weeklyMaintenanceWindowStart", java.util.Objects.requireNonNull(value, "weeklyMaintenanceWindowStart is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServer}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServer> {
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
        private final imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServerConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServerConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#artifact_store_uri SagemakerMlflowTrackingServer#artifact_store_uri}.
         * <p>
         * @return {@code this}
         * @param artifactStoreUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#artifact_store_uri SagemakerMlflowTrackingServer#artifact_store_uri}. This parameter is required.
         */
        public Builder artifactStoreUri(final java.lang.String artifactStoreUri) {
            this.config.artifactStoreUri(artifactStoreUri);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#role_arn SagemakerMlflowTrackingServer#role_arn}.
         * <p>
         * @return {@code this}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#role_arn SagemakerMlflowTrackingServer#role_arn}. This parameter is required.
         */
        public Builder roleArn(final java.lang.String roleArn) {
            this.config.roleArn(roleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#tracking_server_name SagemakerMlflowTrackingServer#tracking_server_name}.
         * <p>
         * @return {@code this}
         * @param trackingServerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#tracking_server_name SagemakerMlflowTrackingServer#tracking_server_name}. This parameter is required.
         */
        public Builder trackingServerName(final java.lang.String trackingServerName) {
            this.config.trackingServerName(trackingServerName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#automatic_model_registration SagemakerMlflowTrackingServer#automatic_model_registration}.
         * <p>
         * @return {@code this}
         * @param automaticModelRegistration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#automatic_model_registration SagemakerMlflowTrackingServer#automatic_model_registration}. This parameter is required.
         */
        public Builder automaticModelRegistration(final java.lang.Boolean automaticModelRegistration) {
            this.config.automaticModelRegistration(automaticModelRegistration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#automatic_model_registration SagemakerMlflowTrackingServer#automatic_model_registration}.
         * <p>
         * @return {@code this}
         * @param automaticModelRegistration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#automatic_model_registration SagemakerMlflowTrackingServer#automatic_model_registration}. This parameter is required.
         */
        public Builder automaticModelRegistration(final com.hashicorp.cdktf.IResolvable automaticModelRegistration) {
            this.config.automaticModelRegistration(automaticModelRegistration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#id SagemakerMlflowTrackingServer#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#id SagemakerMlflowTrackingServer#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#mlflow_version SagemakerMlflowTrackingServer#mlflow_version}.
         * <p>
         * @return {@code this}
         * @param mlflowVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#mlflow_version SagemakerMlflowTrackingServer#mlflow_version}. This parameter is required.
         */
        public Builder mlflowVersion(final java.lang.String mlflowVersion) {
            this.config.mlflowVersion(mlflowVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#tags SagemakerMlflowTrackingServer#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#tags SagemakerMlflowTrackingServer#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#tags_all SagemakerMlflowTrackingServer#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#tags_all SagemakerMlflowTrackingServer#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#tracking_server_size SagemakerMlflowTrackingServer#tracking_server_size}.
         * <p>
         * @return {@code this}
         * @param trackingServerSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#tracking_server_size SagemakerMlflowTrackingServer#tracking_server_size}. This parameter is required.
         */
        public Builder trackingServerSize(final java.lang.String trackingServerSize) {
            this.config.trackingServerSize(trackingServerSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#weekly_maintenance_window_start SagemakerMlflowTrackingServer#weekly_maintenance_window_start}.
         * <p>
         * @return {@code this}
         * @param weeklyMaintenanceWindowStart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_mlflow_tracking_server#weekly_maintenance_window_start SagemakerMlflowTrackingServer#weekly_maintenance_window_start}. This parameter is required.
         */
        public Builder weeklyMaintenanceWindowStart(final java.lang.String weeklyMaintenanceWindowStart) {
            this.config.weeklyMaintenanceWindowStart(weeklyMaintenanceWindowStart);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServer}.
         */
        @Override
        public imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServer build() {
            return new imports.aws.sagemaker_mlflow_tracking_server.SagemakerMlflowTrackingServer(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
