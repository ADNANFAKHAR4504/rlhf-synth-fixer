package imports.aws.synthetics_canary;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.538Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanaryConfig")
@software.amazon.jsii.Jsii.Proxy(SyntheticsCanaryConfig.Jsii$Proxy.class)
public interface SyntheticsCanaryConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#artifact_s3_location SyntheticsCanary#artifact_s3_location}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArtifactS3Location();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#execution_role_arn SyntheticsCanary#execution_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#handler SyntheticsCanary#handler}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHandler();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#name SyntheticsCanary#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#runtime_version SyntheticsCanary#runtime_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuntimeVersion();

    /**
     * schedule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#schedule SyntheticsCanary#schedule}
     */
    @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanarySchedule getSchedule();

    /**
     * artifact_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#artifact_config SyntheticsCanary#artifact_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig getArtifactConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#delete_lambda SyntheticsCanary#delete_lambda}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteLambda() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#failure_retention_period SyntheticsCanary#failure_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFailureRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#id SyntheticsCanary#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * run_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#run_config SyntheticsCanary#run_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryRunConfig getRunConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_bucket SyntheticsCanary#s3_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Bucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_key SyntheticsCanary#s3_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Key() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_version SyntheticsCanary#s3_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Version() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#start_canary SyntheticsCanary#start_canary}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStartCanary() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#success_retention_period SyntheticsCanary#success_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSuccessRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#tags SyntheticsCanary#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#tags_all SyntheticsCanary#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#vpc_config SyntheticsCanary#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig getVpcConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#zip_file SyntheticsCanary#zip_file}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getZipFile() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SyntheticsCanaryConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SyntheticsCanaryConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SyntheticsCanaryConfig> {
        java.lang.String artifactS3Location;
        java.lang.String executionRoleArn;
        java.lang.String handler;
        java.lang.String name;
        java.lang.String runtimeVersion;
        imports.aws.synthetics_canary.SyntheticsCanarySchedule schedule;
        imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig artifactConfig;
        java.lang.Object deleteLambda;
        java.lang.Number failureRetentionPeriod;
        java.lang.String id;
        imports.aws.synthetics_canary.SyntheticsCanaryRunConfig runConfig;
        java.lang.String s3Bucket;
        java.lang.String s3Key;
        java.lang.String s3Version;
        java.lang.Object startCanary;
        java.lang.Number successRetentionPeriod;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig vpcConfig;
        java.lang.String zipFile;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getArtifactS3Location}
         * @param artifactS3Location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#artifact_s3_location SyntheticsCanary#artifact_s3_location}. This parameter is required.
         * @return {@code this}
         */
        public Builder artifactS3Location(java.lang.String artifactS3Location) {
            this.artifactS3Location = artifactS3Location;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#execution_role_arn SyntheticsCanary#execution_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getHandler}
         * @param handler Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#handler SyntheticsCanary#handler}. This parameter is required.
         * @return {@code this}
         */
        public Builder handler(java.lang.String handler) {
            this.handler = handler;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#name SyntheticsCanary#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getRuntimeVersion}
         * @param runtimeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#runtime_version SyntheticsCanary#runtime_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder runtimeVersion(java.lang.String runtimeVersion) {
            this.runtimeVersion = runtimeVersion;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getSchedule}
         * @param schedule schedule block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#schedule SyntheticsCanary#schedule}
         * @return {@code this}
         */
        public Builder schedule(imports.aws.synthetics_canary.SyntheticsCanarySchedule schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getArtifactConfig}
         * @param artifactConfig artifact_config block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#artifact_config SyntheticsCanary#artifact_config}
         * @return {@code this}
         */
        public Builder artifactConfig(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig artifactConfig) {
            this.artifactConfig = artifactConfig;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getDeleteLambda}
         * @param deleteLambda Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#delete_lambda SyntheticsCanary#delete_lambda}.
         * @return {@code this}
         */
        public Builder deleteLambda(java.lang.Boolean deleteLambda) {
            this.deleteLambda = deleteLambda;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getDeleteLambda}
         * @param deleteLambda Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#delete_lambda SyntheticsCanary#delete_lambda}.
         * @return {@code this}
         */
        public Builder deleteLambda(com.hashicorp.cdktf.IResolvable deleteLambda) {
            this.deleteLambda = deleteLambda;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getFailureRetentionPeriod}
         * @param failureRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#failure_retention_period SyntheticsCanary#failure_retention_period}.
         * @return {@code this}
         */
        public Builder failureRetentionPeriod(java.lang.Number failureRetentionPeriod) {
            this.failureRetentionPeriod = failureRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#id SyntheticsCanary#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getRunConfig}
         * @param runConfig run_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#run_config SyntheticsCanary#run_config}
         * @return {@code this}
         */
        public Builder runConfig(imports.aws.synthetics_canary.SyntheticsCanaryRunConfig runConfig) {
            this.runConfig = runConfig;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_bucket SyntheticsCanary#s3_bucket}.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getS3Key}
         * @param s3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_key SyntheticsCanary#s3_key}.
         * @return {@code this}
         */
        public Builder s3Key(java.lang.String s3Key) {
            this.s3Key = s3Key;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getS3Version}
         * @param s3Version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_version SyntheticsCanary#s3_version}.
         * @return {@code this}
         */
        public Builder s3Version(java.lang.String s3Version) {
            this.s3Version = s3Version;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getStartCanary}
         * @param startCanary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#start_canary SyntheticsCanary#start_canary}.
         * @return {@code this}
         */
        public Builder startCanary(java.lang.Boolean startCanary) {
            this.startCanary = startCanary;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getStartCanary}
         * @param startCanary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#start_canary SyntheticsCanary#start_canary}.
         * @return {@code this}
         */
        public Builder startCanary(com.hashicorp.cdktf.IResolvable startCanary) {
            this.startCanary = startCanary;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getSuccessRetentionPeriod}
         * @param successRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#success_retention_period SyntheticsCanary#success_retention_period}.
         * @return {@code this}
         */
        public Builder successRetentionPeriod(java.lang.Number successRetentionPeriod) {
            this.successRetentionPeriod = successRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#tags SyntheticsCanary#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#tags_all SyntheticsCanary#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#vpc_config SyntheticsCanary#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getZipFile}
         * @param zipFile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#zip_file SyntheticsCanary#zip_file}.
         * @return {@code this}
         */
        public Builder zipFile(java.lang.String zipFile) {
            this.zipFile = zipFile;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getDependsOn}
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
         * Sets the value of {@link SyntheticsCanaryConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryConfig#getProvisioners}
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
         * @return a new instance of {@link SyntheticsCanaryConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SyntheticsCanaryConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SyntheticsCanaryConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SyntheticsCanaryConfig {
        private final java.lang.String artifactS3Location;
        private final java.lang.String executionRoleArn;
        private final java.lang.String handler;
        private final java.lang.String name;
        private final java.lang.String runtimeVersion;
        private final imports.aws.synthetics_canary.SyntheticsCanarySchedule schedule;
        private final imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig artifactConfig;
        private final java.lang.Object deleteLambda;
        private final java.lang.Number failureRetentionPeriod;
        private final java.lang.String id;
        private final imports.aws.synthetics_canary.SyntheticsCanaryRunConfig runConfig;
        private final java.lang.String s3Bucket;
        private final java.lang.String s3Key;
        private final java.lang.String s3Version;
        private final java.lang.Object startCanary;
        private final java.lang.Number successRetentionPeriod;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig vpcConfig;
        private final java.lang.String zipFile;
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
            this.artifactS3Location = software.amazon.jsii.Kernel.get(this, "artifactS3Location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.handler = software.amazon.jsii.Kernel.get(this, "handler", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.runtimeVersion = software.amazon.jsii.Kernel.get(this, "runtimeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schedule = software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanarySchedule.class));
            this.artifactConfig = software.amazon.jsii.Kernel.get(this, "artifactConfig", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig.class));
            this.deleteLambda = software.amazon.jsii.Kernel.get(this, "deleteLambda", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failureRetentionPeriod = software.amazon.jsii.Kernel.get(this, "failureRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.runConfig = software.amazon.jsii.Kernel.get(this, "runConfig", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryRunConfig.class));
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Key = software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Version = software.amazon.jsii.Kernel.get(this, "s3Version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startCanary = software.amazon.jsii.Kernel.get(this, "startCanary", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.successRetentionPeriod = software.amazon.jsii.Kernel.get(this, "successRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig.class));
            this.zipFile = software.amazon.jsii.Kernel.get(this, "zipFile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.artifactS3Location = java.util.Objects.requireNonNull(builder.artifactS3Location, "artifactS3Location is required");
            this.executionRoleArn = java.util.Objects.requireNonNull(builder.executionRoleArn, "executionRoleArn is required");
            this.handler = java.util.Objects.requireNonNull(builder.handler, "handler is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.runtimeVersion = java.util.Objects.requireNonNull(builder.runtimeVersion, "runtimeVersion is required");
            this.schedule = java.util.Objects.requireNonNull(builder.schedule, "schedule is required");
            this.artifactConfig = builder.artifactConfig;
            this.deleteLambda = builder.deleteLambda;
            this.failureRetentionPeriod = builder.failureRetentionPeriod;
            this.id = builder.id;
            this.runConfig = builder.runConfig;
            this.s3Bucket = builder.s3Bucket;
            this.s3Key = builder.s3Key;
            this.s3Version = builder.s3Version;
            this.startCanary = builder.startCanary;
            this.successRetentionPeriod = builder.successRetentionPeriod;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.vpcConfig = builder.vpcConfig;
            this.zipFile = builder.zipFile;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getArtifactS3Location() {
            return this.artifactS3Location;
        }

        @Override
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final java.lang.String getHandler() {
            return this.handler;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRuntimeVersion() {
            return this.runtimeVersion;
        }

        @Override
        public final imports.aws.synthetics_canary.SyntheticsCanarySchedule getSchedule() {
            return this.schedule;
        }

        @Override
        public final imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig getArtifactConfig() {
            return this.artifactConfig;
        }

        @Override
        public final java.lang.Object getDeleteLambda() {
            return this.deleteLambda;
        }

        @Override
        public final java.lang.Number getFailureRetentionPeriod() {
            return this.failureRetentionPeriod;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.synthetics_canary.SyntheticsCanaryRunConfig getRunConfig() {
            return this.runConfig;
        }

        @Override
        public final java.lang.String getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        public final java.lang.String getS3Key() {
            return this.s3Key;
        }

        @Override
        public final java.lang.String getS3Version() {
            return this.s3Version;
        }

        @Override
        public final java.lang.Object getStartCanary() {
            return this.startCanary;
        }

        @Override
        public final java.lang.Number getSuccessRetentionPeriod() {
            return this.successRetentionPeriod;
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
        public final imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig getVpcConfig() {
            return this.vpcConfig;
        }

        @Override
        public final java.lang.String getZipFile() {
            return this.zipFile;
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

            data.set("artifactS3Location", om.valueToTree(this.getArtifactS3Location()));
            data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            data.set("handler", om.valueToTree(this.getHandler()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("runtimeVersion", om.valueToTree(this.getRuntimeVersion()));
            data.set("schedule", om.valueToTree(this.getSchedule()));
            if (this.getArtifactConfig() != null) {
                data.set("artifactConfig", om.valueToTree(this.getArtifactConfig()));
            }
            if (this.getDeleteLambda() != null) {
                data.set("deleteLambda", om.valueToTree(this.getDeleteLambda()));
            }
            if (this.getFailureRetentionPeriod() != null) {
                data.set("failureRetentionPeriod", om.valueToTree(this.getFailureRetentionPeriod()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRunConfig() != null) {
                data.set("runConfig", om.valueToTree(this.getRunConfig()));
            }
            if (this.getS3Bucket() != null) {
                data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            }
            if (this.getS3Key() != null) {
                data.set("s3Key", om.valueToTree(this.getS3Key()));
            }
            if (this.getS3Version() != null) {
                data.set("s3Version", om.valueToTree(this.getS3Version()));
            }
            if (this.getStartCanary() != null) {
                data.set("startCanary", om.valueToTree(this.getStartCanary()));
            }
            if (this.getSuccessRetentionPeriod() != null) {
                data.set("successRetentionPeriod", om.valueToTree(this.getSuccessRetentionPeriod()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getVpcConfig() != null) {
                data.set("vpcConfig", om.valueToTree(this.getVpcConfig()));
            }
            if (this.getZipFile() != null) {
                data.set("zipFile", om.valueToTree(this.getZipFile()));
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
            struct.set("fqn", om.valueToTree("aws.syntheticsCanary.SyntheticsCanaryConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SyntheticsCanaryConfig.Jsii$Proxy that = (SyntheticsCanaryConfig.Jsii$Proxy) o;

            if (!artifactS3Location.equals(that.artifactS3Location)) return false;
            if (!executionRoleArn.equals(that.executionRoleArn)) return false;
            if (!handler.equals(that.handler)) return false;
            if (!name.equals(that.name)) return false;
            if (!runtimeVersion.equals(that.runtimeVersion)) return false;
            if (!schedule.equals(that.schedule)) return false;
            if (this.artifactConfig != null ? !this.artifactConfig.equals(that.artifactConfig) : that.artifactConfig != null) return false;
            if (this.deleteLambda != null ? !this.deleteLambda.equals(that.deleteLambda) : that.deleteLambda != null) return false;
            if (this.failureRetentionPeriod != null ? !this.failureRetentionPeriod.equals(that.failureRetentionPeriod) : that.failureRetentionPeriod != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.runConfig != null ? !this.runConfig.equals(that.runConfig) : that.runConfig != null) return false;
            if (this.s3Bucket != null ? !this.s3Bucket.equals(that.s3Bucket) : that.s3Bucket != null) return false;
            if (this.s3Key != null ? !this.s3Key.equals(that.s3Key) : that.s3Key != null) return false;
            if (this.s3Version != null ? !this.s3Version.equals(that.s3Version) : that.s3Version != null) return false;
            if (this.startCanary != null ? !this.startCanary.equals(that.startCanary) : that.startCanary != null) return false;
            if (this.successRetentionPeriod != null ? !this.successRetentionPeriod.equals(that.successRetentionPeriod) : that.successRetentionPeriod != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.vpcConfig != null ? !this.vpcConfig.equals(that.vpcConfig) : that.vpcConfig != null) return false;
            if (this.zipFile != null ? !this.zipFile.equals(that.zipFile) : that.zipFile != null) return false;
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
            int result = this.artifactS3Location.hashCode();
            result = 31 * result + (this.executionRoleArn.hashCode());
            result = 31 * result + (this.handler.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.runtimeVersion.hashCode());
            result = 31 * result + (this.schedule.hashCode());
            result = 31 * result + (this.artifactConfig != null ? this.artifactConfig.hashCode() : 0);
            result = 31 * result + (this.deleteLambda != null ? this.deleteLambda.hashCode() : 0);
            result = 31 * result + (this.failureRetentionPeriod != null ? this.failureRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.runConfig != null ? this.runConfig.hashCode() : 0);
            result = 31 * result + (this.s3Bucket != null ? this.s3Bucket.hashCode() : 0);
            result = 31 * result + (this.s3Key != null ? this.s3Key.hashCode() : 0);
            result = 31 * result + (this.s3Version != null ? this.s3Version.hashCode() : 0);
            result = 31 * result + (this.startCanary != null ? this.startCanary.hashCode() : 0);
            result = 31 * result + (this.successRetentionPeriod != null ? this.successRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.vpcConfig != null ? this.vpcConfig.hashCode() : 0);
            result = 31 * result + (this.zipFile != null ? this.zipFile.hashCode() : 0);
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
