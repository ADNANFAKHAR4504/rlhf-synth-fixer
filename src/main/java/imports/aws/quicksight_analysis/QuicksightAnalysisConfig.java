package imports.aws.quicksight_analysis;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.097Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightAnalysis.QuicksightAnalysisConfig")
@software.amazon.jsii.Jsii.Proxy(QuicksightAnalysisConfig.Jsii$Proxy.class)
public interface QuicksightAnalysisConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#analysis_id QuicksightAnalysis#analysis_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAnalysisId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#name QuicksightAnalysis#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#aws_account_id QuicksightAnalysis#aws_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountId() {
        return null;
    }

    /**
     * definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#definition QuicksightAnalysis#definition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefinition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#id QuicksightAnalysis#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#parameters QuicksightAnalysis#parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisParameters getParameters() {
        return null;
    }

    /**
     * permissions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#permissions QuicksightAnalysis#permissions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPermissions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#recovery_window_in_days QuicksightAnalysis#recovery_window_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRecoveryWindowInDays() {
        return null;
    }

    /**
     * source_entity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#source_entity QuicksightAnalysis#source_entity}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity getSourceEntity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#tags QuicksightAnalysis#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#tags_all QuicksightAnalysis#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#theme_arn QuicksightAnalysis#theme_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getThemeArn() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#timeouts QuicksightAnalysis#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightAnalysisConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightAnalysisConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightAnalysisConfig> {
        java.lang.String analysisId;
        java.lang.String name;
        java.lang.String awsAccountId;
        java.lang.Object definition;
        java.lang.String id;
        imports.aws.quicksight_analysis.QuicksightAnalysisParameters parameters;
        java.lang.Object permissions;
        java.lang.Number recoveryWindowInDays;
        imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity sourceEntity;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String themeArn;
        imports.aws.quicksight_analysis.QuicksightAnalysisTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getAnalysisId}
         * @param analysisId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#analysis_id QuicksightAnalysis#analysis_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder analysisId(java.lang.String analysisId) {
            this.analysisId = analysisId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#name QuicksightAnalysis#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getAwsAccountId}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#aws_account_id QuicksightAnalysis#aws_account_id}.
         * @return {@code this}
         */
        public Builder awsAccountId(java.lang.String awsAccountId) {
            this.awsAccountId = awsAccountId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getDefinition}
         * @param definition definition block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#definition QuicksightAnalysis#definition}
         * @return {@code this}
         */
        public Builder definition(java.lang.Object definition) {
            this.definition = definition;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#id QuicksightAnalysis#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#parameters QuicksightAnalysis#parameters}
         * @return {@code this}
         */
        public Builder parameters(imports.aws.quicksight_analysis.QuicksightAnalysisParameters parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getPermissions}
         * @param permissions permissions block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#permissions QuicksightAnalysis#permissions}
         * @return {@code this}
         */
        public Builder permissions(com.hashicorp.cdktf.IResolvable permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getPermissions}
         * @param permissions permissions block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#permissions QuicksightAnalysis#permissions}
         * @return {@code this}
         */
        public Builder permissions(java.util.List<? extends imports.aws.quicksight_analysis.QuicksightAnalysisPermissions> permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getRecoveryWindowInDays}
         * @param recoveryWindowInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#recovery_window_in_days QuicksightAnalysis#recovery_window_in_days}.
         * @return {@code this}
         */
        public Builder recoveryWindowInDays(java.lang.Number recoveryWindowInDays) {
            this.recoveryWindowInDays = recoveryWindowInDays;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getSourceEntity}
         * @param sourceEntity source_entity block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#source_entity QuicksightAnalysis#source_entity}
         * @return {@code this}
         */
        public Builder sourceEntity(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity sourceEntity) {
            this.sourceEntity = sourceEntity;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#tags QuicksightAnalysis#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#tags_all QuicksightAnalysis#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getThemeArn}
         * @param themeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#theme_arn QuicksightAnalysis#theme_arn}.
         * @return {@code this}
         */
        public Builder themeArn(java.lang.String themeArn) {
            this.themeArn = themeArn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#timeouts QuicksightAnalysis#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.quicksight_analysis.QuicksightAnalysisTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getDependsOn}
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
         * Sets the value of {@link QuicksightAnalysisConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisConfig#getProvisioners}
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
         * @return a new instance of {@link QuicksightAnalysisConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightAnalysisConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightAnalysisConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightAnalysisConfig {
        private final java.lang.String analysisId;
        private final java.lang.String name;
        private final java.lang.String awsAccountId;
        private final java.lang.Object definition;
        private final java.lang.String id;
        private final imports.aws.quicksight_analysis.QuicksightAnalysisParameters parameters;
        private final java.lang.Object permissions;
        private final java.lang.Number recoveryWindowInDays;
        private final imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity sourceEntity;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String themeArn;
        private final imports.aws.quicksight_analysis.QuicksightAnalysisTimeouts timeouts;
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
            this.analysisId = software.amazon.jsii.Kernel.get(this, "analysisId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsAccountId = software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.definition = software.amazon.jsii.Kernel.get(this, "definition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisParameters.class));
            this.permissions = software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.recoveryWindowInDays = software.amazon.jsii.Kernel.get(this, "recoveryWindowInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sourceEntity = software.amazon.jsii.Kernel.get(this, "sourceEntity", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.themeArn = software.amazon.jsii.Kernel.get(this, "themeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisTimeouts.class));
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
            this.analysisId = java.util.Objects.requireNonNull(builder.analysisId, "analysisId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.awsAccountId = builder.awsAccountId;
            this.definition = builder.definition;
            this.id = builder.id;
            this.parameters = builder.parameters;
            this.permissions = builder.permissions;
            this.recoveryWindowInDays = builder.recoveryWindowInDays;
            this.sourceEntity = builder.sourceEntity;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.themeArn = builder.themeArn;
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
        public final java.lang.String getAnalysisId() {
            return this.analysisId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getAwsAccountId() {
            return this.awsAccountId;
        }

        @Override
        public final java.lang.Object getDefinition() {
            return this.definition;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.quicksight_analysis.QuicksightAnalysisParameters getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.Object getPermissions() {
            return this.permissions;
        }

        @Override
        public final java.lang.Number getRecoveryWindowInDays() {
            return this.recoveryWindowInDays;
        }

        @Override
        public final imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity getSourceEntity() {
            return this.sourceEntity;
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
        public final java.lang.String getThemeArn() {
            return this.themeArn;
        }

        @Override
        public final imports.aws.quicksight_analysis.QuicksightAnalysisTimeouts getTimeouts() {
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

            data.set("analysisId", om.valueToTree(this.getAnalysisId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAwsAccountId() != null) {
                data.set("awsAccountId", om.valueToTree(this.getAwsAccountId()));
            }
            if (this.getDefinition() != null) {
                data.set("definition", om.valueToTree(this.getDefinition()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getPermissions() != null) {
                data.set("permissions", om.valueToTree(this.getPermissions()));
            }
            if (this.getRecoveryWindowInDays() != null) {
                data.set("recoveryWindowInDays", om.valueToTree(this.getRecoveryWindowInDays()));
            }
            if (this.getSourceEntity() != null) {
                data.set("sourceEntity", om.valueToTree(this.getSourceEntity()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getThemeArn() != null) {
                data.set("themeArn", om.valueToTree(this.getThemeArn()));
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
            struct.set("fqn", om.valueToTree("aws.quicksightAnalysis.QuicksightAnalysisConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightAnalysisConfig.Jsii$Proxy that = (QuicksightAnalysisConfig.Jsii$Proxy) o;

            if (!analysisId.equals(that.analysisId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.awsAccountId != null ? !this.awsAccountId.equals(that.awsAccountId) : that.awsAccountId != null) return false;
            if (this.definition != null ? !this.definition.equals(that.definition) : that.definition != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.permissions != null ? !this.permissions.equals(that.permissions) : that.permissions != null) return false;
            if (this.recoveryWindowInDays != null ? !this.recoveryWindowInDays.equals(that.recoveryWindowInDays) : that.recoveryWindowInDays != null) return false;
            if (this.sourceEntity != null ? !this.sourceEntity.equals(that.sourceEntity) : that.sourceEntity != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.themeArn != null ? !this.themeArn.equals(that.themeArn) : that.themeArn != null) return false;
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
            int result = this.analysisId.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.awsAccountId != null ? this.awsAccountId.hashCode() : 0);
            result = 31 * result + (this.definition != null ? this.definition.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.permissions != null ? this.permissions.hashCode() : 0);
            result = 31 * result + (this.recoveryWindowInDays != null ? this.recoveryWindowInDays.hashCode() : 0);
            result = 31 * result + (this.sourceEntity != null ? this.sourceEntity.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.themeArn != null ? this.themeArn.hashCode() : 0);
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
