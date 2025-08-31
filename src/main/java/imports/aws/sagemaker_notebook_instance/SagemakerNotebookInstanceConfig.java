package imports.aws.sagemaker_notebook_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.338Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerNotebookInstance.SagemakerNotebookInstanceConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerNotebookInstanceConfig.Jsii$Proxy.class)
public interface SagemakerNotebookInstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#instance_type SagemakerNotebookInstance#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#name SagemakerNotebookInstance#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#role_arn SagemakerNotebookInstance#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#accelerator_types SagemakerNotebookInstance#accelerator_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#additional_code_repositories SagemakerNotebookInstance#additional_code_repositories}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdditionalCodeRepositories() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#default_code_repository SagemakerNotebookInstance#default_code_repository}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultCodeRepository() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#direct_internet_access SagemakerNotebookInstance#direct_internet_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectInternetAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#id SagemakerNotebookInstance#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * instance_metadata_service_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#instance_metadata_service_configuration SagemakerNotebookInstance#instance_metadata_service_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration getInstanceMetadataServiceConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#kms_key_id SagemakerNotebookInstance#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#lifecycle_config_name SagemakerNotebookInstance#lifecycle_config_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLifecycleConfigName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#platform_identifier SagemakerNotebookInstance#platform_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatformIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#root_access SagemakerNotebookInstance#root_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRootAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#security_groups SagemakerNotebookInstance#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#subnet_id SagemakerNotebookInstance#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#tags SagemakerNotebookInstance#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#tags_all SagemakerNotebookInstance#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#volume_size SagemakerNotebookInstance#volume_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSize() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerNotebookInstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerNotebookInstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerNotebookInstanceConfig> {
        java.lang.String instanceType;
        java.lang.String name;
        java.lang.String roleArn;
        java.util.List<java.lang.String> acceleratorTypes;
        java.util.List<java.lang.String> additionalCodeRepositories;
        java.lang.String defaultCodeRepository;
        java.lang.String directInternetAccess;
        java.lang.String id;
        imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration instanceMetadataServiceConfiguration;
        java.lang.String kmsKeyId;
        java.lang.String lifecycleConfigName;
        java.lang.String platformIdentifier;
        java.lang.String rootAccess;
        java.util.List<java.lang.String> securityGroups;
        java.lang.String subnetId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number volumeSize;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#instance_type SagemakerNotebookInstance#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#name SagemakerNotebookInstance#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#role_arn SagemakerNotebookInstance#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getAcceleratorTypes}
         * @param acceleratorTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#accelerator_types SagemakerNotebookInstance#accelerator_types}.
         * @return {@code this}
         */
        public Builder acceleratorTypes(java.util.List<java.lang.String> acceleratorTypes) {
            this.acceleratorTypes = acceleratorTypes;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getAdditionalCodeRepositories}
         * @param additionalCodeRepositories Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#additional_code_repositories SagemakerNotebookInstance#additional_code_repositories}.
         * @return {@code this}
         */
        public Builder additionalCodeRepositories(java.util.List<java.lang.String> additionalCodeRepositories) {
            this.additionalCodeRepositories = additionalCodeRepositories;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getDefaultCodeRepository}
         * @param defaultCodeRepository Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#default_code_repository SagemakerNotebookInstance#default_code_repository}.
         * @return {@code this}
         */
        public Builder defaultCodeRepository(java.lang.String defaultCodeRepository) {
            this.defaultCodeRepository = defaultCodeRepository;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getDirectInternetAccess}
         * @param directInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#direct_internet_access SagemakerNotebookInstance#direct_internet_access}.
         * @return {@code this}
         */
        public Builder directInternetAccess(java.lang.String directInternetAccess) {
            this.directInternetAccess = directInternetAccess;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#id SagemakerNotebookInstance#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getInstanceMetadataServiceConfiguration}
         * @param instanceMetadataServiceConfiguration instance_metadata_service_configuration block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#instance_metadata_service_configuration SagemakerNotebookInstance#instance_metadata_service_configuration}
         * @return {@code this}
         */
        public Builder instanceMetadataServiceConfiguration(imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration instanceMetadataServiceConfiguration) {
            this.instanceMetadataServiceConfiguration = instanceMetadataServiceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#kms_key_id SagemakerNotebookInstance#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getLifecycleConfigName}
         * @param lifecycleConfigName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#lifecycle_config_name SagemakerNotebookInstance#lifecycle_config_name}.
         * @return {@code this}
         */
        public Builder lifecycleConfigName(java.lang.String lifecycleConfigName) {
            this.lifecycleConfigName = lifecycleConfigName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getPlatformIdentifier}
         * @param platformIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#platform_identifier SagemakerNotebookInstance#platform_identifier}.
         * @return {@code this}
         */
        public Builder platformIdentifier(java.lang.String platformIdentifier) {
            this.platformIdentifier = platformIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getRootAccess}
         * @param rootAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#root_access SagemakerNotebookInstance#root_access}.
         * @return {@code this}
         */
        public Builder rootAccess(java.lang.String rootAccess) {
            this.rootAccess = rootAccess;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#security_groups SagemakerNotebookInstance#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#subnet_id SagemakerNotebookInstance#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#tags SagemakerNotebookInstance#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#tags_all SagemakerNotebookInstance#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getVolumeSize}
         * @param volumeSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#volume_size SagemakerNotebookInstance#volume_size}.
         * @return {@code this}
         */
        public Builder volumeSize(java.lang.Number volumeSize) {
            this.volumeSize = volumeSize;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getDependsOn}
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
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerNotebookInstanceConfig#getProvisioners}
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
         * @return a new instance of {@link SagemakerNotebookInstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerNotebookInstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerNotebookInstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerNotebookInstanceConfig {
        private final java.lang.String instanceType;
        private final java.lang.String name;
        private final java.lang.String roleArn;
        private final java.util.List<java.lang.String> acceleratorTypes;
        private final java.util.List<java.lang.String> additionalCodeRepositories;
        private final java.lang.String defaultCodeRepository;
        private final java.lang.String directInternetAccess;
        private final java.lang.String id;
        private final imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration instanceMetadataServiceConfiguration;
        private final java.lang.String kmsKeyId;
        private final java.lang.String lifecycleConfigName;
        private final java.lang.String platformIdentifier;
        private final java.lang.String rootAccess;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.String subnetId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number volumeSize;
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
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.acceleratorTypes = software.amazon.jsii.Kernel.get(this, "acceleratorTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.additionalCodeRepositories = software.amazon.jsii.Kernel.get(this, "additionalCodeRepositories", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.defaultCodeRepository = software.amazon.jsii.Kernel.get(this, "defaultCodeRepository", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.directInternetAccess = software.amazon.jsii.Kernel.get(this, "directInternetAccess", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceMetadataServiceConfiguration = software.amazon.jsii.Kernel.get(this, "instanceMetadataServiceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lifecycleConfigName = software.amazon.jsii.Kernel.get(this, "lifecycleConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.platformIdentifier = software.amazon.jsii.Kernel.get(this, "platformIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootAccess = software.amazon.jsii.Kernel.get(this, "rootAccess", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.volumeSize = software.amazon.jsii.Kernel.get(this, "volumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.acceleratorTypes = builder.acceleratorTypes;
            this.additionalCodeRepositories = builder.additionalCodeRepositories;
            this.defaultCodeRepository = builder.defaultCodeRepository;
            this.directInternetAccess = builder.directInternetAccess;
            this.id = builder.id;
            this.instanceMetadataServiceConfiguration = builder.instanceMetadataServiceConfiguration;
            this.kmsKeyId = builder.kmsKeyId;
            this.lifecycleConfigName = builder.lifecycleConfigName;
            this.platformIdentifier = builder.platformIdentifier;
            this.rootAccess = builder.rootAccess;
            this.securityGroups = builder.securityGroups;
            this.subnetId = builder.subnetId;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.volumeSize = builder.volumeSize;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.util.List<java.lang.String> getAcceleratorTypes() {
            return this.acceleratorTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getAdditionalCodeRepositories() {
            return this.additionalCodeRepositories;
        }

        @Override
        public final java.lang.String getDefaultCodeRepository() {
            return this.defaultCodeRepository;
        }

        @Override
        public final java.lang.String getDirectInternetAccess() {
            return this.directInternetAccess;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.sagemaker_notebook_instance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration getInstanceMetadataServiceConfiguration() {
            return this.instanceMetadataServiceConfiguration;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getLifecycleConfigName() {
            return this.lifecycleConfigName;
        }

        @Override
        public final java.lang.String getPlatformIdentifier() {
            return this.platformIdentifier;
        }

        @Override
        public final java.lang.String getRootAccess() {
            return this.rootAccess;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
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
        public final java.lang.Number getVolumeSize() {
            return this.volumeSize;
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

            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getAcceleratorTypes() != null) {
                data.set("acceleratorTypes", om.valueToTree(this.getAcceleratorTypes()));
            }
            if (this.getAdditionalCodeRepositories() != null) {
                data.set("additionalCodeRepositories", om.valueToTree(this.getAdditionalCodeRepositories()));
            }
            if (this.getDefaultCodeRepository() != null) {
                data.set("defaultCodeRepository", om.valueToTree(this.getDefaultCodeRepository()));
            }
            if (this.getDirectInternetAccess() != null) {
                data.set("directInternetAccess", om.valueToTree(this.getDirectInternetAccess()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceMetadataServiceConfiguration() != null) {
                data.set("instanceMetadataServiceConfiguration", om.valueToTree(this.getInstanceMetadataServiceConfiguration()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLifecycleConfigName() != null) {
                data.set("lifecycleConfigName", om.valueToTree(this.getLifecycleConfigName()));
            }
            if (this.getPlatformIdentifier() != null) {
                data.set("platformIdentifier", om.valueToTree(this.getPlatformIdentifier()));
            }
            if (this.getRootAccess() != null) {
                data.set("rootAccess", om.valueToTree(this.getRootAccess()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSubnetId() != null) {
                data.set("subnetId", om.valueToTree(this.getSubnetId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getVolumeSize() != null) {
                data.set("volumeSize", om.valueToTree(this.getVolumeSize()));
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
            struct.set("fqn", om.valueToTree("aws.sagemakerNotebookInstance.SagemakerNotebookInstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerNotebookInstanceConfig.Jsii$Proxy that = (SagemakerNotebookInstanceConfig.Jsii$Proxy) o;

            if (!instanceType.equals(that.instanceType)) return false;
            if (!name.equals(that.name)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.acceleratorTypes != null ? !this.acceleratorTypes.equals(that.acceleratorTypes) : that.acceleratorTypes != null) return false;
            if (this.additionalCodeRepositories != null ? !this.additionalCodeRepositories.equals(that.additionalCodeRepositories) : that.additionalCodeRepositories != null) return false;
            if (this.defaultCodeRepository != null ? !this.defaultCodeRepository.equals(that.defaultCodeRepository) : that.defaultCodeRepository != null) return false;
            if (this.directInternetAccess != null ? !this.directInternetAccess.equals(that.directInternetAccess) : that.directInternetAccess != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceMetadataServiceConfiguration != null ? !this.instanceMetadataServiceConfiguration.equals(that.instanceMetadataServiceConfiguration) : that.instanceMetadataServiceConfiguration != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.lifecycleConfigName != null ? !this.lifecycleConfigName.equals(that.lifecycleConfigName) : that.lifecycleConfigName != null) return false;
            if (this.platformIdentifier != null ? !this.platformIdentifier.equals(that.platformIdentifier) : that.platformIdentifier != null) return false;
            if (this.rootAccess != null ? !this.rootAccess.equals(that.rootAccess) : that.rootAccess != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            if (this.subnetId != null ? !this.subnetId.equals(that.subnetId) : that.subnetId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.volumeSize != null ? !this.volumeSize.equals(that.volumeSize) : that.volumeSize != null) return false;
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
            int result = this.instanceType.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.acceleratorTypes != null ? this.acceleratorTypes.hashCode() : 0);
            result = 31 * result + (this.additionalCodeRepositories != null ? this.additionalCodeRepositories.hashCode() : 0);
            result = 31 * result + (this.defaultCodeRepository != null ? this.defaultCodeRepository.hashCode() : 0);
            result = 31 * result + (this.directInternetAccess != null ? this.directInternetAccess.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceMetadataServiceConfiguration != null ? this.instanceMetadataServiceConfiguration.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.lifecycleConfigName != null ? this.lifecycleConfigName.hashCode() : 0);
            result = 31 * result + (this.platformIdentifier != null ? this.platformIdentifier.hashCode() : 0);
            result = 31 * result + (this.rootAccess != null ? this.rootAccess.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.volumeSize != null ? this.volumeSize.hashCode() : 0);
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
