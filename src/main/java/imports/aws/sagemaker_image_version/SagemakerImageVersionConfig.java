package imports.aws.sagemaker_image_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerImageVersion.SagemakerImageVersionConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerImageVersionConfig.Jsii$Proxy.class)
public interface SagemakerImageVersionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#base_image SagemakerImageVersion#base_image}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBaseImage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#image_name SagemakerImageVersion#image_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImageName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#horovod SagemakerImageVersion#horovod}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHorovod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#id SagemakerImageVersion#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#job_type SagemakerImageVersion#job_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getJobType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#ml_framework SagemakerImageVersion#ml_framework}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMlFramework() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#processor SagemakerImageVersion#processor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProcessor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#programming_lang SagemakerImageVersion#programming_lang}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProgrammingLang() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#release_notes SagemakerImageVersion#release_notes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReleaseNotes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#vendor_guidance SagemakerImageVersion#vendor_guidance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVendorGuidance() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerImageVersionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerImageVersionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerImageVersionConfig> {
        java.lang.String baseImage;
        java.lang.String imageName;
        java.lang.Object horovod;
        java.lang.String id;
        java.lang.String jobType;
        java.lang.String mlFramework;
        java.lang.String processor;
        java.lang.String programmingLang;
        java.lang.String releaseNotes;
        java.lang.String vendorGuidance;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getBaseImage}
         * @param baseImage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#base_image SagemakerImageVersion#base_image}. This parameter is required.
         * @return {@code this}
         */
        public Builder baseImage(java.lang.String baseImage) {
            this.baseImage = baseImage;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getImageName}
         * @param imageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#image_name SagemakerImageVersion#image_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder imageName(java.lang.String imageName) {
            this.imageName = imageName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getHorovod}
         * @param horovod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#horovod SagemakerImageVersion#horovod}.
         * @return {@code this}
         */
        public Builder horovod(java.lang.Boolean horovod) {
            this.horovod = horovod;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getHorovod}
         * @param horovod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#horovod SagemakerImageVersion#horovod}.
         * @return {@code this}
         */
        public Builder horovod(com.hashicorp.cdktf.IResolvable horovod) {
            this.horovod = horovod;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#id SagemakerImageVersion#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getJobType}
         * @param jobType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#job_type SagemakerImageVersion#job_type}.
         * @return {@code this}
         */
        public Builder jobType(java.lang.String jobType) {
            this.jobType = jobType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getMlFramework}
         * @param mlFramework Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#ml_framework SagemakerImageVersion#ml_framework}.
         * @return {@code this}
         */
        public Builder mlFramework(java.lang.String mlFramework) {
            this.mlFramework = mlFramework;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getProcessor}
         * @param processor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#processor SagemakerImageVersion#processor}.
         * @return {@code this}
         */
        public Builder processor(java.lang.String processor) {
            this.processor = processor;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getProgrammingLang}
         * @param programmingLang Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#programming_lang SagemakerImageVersion#programming_lang}.
         * @return {@code this}
         */
        public Builder programmingLang(java.lang.String programmingLang) {
            this.programmingLang = programmingLang;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getReleaseNotes}
         * @param releaseNotes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#release_notes SagemakerImageVersion#release_notes}.
         * @return {@code this}
         */
        public Builder releaseNotes(java.lang.String releaseNotes) {
            this.releaseNotes = releaseNotes;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getVendorGuidance}
         * @param vendorGuidance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_image_version#vendor_guidance SagemakerImageVersion#vendor_guidance}.
         * @return {@code this}
         */
        public Builder vendorGuidance(java.lang.String vendorGuidance) {
            this.vendorGuidance = vendorGuidance;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getDependsOn}
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
         * Sets the value of {@link SagemakerImageVersionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerImageVersionConfig#getProvisioners}
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
         * @return a new instance of {@link SagemakerImageVersionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerImageVersionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerImageVersionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerImageVersionConfig {
        private final java.lang.String baseImage;
        private final java.lang.String imageName;
        private final java.lang.Object horovod;
        private final java.lang.String id;
        private final java.lang.String jobType;
        private final java.lang.String mlFramework;
        private final java.lang.String processor;
        private final java.lang.String programmingLang;
        private final java.lang.String releaseNotes;
        private final java.lang.String vendorGuidance;
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
            this.baseImage = software.amazon.jsii.Kernel.get(this, "baseImage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageName = software.amazon.jsii.Kernel.get(this, "imageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.horovod = software.amazon.jsii.Kernel.get(this, "horovod", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jobType = software.amazon.jsii.Kernel.get(this, "jobType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mlFramework = software.amazon.jsii.Kernel.get(this, "mlFramework", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.processor = software.amazon.jsii.Kernel.get(this, "processor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.programmingLang = software.amazon.jsii.Kernel.get(this, "programmingLang", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.releaseNotes = software.amazon.jsii.Kernel.get(this, "releaseNotes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vendorGuidance = software.amazon.jsii.Kernel.get(this, "vendorGuidance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.baseImage = java.util.Objects.requireNonNull(builder.baseImage, "baseImage is required");
            this.imageName = java.util.Objects.requireNonNull(builder.imageName, "imageName is required");
            this.horovod = builder.horovod;
            this.id = builder.id;
            this.jobType = builder.jobType;
            this.mlFramework = builder.mlFramework;
            this.processor = builder.processor;
            this.programmingLang = builder.programmingLang;
            this.releaseNotes = builder.releaseNotes;
            this.vendorGuidance = builder.vendorGuidance;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBaseImage() {
            return this.baseImage;
        }

        @Override
        public final java.lang.String getImageName() {
            return this.imageName;
        }

        @Override
        public final java.lang.Object getHorovod() {
            return this.horovod;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getJobType() {
            return this.jobType;
        }

        @Override
        public final java.lang.String getMlFramework() {
            return this.mlFramework;
        }

        @Override
        public final java.lang.String getProcessor() {
            return this.processor;
        }

        @Override
        public final java.lang.String getProgrammingLang() {
            return this.programmingLang;
        }

        @Override
        public final java.lang.String getReleaseNotes() {
            return this.releaseNotes;
        }

        @Override
        public final java.lang.String getVendorGuidance() {
            return this.vendorGuidance;
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

            data.set("baseImage", om.valueToTree(this.getBaseImage()));
            data.set("imageName", om.valueToTree(this.getImageName()));
            if (this.getHorovod() != null) {
                data.set("horovod", om.valueToTree(this.getHorovod()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getJobType() != null) {
                data.set("jobType", om.valueToTree(this.getJobType()));
            }
            if (this.getMlFramework() != null) {
                data.set("mlFramework", om.valueToTree(this.getMlFramework()));
            }
            if (this.getProcessor() != null) {
                data.set("processor", om.valueToTree(this.getProcessor()));
            }
            if (this.getProgrammingLang() != null) {
                data.set("programmingLang", om.valueToTree(this.getProgrammingLang()));
            }
            if (this.getReleaseNotes() != null) {
                data.set("releaseNotes", om.valueToTree(this.getReleaseNotes()));
            }
            if (this.getVendorGuidance() != null) {
                data.set("vendorGuidance", om.valueToTree(this.getVendorGuidance()));
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
            struct.set("fqn", om.valueToTree("aws.sagemakerImageVersion.SagemakerImageVersionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerImageVersionConfig.Jsii$Proxy that = (SagemakerImageVersionConfig.Jsii$Proxy) o;

            if (!baseImage.equals(that.baseImage)) return false;
            if (!imageName.equals(that.imageName)) return false;
            if (this.horovod != null ? !this.horovod.equals(that.horovod) : that.horovod != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.jobType != null ? !this.jobType.equals(that.jobType) : that.jobType != null) return false;
            if (this.mlFramework != null ? !this.mlFramework.equals(that.mlFramework) : that.mlFramework != null) return false;
            if (this.processor != null ? !this.processor.equals(that.processor) : that.processor != null) return false;
            if (this.programmingLang != null ? !this.programmingLang.equals(that.programmingLang) : that.programmingLang != null) return false;
            if (this.releaseNotes != null ? !this.releaseNotes.equals(that.releaseNotes) : that.releaseNotes != null) return false;
            if (this.vendorGuidance != null ? !this.vendorGuidance.equals(that.vendorGuidance) : that.vendorGuidance != null) return false;
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
            int result = this.baseImage.hashCode();
            result = 31 * result + (this.imageName.hashCode());
            result = 31 * result + (this.horovod != null ? this.horovod.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.jobType != null ? this.jobType.hashCode() : 0);
            result = 31 * result + (this.mlFramework != null ? this.mlFramework.hashCode() : 0);
            result = 31 * result + (this.processor != null ? this.processor.hashCode() : 0);
            result = 31 * result + (this.programmingLang != null ? this.programmingLang.hashCode() : 0);
            result = 31 * result + (this.releaseNotes != null ? this.releaseNotes.hashCode() : 0);
            result = 31 * result + (this.vendorGuidance != null ? this.vendorGuidance.hashCode() : 0);
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
