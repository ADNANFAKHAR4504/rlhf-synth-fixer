package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeConfig")
@software.amazon.jsii.Jsii.Proxy(PipesPipeConfig.Jsii$Proxy.class)
public interface PipesPipeConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#role_arn PipesPipe#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target PipesPipe#target}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTarget();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#description PipesPipe#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#desired_state PipesPipe#desired_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDesiredState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment PipesPipe#enrichment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEnrichment() {
        return null;
    }

    /**
     * enrichment_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment_parameters PipesPipe#enrichment_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeEnrichmentParameters getEnrichmentParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#id PipesPipe#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kms_key_identifier PipesPipe#kms_key_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdentifier() {
        return null;
    }

    /**
     * log_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_configuration PipesPipe#log_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfiguration getLogConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name_prefix PipesPipe#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * source_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source_parameters PipesPipe#source_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParameters getSourceParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags PipesPipe#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags_all PipesPipe#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * target_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target_parameters PipesPipe#target_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParameters getTargetParameters() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timeouts PipesPipe#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeConfig> {
        java.lang.String roleArn;
        java.lang.String source;
        java.lang.String target;
        java.lang.String description;
        java.lang.String desiredState;
        java.lang.String enrichment;
        imports.aws.pipes_pipe.PipesPipeEnrichmentParameters enrichmentParameters;
        java.lang.String id;
        java.lang.String kmsKeyIdentifier;
        imports.aws.pipes_pipe.PipesPipeLogConfiguration logConfiguration;
        java.lang.String name;
        java.lang.String namePrefix;
        imports.aws.pipes_pipe.PipesPipeSourceParameters sourceParameters;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.pipes_pipe.PipesPipeTargetParameters targetParameters;
        imports.aws.pipes_pipe.PipesPipeTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link PipesPipeConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#role_arn PipesPipe#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getTarget}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target PipesPipe#target}. This parameter is required.
         * @return {@code this}
         */
        public Builder target(java.lang.String target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#description PipesPipe#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getDesiredState}
         * @param desiredState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#desired_state PipesPipe#desired_state}.
         * @return {@code this}
         */
        public Builder desiredState(java.lang.String desiredState) {
            this.desiredState = desiredState;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getEnrichment}
         * @param enrichment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment PipesPipe#enrichment}.
         * @return {@code this}
         */
        public Builder enrichment(java.lang.String enrichment) {
            this.enrichment = enrichment;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getEnrichmentParameters}
         * @param enrichmentParameters enrichment_parameters block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment_parameters PipesPipe#enrichment_parameters}
         * @return {@code this}
         */
        public Builder enrichmentParameters(imports.aws.pipes_pipe.PipesPipeEnrichmentParameters enrichmentParameters) {
            this.enrichmentParameters = enrichmentParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#id PipesPipe#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getKmsKeyIdentifier}
         * @param kmsKeyIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kms_key_identifier PipesPipe#kms_key_identifier}.
         * @return {@code this}
         */
        public Builder kmsKeyIdentifier(java.lang.String kmsKeyIdentifier) {
            this.kmsKeyIdentifier = kmsKeyIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getLogConfiguration}
         * @param logConfiguration log_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_configuration PipesPipe#log_configuration}
         * @return {@code this}
         */
        public Builder logConfiguration(imports.aws.pipes_pipe.PipesPipeLogConfiguration logConfiguration) {
            this.logConfiguration = logConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name_prefix PipesPipe#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getSourceParameters}
         * @param sourceParameters source_parameters block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source_parameters PipesPipe#source_parameters}
         * @return {@code this}
         */
        public Builder sourceParameters(imports.aws.pipes_pipe.PipesPipeSourceParameters sourceParameters) {
            this.sourceParameters = sourceParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags PipesPipe#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags_all PipesPipe#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getTargetParameters}
         * @param targetParameters target_parameters block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target_parameters PipesPipe#target_parameters}
         * @return {@code this}
         */
        public Builder targetParameters(imports.aws.pipes_pipe.PipesPipeTargetParameters targetParameters) {
            this.targetParameters = targetParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timeouts PipesPipe#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.pipes_pipe.PipesPipeTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getDependsOn}
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
         * Sets the value of {@link PipesPipeConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeConfig#getProvisioners}
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
         * @return a new instance of {@link PipesPipeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeConfig {
        private final java.lang.String roleArn;
        private final java.lang.String source;
        private final java.lang.String target;
        private final java.lang.String description;
        private final java.lang.String desiredState;
        private final java.lang.String enrichment;
        private final imports.aws.pipes_pipe.PipesPipeEnrichmentParameters enrichmentParameters;
        private final java.lang.String id;
        private final java.lang.String kmsKeyIdentifier;
        private final imports.aws.pipes_pipe.PipesPipeLogConfiguration logConfiguration;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final imports.aws.pipes_pipe.PipesPipeSourceParameters sourceParameters;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.pipes_pipe.PipesPipeTargetParameters targetParameters;
        private final imports.aws.pipes_pipe.PipesPipeTimeouts timeouts;
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
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.desiredState = software.amazon.jsii.Kernel.get(this, "desiredState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enrichment = software.amazon.jsii.Kernel.get(this, "enrichment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enrichmentParameters = software.amazon.jsii.Kernel.get(this, "enrichmentParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeEnrichmentParameters.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyIdentifier = software.amazon.jsii.Kernel.get(this, "kmsKeyIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logConfiguration = software.amazon.jsii.Kernel.get(this, "logConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfiguration.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceParameters = software.amazon.jsii.Kernel.get(this, "sourceParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParameters.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.targetParameters = software.amazon.jsii.Kernel.get(this, "targetParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParameters.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTimeouts.class));
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
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.target = java.util.Objects.requireNonNull(builder.target, "target is required");
            this.description = builder.description;
            this.desiredState = builder.desiredState;
            this.enrichment = builder.enrichment;
            this.enrichmentParameters = builder.enrichmentParameters;
            this.id = builder.id;
            this.kmsKeyIdentifier = builder.kmsKeyIdentifier;
            this.logConfiguration = builder.logConfiguration;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.sourceParameters = builder.sourceParameters;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.targetParameters = builder.targetParameters;
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
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getTarget() {
            return this.target;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDesiredState() {
            return this.desiredState;
        }

        @Override
        public final java.lang.String getEnrichment() {
            return this.enrichment;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeEnrichmentParameters getEnrichmentParameters() {
            return this.enrichmentParameters;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKeyIdentifier() {
            return this.kmsKeyIdentifier;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeLogConfiguration getLogConfiguration() {
            return this.logConfiguration;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParameters getSourceParameters() {
            return this.sourceParameters;
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
        public final imports.aws.pipes_pipe.PipesPipeTargetParameters getTargetParameters() {
            return this.targetParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTimeouts getTimeouts() {
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

            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("source", om.valueToTree(this.getSource()));
            data.set("target", om.valueToTree(this.getTarget()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDesiredState() != null) {
                data.set("desiredState", om.valueToTree(this.getDesiredState()));
            }
            if (this.getEnrichment() != null) {
                data.set("enrichment", om.valueToTree(this.getEnrichment()));
            }
            if (this.getEnrichmentParameters() != null) {
                data.set("enrichmentParameters", om.valueToTree(this.getEnrichmentParameters()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyIdentifier() != null) {
                data.set("kmsKeyIdentifier", om.valueToTree(this.getKmsKeyIdentifier()));
            }
            if (this.getLogConfiguration() != null) {
                data.set("logConfiguration", om.valueToTree(this.getLogConfiguration()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getSourceParameters() != null) {
                data.set("sourceParameters", om.valueToTree(this.getSourceParameters()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTargetParameters() != null) {
                data.set("targetParameters", om.valueToTree(this.getTargetParameters()));
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
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeConfig.Jsii$Proxy that = (PipesPipeConfig.Jsii$Proxy) o;

            if (!roleArn.equals(that.roleArn)) return false;
            if (!source.equals(that.source)) return false;
            if (!target.equals(that.target)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.desiredState != null ? !this.desiredState.equals(that.desiredState) : that.desiredState != null) return false;
            if (this.enrichment != null ? !this.enrichment.equals(that.enrichment) : that.enrichment != null) return false;
            if (this.enrichmentParameters != null ? !this.enrichmentParameters.equals(that.enrichmentParameters) : that.enrichmentParameters != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyIdentifier != null ? !this.kmsKeyIdentifier.equals(that.kmsKeyIdentifier) : that.kmsKeyIdentifier != null) return false;
            if (this.logConfiguration != null ? !this.logConfiguration.equals(that.logConfiguration) : that.logConfiguration != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.sourceParameters != null ? !this.sourceParameters.equals(that.sourceParameters) : that.sourceParameters != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.targetParameters != null ? !this.targetParameters.equals(that.targetParameters) : that.targetParameters != null) return false;
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
            int result = this.roleArn.hashCode();
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.target.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.desiredState != null ? this.desiredState.hashCode() : 0);
            result = 31 * result + (this.enrichment != null ? this.enrichment.hashCode() : 0);
            result = 31 * result + (this.enrichmentParameters != null ? this.enrichmentParameters.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyIdentifier != null ? this.kmsKeyIdentifier.hashCode() : 0);
            result = 31 * result + (this.logConfiguration != null ? this.logConfiguration.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.sourceParameters != null ? this.sourceParameters.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.targetParameters != null ? this.targetParameters.hashCode() : 0);
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
