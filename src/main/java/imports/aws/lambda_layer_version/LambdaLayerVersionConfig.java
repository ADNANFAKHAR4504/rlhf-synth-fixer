package imports.aws.lambda_layer_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.511Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaLayerVersion.LambdaLayerVersionConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaLayerVersionConfig.Jsii$Proxy.class)
public interface LambdaLayerVersionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#layer_name LambdaLayerVersion#layer_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLayerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#compatible_architectures LambdaLayerVersion#compatible_architectures}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCompatibleArchitectures() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#compatible_runtimes LambdaLayerVersion#compatible_runtimes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCompatibleRuntimes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#description LambdaLayerVersion#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#filename LambdaLayerVersion#filename}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFilename() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#id LambdaLayerVersion#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#license_info LambdaLayerVersion#license_info}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLicenseInfo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#s3_bucket LambdaLayerVersion#s3_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Bucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#s3_key LambdaLayerVersion#s3_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Key() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#s3_object_version LambdaLayerVersion#s3_object_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#skip_destroy LambdaLayerVersion#skip_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipDestroy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#source_code_hash LambdaLayerVersion#source_code_hash}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceCodeHash() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaLayerVersionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaLayerVersionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaLayerVersionConfig> {
        java.lang.String layerName;
        java.util.List<java.lang.String> compatibleArchitectures;
        java.util.List<java.lang.String> compatibleRuntimes;
        java.lang.String description;
        java.lang.String filename;
        java.lang.String id;
        java.lang.String licenseInfo;
        java.lang.String s3Bucket;
        java.lang.String s3Key;
        java.lang.String s3ObjectVersion;
        java.lang.Object skipDestroy;
        java.lang.String sourceCodeHash;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getLayerName}
         * @param layerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#layer_name LambdaLayerVersion#layer_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder layerName(java.lang.String layerName) {
            this.layerName = layerName;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getCompatibleArchitectures}
         * @param compatibleArchitectures Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#compatible_architectures LambdaLayerVersion#compatible_architectures}.
         * @return {@code this}
         */
        public Builder compatibleArchitectures(java.util.List<java.lang.String> compatibleArchitectures) {
            this.compatibleArchitectures = compatibleArchitectures;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getCompatibleRuntimes}
         * @param compatibleRuntimes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#compatible_runtimes LambdaLayerVersion#compatible_runtimes}.
         * @return {@code this}
         */
        public Builder compatibleRuntimes(java.util.List<java.lang.String> compatibleRuntimes) {
            this.compatibleRuntimes = compatibleRuntimes;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#description LambdaLayerVersion#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getFilename}
         * @param filename Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#filename LambdaLayerVersion#filename}.
         * @return {@code this}
         */
        public Builder filename(java.lang.String filename) {
            this.filename = filename;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#id LambdaLayerVersion#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getLicenseInfo}
         * @param licenseInfo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#license_info LambdaLayerVersion#license_info}.
         * @return {@code this}
         */
        public Builder licenseInfo(java.lang.String licenseInfo) {
            this.licenseInfo = licenseInfo;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#s3_bucket LambdaLayerVersion#s3_bucket}.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getS3Key}
         * @param s3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#s3_key LambdaLayerVersion#s3_key}.
         * @return {@code this}
         */
        public Builder s3Key(java.lang.String s3Key) {
            this.s3Key = s3Key;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getS3ObjectVersion}
         * @param s3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#s3_object_version LambdaLayerVersion#s3_object_version}.
         * @return {@code this}
         */
        public Builder s3ObjectVersion(java.lang.String s3ObjectVersion) {
            this.s3ObjectVersion = s3ObjectVersion;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getSkipDestroy}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#skip_destroy LambdaLayerVersion#skip_destroy}.
         * @return {@code this}
         */
        public Builder skipDestroy(java.lang.Boolean skipDestroy) {
            this.skipDestroy = skipDestroy;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getSkipDestroy}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#skip_destroy LambdaLayerVersion#skip_destroy}.
         * @return {@code this}
         */
        public Builder skipDestroy(com.hashicorp.cdktf.IResolvable skipDestroy) {
            this.skipDestroy = skipDestroy;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getSourceCodeHash}
         * @param sourceCodeHash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version#source_code_hash LambdaLayerVersion#source_code_hash}.
         * @return {@code this}
         */
        public Builder sourceCodeHash(java.lang.String sourceCodeHash) {
            this.sourceCodeHash = sourceCodeHash;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getDependsOn}
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
         * Sets the value of {@link LambdaLayerVersionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LambdaLayerVersionConfig#getProvisioners}
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
         * @return a new instance of {@link LambdaLayerVersionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaLayerVersionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaLayerVersionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaLayerVersionConfig {
        private final java.lang.String layerName;
        private final java.util.List<java.lang.String> compatibleArchitectures;
        private final java.util.List<java.lang.String> compatibleRuntimes;
        private final java.lang.String description;
        private final java.lang.String filename;
        private final java.lang.String id;
        private final java.lang.String licenseInfo;
        private final java.lang.String s3Bucket;
        private final java.lang.String s3Key;
        private final java.lang.String s3ObjectVersion;
        private final java.lang.Object skipDestroy;
        private final java.lang.String sourceCodeHash;
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
            this.layerName = software.amazon.jsii.Kernel.get(this, "layerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.compatibleArchitectures = software.amazon.jsii.Kernel.get(this, "compatibleArchitectures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.compatibleRuntimes = software.amazon.jsii.Kernel.get(this, "compatibleRuntimes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filename = software.amazon.jsii.Kernel.get(this, "filename", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.licenseInfo = software.amazon.jsii.Kernel.get(this, "licenseInfo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Key = software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3ObjectVersion = software.amazon.jsii.Kernel.get(this, "s3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.skipDestroy = software.amazon.jsii.Kernel.get(this, "skipDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceCodeHash = software.amazon.jsii.Kernel.get(this, "sourceCodeHash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.layerName = java.util.Objects.requireNonNull(builder.layerName, "layerName is required");
            this.compatibleArchitectures = builder.compatibleArchitectures;
            this.compatibleRuntimes = builder.compatibleRuntimes;
            this.description = builder.description;
            this.filename = builder.filename;
            this.id = builder.id;
            this.licenseInfo = builder.licenseInfo;
            this.s3Bucket = builder.s3Bucket;
            this.s3Key = builder.s3Key;
            this.s3ObjectVersion = builder.s3ObjectVersion;
            this.skipDestroy = builder.skipDestroy;
            this.sourceCodeHash = builder.sourceCodeHash;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getLayerName() {
            return this.layerName;
        }

        @Override
        public final java.util.List<java.lang.String> getCompatibleArchitectures() {
            return this.compatibleArchitectures;
        }

        @Override
        public final java.util.List<java.lang.String> getCompatibleRuntimes() {
            return this.compatibleRuntimes;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getFilename() {
            return this.filename;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLicenseInfo() {
            return this.licenseInfo;
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
        public final java.lang.String getS3ObjectVersion() {
            return this.s3ObjectVersion;
        }

        @Override
        public final java.lang.Object getSkipDestroy() {
            return this.skipDestroy;
        }

        @Override
        public final java.lang.String getSourceCodeHash() {
            return this.sourceCodeHash;
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

            data.set("layerName", om.valueToTree(this.getLayerName()));
            if (this.getCompatibleArchitectures() != null) {
                data.set("compatibleArchitectures", om.valueToTree(this.getCompatibleArchitectures()));
            }
            if (this.getCompatibleRuntimes() != null) {
                data.set("compatibleRuntimes", om.valueToTree(this.getCompatibleRuntimes()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getFilename() != null) {
                data.set("filename", om.valueToTree(this.getFilename()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLicenseInfo() != null) {
                data.set("licenseInfo", om.valueToTree(this.getLicenseInfo()));
            }
            if (this.getS3Bucket() != null) {
                data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            }
            if (this.getS3Key() != null) {
                data.set("s3Key", om.valueToTree(this.getS3Key()));
            }
            if (this.getS3ObjectVersion() != null) {
                data.set("s3ObjectVersion", om.valueToTree(this.getS3ObjectVersion()));
            }
            if (this.getSkipDestroy() != null) {
                data.set("skipDestroy", om.valueToTree(this.getSkipDestroy()));
            }
            if (this.getSourceCodeHash() != null) {
                data.set("sourceCodeHash", om.valueToTree(this.getSourceCodeHash()));
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
            struct.set("fqn", om.valueToTree("aws.lambdaLayerVersion.LambdaLayerVersionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaLayerVersionConfig.Jsii$Proxy that = (LambdaLayerVersionConfig.Jsii$Proxy) o;

            if (!layerName.equals(that.layerName)) return false;
            if (this.compatibleArchitectures != null ? !this.compatibleArchitectures.equals(that.compatibleArchitectures) : that.compatibleArchitectures != null) return false;
            if (this.compatibleRuntimes != null ? !this.compatibleRuntimes.equals(that.compatibleRuntimes) : that.compatibleRuntimes != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.filename != null ? !this.filename.equals(that.filename) : that.filename != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.licenseInfo != null ? !this.licenseInfo.equals(that.licenseInfo) : that.licenseInfo != null) return false;
            if (this.s3Bucket != null ? !this.s3Bucket.equals(that.s3Bucket) : that.s3Bucket != null) return false;
            if (this.s3Key != null ? !this.s3Key.equals(that.s3Key) : that.s3Key != null) return false;
            if (this.s3ObjectVersion != null ? !this.s3ObjectVersion.equals(that.s3ObjectVersion) : that.s3ObjectVersion != null) return false;
            if (this.skipDestroy != null ? !this.skipDestroy.equals(that.skipDestroy) : that.skipDestroy != null) return false;
            if (this.sourceCodeHash != null ? !this.sourceCodeHash.equals(that.sourceCodeHash) : that.sourceCodeHash != null) return false;
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
            int result = this.layerName.hashCode();
            result = 31 * result + (this.compatibleArchitectures != null ? this.compatibleArchitectures.hashCode() : 0);
            result = 31 * result + (this.compatibleRuntimes != null ? this.compatibleRuntimes.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.filename != null ? this.filename.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.licenseInfo != null ? this.licenseInfo.hashCode() : 0);
            result = 31 * result + (this.s3Bucket != null ? this.s3Bucket.hashCode() : 0);
            result = 31 * result + (this.s3Key != null ? this.s3Key.hashCode() : 0);
            result = 31 * result + (this.s3ObjectVersion != null ? this.s3ObjectVersion.hashCode() : 0);
            result = 31 * result + (this.skipDestroy != null ? this.skipDestroy.hashCode() : 0);
            result = 31 * result + (this.sourceCodeHash != null ? this.sourceCodeHash.hashCode() : 0);
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
