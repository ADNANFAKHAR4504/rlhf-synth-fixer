package imports.aws.datasync_location_efs;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.944Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationEfs.DatasyncLocationEfsConfig")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationEfsConfig.Jsii$Proxy.class)
public interface DatasyncLocationEfsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * ec2_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#ec2_config DatasyncLocationEfs#ec2_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config getEc2Config();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#efs_file_system_arn DatasyncLocationEfs#efs_file_system_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEfsFileSystemArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#access_point_arn DatasyncLocationEfs#access_point_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessPointArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#file_system_access_role_arn DatasyncLocationEfs#file_system_access_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileSystemAccessRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#id DatasyncLocationEfs#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#in_transit_encryption DatasyncLocationEfs#in_transit_encryption}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInTransitEncryption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#subdirectory DatasyncLocationEfs#subdirectory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubdirectory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#tags DatasyncLocationEfs#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#tags_all DatasyncLocationEfs#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncLocationEfsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationEfsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationEfsConfig> {
        imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config ec2Config;
        java.lang.String efsFileSystemArn;
        java.lang.String accessPointArn;
        java.lang.String fileSystemAccessRoleArn;
        java.lang.String id;
        java.lang.String inTransitEncryption;
        java.lang.String subdirectory;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getEc2Config}
         * @param ec2Config ec2_config block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#ec2_config DatasyncLocationEfs#ec2_config}
         * @return {@code this}
         */
        public Builder ec2Config(imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config ec2Config) {
            this.ec2Config = ec2Config;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getEfsFileSystemArn}
         * @param efsFileSystemArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#efs_file_system_arn DatasyncLocationEfs#efs_file_system_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder efsFileSystemArn(java.lang.String efsFileSystemArn) {
            this.efsFileSystemArn = efsFileSystemArn;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getAccessPointArn}
         * @param accessPointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#access_point_arn DatasyncLocationEfs#access_point_arn}.
         * @return {@code this}
         */
        public Builder accessPointArn(java.lang.String accessPointArn) {
            this.accessPointArn = accessPointArn;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getFileSystemAccessRoleArn}
         * @param fileSystemAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#file_system_access_role_arn DatasyncLocationEfs#file_system_access_role_arn}.
         * @return {@code this}
         */
        public Builder fileSystemAccessRoleArn(java.lang.String fileSystemAccessRoleArn) {
            this.fileSystemAccessRoleArn = fileSystemAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#id DatasyncLocationEfs#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getInTransitEncryption}
         * @param inTransitEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#in_transit_encryption DatasyncLocationEfs#in_transit_encryption}.
         * @return {@code this}
         */
        public Builder inTransitEncryption(java.lang.String inTransitEncryption) {
            this.inTransitEncryption = inTransitEncryption;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getSubdirectory}
         * @param subdirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#subdirectory DatasyncLocationEfs#subdirectory}.
         * @return {@code this}
         */
        public Builder subdirectory(java.lang.String subdirectory) {
            this.subdirectory = subdirectory;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#tags DatasyncLocationEfs#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_efs#tags_all DatasyncLocationEfs#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getDependsOn}
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
         * Sets the value of {@link DatasyncLocationEfsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationEfsConfig#getProvisioners}
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
         * @return a new instance of {@link DatasyncLocationEfsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationEfsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationEfsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationEfsConfig {
        private final imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config ec2Config;
        private final java.lang.String efsFileSystemArn;
        private final java.lang.String accessPointArn;
        private final java.lang.String fileSystemAccessRoleArn;
        private final java.lang.String id;
        private final java.lang.String inTransitEncryption;
        private final java.lang.String subdirectory;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.ec2Config = software.amazon.jsii.Kernel.get(this, "ec2Config", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config.class));
            this.efsFileSystemArn = software.amazon.jsii.Kernel.get(this, "efsFileSystemArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessPointArn = software.amazon.jsii.Kernel.get(this, "accessPointArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileSystemAccessRoleArn = software.amazon.jsii.Kernel.get(this, "fileSystemAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inTransitEncryption = software.amazon.jsii.Kernel.get(this, "inTransitEncryption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subdirectory = software.amazon.jsii.Kernel.get(this, "subdirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.ec2Config = java.util.Objects.requireNonNull(builder.ec2Config, "ec2Config is required");
            this.efsFileSystemArn = java.util.Objects.requireNonNull(builder.efsFileSystemArn, "efsFileSystemArn is required");
            this.accessPointArn = builder.accessPointArn;
            this.fileSystemAccessRoleArn = builder.fileSystemAccessRoleArn;
            this.id = builder.id;
            this.inTransitEncryption = builder.inTransitEncryption;
            this.subdirectory = builder.subdirectory;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.datasync_location_efs.DatasyncLocationEfsEc2Config getEc2Config() {
            return this.ec2Config;
        }

        @Override
        public final java.lang.String getEfsFileSystemArn() {
            return this.efsFileSystemArn;
        }

        @Override
        public final java.lang.String getAccessPointArn() {
            return this.accessPointArn;
        }

        @Override
        public final java.lang.String getFileSystemAccessRoleArn() {
            return this.fileSystemAccessRoleArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInTransitEncryption() {
            return this.inTransitEncryption;
        }

        @Override
        public final java.lang.String getSubdirectory() {
            return this.subdirectory;
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

            data.set("ec2Config", om.valueToTree(this.getEc2Config()));
            data.set("efsFileSystemArn", om.valueToTree(this.getEfsFileSystemArn()));
            if (this.getAccessPointArn() != null) {
                data.set("accessPointArn", om.valueToTree(this.getAccessPointArn()));
            }
            if (this.getFileSystemAccessRoleArn() != null) {
                data.set("fileSystemAccessRoleArn", om.valueToTree(this.getFileSystemAccessRoleArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInTransitEncryption() != null) {
                data.set("inTransitEncryption", om.valueToTree(this.getInTransitEncryption()));
            }
            if (this.getSubdirectory() != null) {
                data.set("subdirectory", om.valueToTree(this.getSubdirectory()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.datasyncLocationEfs.DatasyncLocationEfsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationEfsConfig.Jsii$Proxy that = (DatasyncLocationEfsConfig.Jsii$Proxy) o;

            if (!ec2Config.equals(that.ec2Config)) return false;
            if (!efsFileSystemArn.equals(that.efsFileSystemArn)) return false;
            if (this.accessPointArn != null ? !this.accessPointArn.equals(that.accessPointArn) : that.accessPointArn != null) return false;
            if (this.fileSystemAccessRoleArn != null ? !this.fileSystemAccessRoleArn.equals(that.fileSystemAccessRoleArn) : that.fileSystemAccessRoleArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.inTransitEncryption != null ? !this.inTransitEncryption.equals(that.inTransitEncryption) : that.inTransitEncryption != null) return false;
            if (this.subdirectory != null ? !this.subdirectory.equals(that.subdirectory) : that.subdirectory != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.ec2Config.hashCode();
            result = 31 * result + (this.efsFileSystemArn.hashCode());
            result = 31 * result + (this.accessPointArn != null ? this.accessPointArn.hashCode() : 0);
            result = 31 * result + (this.fileSystemAccessRoleArn != null ? this.fileSystemAccessRoleArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.inTransitEncryption != null ? this.inTransitEncryption.hashCode() : 0);
            result = 31 * result + (this.subdirectory != null ? this.subdirectory.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
