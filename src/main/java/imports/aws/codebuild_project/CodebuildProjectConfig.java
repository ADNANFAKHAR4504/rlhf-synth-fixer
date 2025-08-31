package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.300Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectConfig")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectConfig.Jsii$Proxy.class)
public interface CodebuildProjectConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * artifacts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#artifacts CodebuildProject#artifacts}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectArtifacts getArtifacts();

    /**
     * environment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#environment CodebuildProject#environment}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectEnvironment getEnvironment();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#name CodebuildProject#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#service_role CodebuildProject#service_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceRole();

    /**
     * source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#source CodebuildProject#source}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectSource getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#badge_enabled CodebuildProject#badge_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBadgeEnabled() {
        return null;
    }

    /**
     * build_batch_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#build_batch_config CodebuildProject#build_batch_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig getBuildBatchConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#build_timeout CodebuildProject#build_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBuildTimeout() {
        return null;
    }

    /**
     * cache block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#cache CodebuildProject#cache}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectCache getCache() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#concurrent_build_limit CodebuildProject#concurrent_build_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConcurrentBuildLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#description CodebuildProject#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#encryption_key CodebuildProject#encryption_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionKey() {
        return null;
    }

    /**
     * file_system_locations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#file_system_locations CodebuildProject#file_system_locations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFileSystemLocations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#id CodebuildProject#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * logs_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#logs_config CodebuildProject#logs_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectLogsConfig getLogsConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#project_visibility CodebuildProject#project_visibility}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProjectVisibility() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#queued_timeout CodebuildProject#queued_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getQueuedTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#resource_access_role CodebuildProject#resource_access_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceAccessRole() {
        return null;
    }

    /**
     * secondary_artifacts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_artifacts CodebuildProject#secondary_artifacts}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSecondaryArtifacts() {
        return null;
    }

    /**
     * secondary_sources block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_sources CodebuildProject#secondary_sources}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSecondarySources() {
        return null;
    }

    /**
     * secondary_source_version block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_source_version CodebuildProject#secondary_source_version}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSecondarySourceVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#source_version CodebuildProject#source_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#tags CodebuildProject#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#tags_all CodebuildProject#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#vpc_config CodebuildProject#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectVpcConfig getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectConfig> {
        imports.aws.codebuild_project.CodebuildProjectArtifacts artifacts;
        imports.aws.codebuild_project.CodebuildProjectEnvironment environment;
        java.lang.String name;
        java.lang.String serviceRole;
        imports.aws.codebuild_project.CodebuildProjectSource source;
        java.lang.Object badgeEnabled;
        imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig buildBatchConfig;
        java.lang.Number buildTimeout;
        imports.aws.codebuild_project.CodebuildProjectCache cache;
        java.lang.Number concurrentBuildLimit;
        java.lang.String description;
        java.lang.String encryptionKey;
        java.lang.Object fileSystemLocations;
        java.lang.String id;
        imports.aws.codebuild_project.CodebuildProjectLogsConfig logsConfig;
        java.lang.String projectVisibility;
        java.lang.Number queuedTimeout;
        java.lang.String resourceAccessRole;
        java.lang.Object secondaryArtifacts;
        java.lang.Object secondarySources;
        java.lang.Object secondarySourceVersion;
        java.lang.String sourceVersion;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.codebuild_project.CodebuildProjectVpcConfig vpcConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodebuildProjectConfig#getArtifacts}
         * @param artifacts artifacts block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#artifacts CodebuildProject#artifacts}
         * @return {@code this}
         */
        public Builder artifacts(imports.aws.codebuild_project.CodebuildProjectArtifacts artifacts) {
            this.artifacts = artifacts;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getEnvironment}
         * @param environment environment block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#environment CodebuildProject#environment}
         * @return {@code this}
         */
        public Builder environment(imports.aws.codebuild_project.CodebuildProjectEnvironment environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#name CodebuildProject#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getServiceRole}
         * @param serviceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#service_role CodebuildProject#service_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceRole(java.lang.String serviceRole) {
            this.serviceRole = serviceRole;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getSource}
         * @param source source block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#source CodebuildProject#source}
         * @return {@code this}
         */
        public Builder source(imports.aws.codebuild_project.CodebuildProjectSource source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getBadgeEnabled}
         * @param badgeEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#badge_enabled CodebuildProject#badge_enabled}.
         * @return {@code this}
         */
        public Builder badgeEnabled(java.lang.Boolean badgeEnabled) {
            this.badgeEnabled = badgeEnabled;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getBadgeEnabled}
         * @param badgeEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#badge_enabled CodebuildProject#badge_enabled}.
         * @return {@code this}
         */
        public Builder badgeEnabled(com.hashicorp.cdktf.IResolvable badgeEnabled) {
            this.badgeEnabled = badgeEnabled;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getBuildBatchConfig}
         * @param buildBatchConfig build_batch_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#build_batch_config CodebuildProject#build_batch_config}
         * @return {@code this}
         */
        public Builder buildBatchConfig(imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig buildBatchConfig) {
            this.buildBatchConfig = buildBatchConfig;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getBuildTimeout}
         * @param buildTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#build_timeout CodebuildProject#build_timeout}.
         * @return {@code this}
         */
        public Builder buildTimeout(java.lang.Number buildTimeout) {
            this.buildTimeout = buildTimeout;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getCache}
         * @param cache cache block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#cache CodebuildProject#cache}
         * @return {@code this}
         */
        public Builder cache(imports.aws.codebuild_project.CodebuildProjectCache cache) {
            this.cache = cache;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getConcurrentBuildLimit}
         * @param concurrentBuildLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#concurrent_build_limit CodebuildProject#concurrent_build_limit}.
         * @return {@code this}
         */
        public Builder concurrentBuildLimit(java.lang.Number concurrentBuildLimit) {
            this.concurrentBuildLimit = concurrentBuildLimit;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#description CodebuildProject#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getEncryptionKey}
         * @param encryptionKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#encryption_key CodebuildProject#encryption_key}.
         * @return {@code this}
         */
        public Builder encryptionKey(java.lang.String encryptionKey) {
            this.encryptionKey = encryptionKey;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getFileSystemLocations}
         * @param fileSystemLocations file_system_locations block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#file_system_locations CodebuildProject#file_system_locations}
         * @return {@code this}
         */
        public Builder fileSystemLocations(com.hashicorp.cdktf.IResolvable fileSystemLocations) {
            this.fileSystemLocations = fileSystemLocations;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getFileSystemLocations}
         * @param fileSystemLocations file_system_locations block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#file_system_locations CodebuildProject#file_system_locations}
         * @return {@code this}
         */
        public Builder fileSystemLocations(java.util.List<? extends imports.aws.codebuild_project.CodebuildProjectFileSystemLocations> fileSystemLocations) {
            this.fileSystemLocations = fileSystemLocations;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#id CodebuildProject#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getLogsConfig}
         * @param logsConfig logs_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#logs_config CodebuildProject#logs_config}
         * @return {@code this}
         */
        public Builder logsConfig(imports.aws.codebuild_project.CodebuildProjectLogsConfig logsConfig) {
            this.logsConfig = logsConfig;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getProjectVisibility}
         * @param projectVisibility Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#project_visibility CodebuildProject#project_visibility}.
         * @return {@code this}
         */
        public Builder projectVisibility(java.lang.String projectVisibility) {
            this.projectVisibility = projectVisibility;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getQueuedTimeout}
         * @param queuedTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#queued_timeout CodebuildProject#queued_timeout}.
         * @return {@code this}
         */
        public Builder queuedTimeout(java.lang.Number queuedTimeout) {
            this.queuedTimeout = queuedTimeout;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getResourceAccessRole}
         * @param resourceAccessRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#resource_access_role CodebuildProject#resource_access_role}.
         * @return {@code this}
         */
        public Builder resourceAccessRole(java.lang.String resourceAccessRole) {
            this.resourceAccessRole = resourceAccessRole;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getSecondaryArtifacts}
         * @param secondaryArtifacts secondary_artifacts block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_artifacts CodebuildProject#secondary_artifacts}
         * @return {@code this}
         */
        public Builder secondaryArtifacts(com.hashicorp.cdktf.IResolvable secondaryArtifacts) {
            this.secondaryArtifacts = secondaryArtifacts;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getSecondaryArtifacts}
         * @param secondaryArtifacts secondary_artifacts block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_artifacts CodebuildProject#secondary_artifacts}
         * @return {@code this}
         */
        public Builder secondaryArtifacts(java.util.List<? extends imports.aws.codebuild_project.CodebuildProjectSecondaryArtifacts> secondaryArtifacts) {
            this.secondaryArtifacts = secondaryArtifacts;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getSecondarySources}
         * @param secondarySources secondary_sources block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_sources CodebuildProject#secondary_sources}
         * @return {@code this}
         */
        public Builder secondarySources(com.hashicorp.cdktf.IResolvable secondarySources) {
            this.secondarySources = secondarySources;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getSecondarySources}
         * @param secondarySources secondary_sources block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_sources CodebuildProject#secondary_sources}
         * @return {@code this}
         */
        public Builder secondarySources(java.util.List<? extends imports.aws.codebuild_project.CodebuildProjectSecondarySources> secondarySources) {
            this.secondarySources = secondarySources;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getSecondarySourceVersion}
         * @param secondarySourceVersion secondary_source_version block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_source_version CodebuildProject#secondary_source_version}
         * @return {@code this}
         */
        public Builder secondarySourceVersion(com.hashicorp.cdktf.IResolvable secondarySourceVersion) {
            this.secondarySourceVersion = secondarySourceVersion;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getSecondarySourceVersion}
         * @param secondarySourceVersion secondary_source_version block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#secondary_source_version CodebuildProject#secondary_source_version}
         * @return {@code this}
         */
        public Builder secondarySourceVersion(java.util.List<? extends imports.aws.codebuild_project.CodebuildProjectSecondarySourceVersion> secondarySourceVersion) {
            this.secondarySourceVersion = secondarySourceVersion;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getSourceVersion}
         * @param sourceVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#source_version CodebuildProject#source_version}.
         * @return {@code this}
         */
        public Builder sourceVersion(java.lang.String sourceVersion) {
            this.sourceVersion = sourceVersion;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#tags CodebuildProject#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#tags_all CodebuildProject#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#vpc_config CodebuildProject#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.codebuild_project.CodebuildProjectVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getDependsOn}
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
         * Sets the value of {@link CodebuildProjectConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectConfig#getProvisioners}
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
         * @return a new instance of {@link CodebuildProjectConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectConfig {
        private final imports.aws.codebuild_project.CodebuildProjectArtifacts artifacts;
        private final imports.aws.codebuild_project.CodebuildProjectEnvironment environment;
        private final java.lang.String name;
        private final java.lang.String serviceRole;
        private final imports.aws.codebuild_project.CodebuildProjectSource source;
        private final java.lang.Object badgeEnabled;
        private final imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig buildBatchConfig;
        private final java.lang.Number buildTimeout;
        private final imports.aws.codebuild_project.CodebuildProjectCache cache;
        private final java.lang.Number concurrentBuildLimit;
        private final java.lang.String description;
        private final java.lang.String encryptionKey;
        private final java.lang.Object fileSystemLocations;
        private final java.lang.String id;
        private final imports.aws.codebuild_project.CodebuildProjectLogsConfig logsConfig;
        private final java.lang.String projectVisibility;
        private final java.lang.Number queuedTimeout;
        private final java.lang.String resourceAccessRole;
        private final java.lang.Object secondaryArtifacts;
        private final java.lang.Object secondarySources;
        private final java.lang.Object secondarySourceVersion;
        private final java.lang.String sourceVersion;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.codebuild_project.CodebuildProjectVpcConfig vpcConfig;
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
            this.artifacts = software.amazon.jsii.Kernel.get(this, "artifacts", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectArtifacts.class));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironment.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceRole = software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectSource.class));
            this.badgeEnabled = software.amazon.jsii.Kernel.get(this, "badgeEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.buildBatchConfig = software.amazon.jsii.Kernel.get(this, "buildBatchConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig.class));
            this.buildTimeout = software.amazon.jsii.Kernel.get(this, "buildTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cache = software.amazon.jsii.Kernel.get(this, "cache", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectCache.class));
            this.concurrentBuildLimit = software.amazon.jsii.Kernel.get(this, "concurrentBuildLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionKey = software.amazon.jsii.Kernel.get(this, "encryptionKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileSystemLocations = software.amazon.jsii.Kernel.get(this, "fileSystemLocations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logsConfig = software.amazon.jsii.Kernel.get(this, "logsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectLogsConfig.class));
            this.projectVisibility = software.amazon.jsii.Kernel.get(this, "projectVisibility", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queuedTimeout = software.amazon.jsii.Kernel.get(this, "queuedTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.resourceAccessRole = software.amazon.jsii.Kernel.get(this, "resourceAccessRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secondaryArtifacts = software.amazon.jsii.Kernel.get(this, "secondaryArtifacts", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.secondarySources = software.amazon.jsii.Kernel.get(this, "secondarySources", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.secondarySourceVersion = software.amazon.jsii.Kernel.get(this, "secondarySourceVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceVersion = software.amazon.jsii.Kernel.get(this, "sourceVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectVpcConfig.class));
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
            this.artifacts = java.util.Objects.requireNonNull(builder.artifacts, "artifacts is required");
            this.environment = java.util.Objects.requireNonNull(builder.environment, "environment is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.serviceRole = java.util.Objects.requireNonNull(builder.serviceRole, "serviceRole is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.badgeEnabled = builder.badgeEnabled;
            this.buildBatchConfig = builder.buildBatchConfig;
            this.buildTimeout = builder.buildTimeout;
            this.cache = builder.cache;
            this.concurrentBuildLimit = builder.concurrentBuildLimit;
            this.description = builder.description;
            this.encryptionKey = builder.encryptionKey;
            this.fileSystemLocations = builder.fileSystemLocations;
            this.id = builder.id;
            this.logsConfig = builder.logsConfig;
            this.projectVisibility = builder.projectVisibility;
            this.queuedTimeout = builder.queuedTimeout;
            this.resourceAccessRole = builder.resourceAccessRole;
            this.secondaryArtifacts = builder.secondaryArtifacts;
            this.secondarySources = builder.secondarySources;
            this.secondarySourceVersion = builder.secondarySourceVersion;
            this.sourceVersion = builder.sourceVersion;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.vpcConfig = builder.vpcConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectArtifacts getArtifacts() {
            return this.artifacts;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectEnvironment getEnvironment() {
            return this.environment;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getServiceRole() {
            return this.serviceRole;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectSource getSource() {
            return this.source;
        }

        @Override
        public final java.lang.Object getBadgeEnabled() {
            return this.badgeEnabled;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectBuildBatchConfig getBuildBatchConfig() {
            return this.buildBatchConfig;
        }

        @Override
        public final java.lang.Number getBuildTimeout() {
            return this.buildTimeout;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectCache getCache() {
            return this.cache;
        }

        @Override
        public final java.lang.Number getConcurrentBuildLimit() {
            return this.concurrentBuildLimit;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getEncryptionKey() {
            return this.encryptionKey;
        }

        @Override
        public final java.lang.Object getFileSystemLocations() {
            return this.fileSystemLocations;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectLogsConfig getLogsConfig() {
            return this.logsConfig;
        }

        @Override
        public final java.lang.String getProjectVisibility() {
            return this.projectVisibility;
        }

        @Override
        public final java.lang.Number getQueuedTimeout() {
            return this.queuedTimeout;
        }

        @Override
        public final java.lang.String getResourceAccessRole() {
            return this.resourceAccessRole;
        }

        @Override
        public final java.lang.Object getSecondaryArtifacts() {
            return this.secondaryArtifacts;
        }

        @Override
        public final java.lang.Object getSecondarySources() {
            return this.secondarySources;
        }

        @Override
        public final java.lang.Object getSecondarySourceVersion() {
            return this.secondarySourceVersion;
        }

        @Override
        public final java.lang.String getSourceVersion() {
            return this.sourceVersion;
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
        public final imports.aws.codebuild_project.CodebuildProjectVpcConfig getVpcConfig() {
            return this.vpcConfig;
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

            data.set("artifacts", om.valueToTree(this.getArtifacts()));
            data.set("environment", om.valueToTree(this.getEnvironment()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("serviceRole", om.valueToTree(this.getServiceRole()));
            data.set("source", om.valueToTree(this.getSource()));
            if (this.getBadgeEnabled() != null) {
                data.set("badgeEnabled", om.valueToTree(this.getBadgeEnabled()));
            }
            if (this.getBuildBatchConfig() != null) {
                data.set("buildBatchConfig", om.valueToTree(this.getBuildBatchConfig()));
            }
            if (this.getBuildTimeout() != null) {
                data.set("buildTimeout", om.valueToTree(this.getBuildTimeout()));
            }
            if (this.getCache() != null) {
                data.set("cache", om.valueToTree(this.getCache()));
            }
            if (this.getConcurrentBuildLimit() != null) {
                data.set("concurrentBuildLimit", om.valueToTree(this.getConcurrentBuildLimit()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEncryptionKey() != null) {
                data.set("encryptionKey", om.valueToTree(this.getEncryptionKey()));
            }
            if (this.getFileSystemLocations() != null) {
                data.set("fileSystemLocations", om.valueToTree(this.getFileSystemLocations()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLogsConfig() != null) {
                data.set("logsConfig", om.valueToTree(this.getLogsConfig()));
            }
            if (this.getProjectVisibility() != null) {
                data.set("projectVisibility", om.valueToTree(this.getProjectVisibility()));
            }
            if (this.getQueuedTimeout() != null) {
                data.set("queuedTimeout", om.valueToTree(this.getQueuedTimeout()));
            }
            if (this.getResourceAccessRole() != null) {
                data.set("resourceAccessRole", om.valueToTree(this.getResourceAccessRole()));
            }
            if (this.getSecondaryArtifacts() != null) {
                data.set("secondaryArtifacts", om.valueToTree(this.getSecondaryArtifacts()));
            }
            if (this.getSecondarySources() != null) {
                data.set("secondarySources", om.valueToTree(this.getSecondarySources()));
            }
            if (this.getSecondarySourceVersion() != null) {
                data.set("secondarySourceVersion", om.valueToTree(this.getSecondarySourceVersion()));
            }
            if (this.getSourceVersion() != null) {
                data.set("sourceVersion", om.valueToTree(this.getSourceVersion()));
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
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectConfig.Jsii$Proxy that = (CodebuildProjectConfig.Jsii$Proxy) o;

            if (!artifacts.equals(that.artifacts)) return false;
            if (!environment.equals(that.environment)) return false;
            if (!name.equals(that.name)) return false;
            if (!serviceRole.equals(that.serviceRole)) return false;
            if (!source.equals(that.source)) return false;
            if (this.badgeEnabled != null ? !this.badgeEnabled.equals(that.badgeEnabled) : that.badgeEnabled != null) return false;
            if (this.buildBatchConfig != null ? !this.buildBatchConfig.equals(that.buildBatchConfig) : that.buildBatchConfig != null) return false;
            if (this.buildTimeout != null ? !this.buildTimeout.equals(that.buildTimeout) : that.buildTimeout != null) return false;
            if (this.cache != null ? !this.cache.equals(that.cache) : that.cache != null) return false;
            if (this.concurrentBuildLimit != null ? !this.concurrentBuildLimit.equals(that.concurrentBuildLimit) : that.concurrentBuildLimit != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.encryptionKey != null ? !this.encryptionKey.equals(that.encryptionKey) : that.encryptionKey != null) return false;
            if (this.fileSystemLocations != null ? !this.fileSystemLocations.equals(that.fileSystemLocations) : that.fileSystemLocations != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.logsConfig != null ? !this.logsConfig.equals(that.logsConfig) : that.logsConfig != null) return false;
            if (this.projectVisibility != null ? !this.projectVisibility.equals(that.projectVisibility) : that.projectVisibility != null) return false;
            if (this.queuedTimeout != null ? !this.queuedTimeout.equals(that.queuedTimeout) : that.queuedTimeout != null) return false;
            if (this.resourceAccessRole != null ? !this.resourceAccessRole.equals(that.resourceAccessRole) : that.resourceAccessRole != null) return false;
            if (this.secondaryArtifacts != null ? !this.secondaryArtifacts.equals(that.secondaryArtifacts) : that.secondaryArtifacts != null) return false;
            if (this.secondarySources != null ? !this.secondarySources.equals(that.secondarySources) : that.secondarySources != null) return false;
            if (this.secondarySourceVersion != null ? !this.secondarySourceVersion.equals(that.secondarySourceVersion) : that.secondarySourceVersion != null) return false;
            if (this.sourceVersion != null ? !this.sourceVersion.equals(that.sourceVersion) : that.sourceVersion != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.vpcConfig != null ? !this.vpcConfig.equals(that.vpcConfig) : that.vpcConfig != null) return false;
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
            int result = this.artifacts.hashCode();
            result = 31 * result + (this.environment.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.serviceRole.hashCode());
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.badgeEnabled != null ? this.badgeEnabled.hashCode() : 0);
            result = 31 * result + (this.buildBatchConfig != null ? this.buildBatchConfig.hashCode() : 0);
            result = 31 * result + (this.buildTimeout != null ? this.buildTimeout.hashCode() : 0);
            result = 31 * result + (this.cache != null ? this.cache.hashCode() : 0);
            result = 31 * result + (this.concurrentBuildLimit != null ? this.concurrentBuildLimit.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.encryptionKey != null ? this.encryptionKey.hashCode() : 0);
            result = 31 * result + (this.fileSystemLocations != null ? this.fileSystemLocations.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.logsConfig != null ? this.logsConfig.hashCode() : 0);
            result = 31 * result + (this.projectVisibility != null ? this.projectVisibility.hashCode() : 0);
            result = 31 * result + (this.queuedTimeout != null ? this.queuedTimeout.hashCode() : 0);
            result = 31 * result + (this.resourceAccessRole != null ? this.resourceAccessRole.hashCode() : 0);
            result = 31 * result + (this.secondaryArtifacts != null ? this.secondaryArtifacts.hashCode() : 0);
            result = 31 * result + (this.secondarySources != null ? this.secondarySources.hashCode() : 0);
            result = 31 * result + (this.secondarySourceVersion != null ? this.secondarySourceVersion.hashCode() : 0);
            result = 31 * result + (this.sourceVersion != null ? this.sourceVersion.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.vpcConfig != null ? this.vpcConfig.hashCode() : 0);
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
