package imports.aws.config_delivery_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.376Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configDeliveryChannel.ConfigDeliveryChannelConfig")
@software.amazon.jsii.Jsii.Proxy(ConfigDeliveryChannelConfig.Jsii$Proxy.class)
public interface ConfigDeliveryChannelConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#s3_bucket_name ConfigDeliveryChannel#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#id ConfigDeliveryChannel#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#name ConfigDeliveryChannel#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#s3_key_prefix ConfigDeliveryChannel#s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#s3_kms_key_arn ConfigDeliveryChannel#s3_kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KmsKeyArn() {
        return null;
    }

    /**
     * snapshot_delivery_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#snapshot_delivery_properties ConfigDeliveryChannel#snapshot_delivery_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties getSnapshotDeliveryProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#sns_topic_arn ConfigDeliveryChannel#sns_topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnsTopicArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigDeliveryChannelConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigDeliveryChannelConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigDeliveryChannelConfig> {
        java.lang.String s3BucketName;
        java.lang.String id;
        java.lang.String name;
        java.lang.String s3KeyPrefix;
        java.lang.String s3KmsKeyArn;
        imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties snapshotDeliveryProperties;
        java.lang.String snsTopicArn;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#s3_bucket_name ConfigDeliveryChannel#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#id ConfigDeliveryChannel#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#name ConfigDeliveryChannel#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getS3KeyPrefix}
         * @param s3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#s3_key_prefix ConfigDeliveryChannel#s3_key_prefix}.
         * @return {@code this}
         */
        public Builder s3KeyPrefix(java.lang.String s3KeyPrefix) {
            this.s3KeyPrefix = s3KeyPrefix;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getS3KmsKeyArn}
         * @param s3KmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#s3_kms_key_arn ConfigDeliveryChannel#s3_kms_key_arn}.
         * @return {@code this}
         */
        public Builder s3KmsKeyArn(java.lang.String s3KmsKeyArn) {
            this.s3KmsKeyArn = s3KmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getSnapshotDeliveryProperties}
         * @param snapshotDeliveryProperties snapshot_delivery_properties block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#snapshot_delivery_properties ConfigDeliveryChannel#snapshot_delivery_properties}
         * @return {@code this}
         */
        public Builder snapshotDeliveryProperties(imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties snapshotDeliveryProperties) {
            this.snapshotDeliveryProperties = snapshotDeliveryProperties;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getSnsTopicArn}
         * @param snsTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_delivery_channel#sns_topic_arn ConfigDeliveryChannel#sns_topic_arn}.
         * @return {@code this}
         */
        public Builder snsTopicArn(java.lang.String snsTopicArn) {
            this.snsTopicArn = snsTopicArn;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getDependsOn}
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
         * Sets the value of {@link ConfigDeliveryChannelConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ConfigDeliveryChannelConfig#getProvisioners}
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
         * @return a new instance of {@link ConfigDeliveryChannelConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigDeliveryChannelConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigDeliveryChannelConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigDeliveryChannelConfig {
        private final java.lang.String s3BucketName;
        private final java.lang.String id;
        private final java.lang.String name;
        private final java.lang.String s3KeyPrefix;
        private final java.lang.String s3KmsKeyArn;
        private final imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties snapshotDeliveryProperties;
        private final java.lang.String snsTopicArn;
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
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3KeyPrefix = software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3KmsKeyArn = software.amazon.jsii.Kernel.get(this, "s3KmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotDeliveryProperties = software.amazon.jsii.Kernel.get(this, "snapshotDeliveryProperties", software.amazon.jsii.NativeType.forClass(imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties.class));
            this.snsTopicArn = software.amazon.jsii.Kernel.get(this, "snsTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.id = builder.id;
            this.name = builder.name;
            this.s3KeyPrefix = builder.s3KeyPrefix;
            this.s3KmsKeyArn = builder.s3KmsKeyArn;
            this.snapshotDeliveryProperties = builder.snapshotDeliveryProperties;
            this.snsTopicArn = builder.snsTopicArn;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getS3KeyPrefix() {
            return this.s3KeyPrefix;
        }

        @Override
        public final java.lang.String getS3KmsKeyArn() {
            return this.s3KmsKeyArn;
        }

        @Override
        public final imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties getSnapshotDeliveryProperties() {
            return this.snapshotDeliveryProperties;
        }

        @Override
        public final java.lang.String getSnsTopicArn() {
            return this.snsTopicArn;
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

            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getS3KeyPrefix() != null) {
                data.set("s3KeyPrefix", om.valueToTree(this.getS3KeyPrefix()));
            }
            if (this.getS3KmsKeyArn() != null) {
                data.set("s3KmsKeyArn", om.valueToTree(this.getS3KmsKeyArn()));
            }
            if (this.getSnapshotDeliveryProperties() != null) {
                data.set("snapshotDeliveryProperties", om.valueToTree(this.getSnapshotDeliveryProperties()));
            }
            if (this.getSnsTopicArn() != null) {
                data.set("snsTopicArn", om.valueToTree(this.getSnsTopicArn()));
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
            struct.set("fqn", om.valueToTree("aws.configDeliveryChannel.ConfigDeliveryChannelConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigDeliveryChannelConfig.Jsii$Proxy that = (ConfigDeliveryChannelConfig.Jsii$Proxy) o;

            if (!s3BucketName.equals(that.s3BucketName)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.s3KeyPrefix != null ? !this.s3KeyPrefix.equals(that.s3KeyPrefix) : that.s3KeyPrefix != null) return false;
            if (this.s3KmsKeyArn != null ? !this.s3KmsKeyArn.equals(that.s3KmsKeyArn) : that.s3KmsKeyArn != null) return false;
            if (this.snapshotDeliveryProperties != null ? !this.snapshotDeliveryProperties.equals(that.snapshotDeliveryProperties) : that.snapshotDeliveryProperties != null) return false;
            if (this.snsTopicArn != null ? !this.snsTopicArn.equals(that.snsTopicArn) : that.snsTopicArn != null) return false;
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
            int result = this.s3BucketName.hashCode();
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.s3KeyPrefix != null ? this.s3KeyPrefix.hashCode() : 0);
            result = 31 * result + (this.s3KmsKeyArn != null ? this.s3KmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.snapshotDeliveryProperties != null ? this.snapshotDeliveryProperties.hashCode() : 0);
            result = 31 * result + (this.snsTopicArn != null ? this.snsTopicArn.hashCode() : 0);
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
