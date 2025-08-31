package imports.aws.ecs_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration.Jsii$Proxy.class)
public interface EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#cloud_watch_encryption_enabled EcsCluster#cloud_watch_encryption_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudWatchEncryptionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#cloud_watch_log_group_name EcsCluster#cloud_watch_log_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudWatchLogGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#s3_bucket_encryption_enabled EcsCluster#s3_bucket_encryption_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3BucketEncryptionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#s3_bucket_name EcsCluster#s3_bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3BucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#s3_key_prefix EcsCluster#s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration> {
        java.lang.Object cloudWatchEncryptionEnabled;
        java.lang.String cloudWatchLogGroupName;
        java.lang.Object s3BucketEncryptionEnabled;
        java.lang.String s3BucketName;
        java.lang.String s3KeyPrefix;

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration#getCloudWatchEncryptionEnabled}
         * @param cloudWatchEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#cloud_watch_encryption_enabled EcsCluster#cloud_watch_encryption_enabled}.
         * @return {@code this}
         */
        public Builder cloudWatchEncryptionEnabled(java.lang.Boolean cloudWatchEncryptionEnabled) {
            this.cloudWatchEncryptionEnabled = cloudWatchEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration#getCloudWatchEncryptionEnabled}
         * @param cloudWatchEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#cloud_watch_encryption_enabled EcsCluster#cloud_watch_encryption_enabled}.
         * @return {@code this}
         */
        public Builder cloudWatchEncryptionEnabled(com.hashicorp.cdktf.IResolvable cloudWatchEncryptionEnabled) {
            this.cloudWatchEncryptionEnabled = cloudWatchEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration#getCloudWatchLogGroupName}
         * @param cloudWatchLogGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#cloud_watch_log_group_name EcsCluster#cloud_watch_log_group_name}.
         * @return {@code this}
         */
        public Builder cloudWatchLogGroupName(java.lang.String cloudWatchLogGroupName) {
            this.cloudWatchLogGroupName = cloudWatchLogGroupName;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration#getS3BucketEncryptionEnabled}
         * @param s3BucketEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#s3_bucket_encryption_enabled EcsCluster#s3_bucket_encryption_enabled}.
         * @return {@code this}
         */
        public Builder s3BucketEncryptionEnabled(java.lang.Boolean s3BucketEncryptionEnabled) {
            this.s3BucketEncryptionEnabled = s3BucketEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration#getS3BucketEncryptionEnabled}
         * @param s3BucketEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#s3_bucket_encryption_enabled EcsCluster#s3_bucket_encryption_enabled}.
         * @return {@code this}
         */
        public Builder s3BucketEncryptionEnabled(com.hashicorp.cdktf.IResolvable s3BucketEncryptionEnabled) {
            this.s3BucketEncryptionEnabled = s3BucketEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#s3_bucket_name EcsCluster#s3_bucket_name}.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration#getS3KeyPrefix}
         * @param s3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#s3_key_prefix EcsCluster#s3_key_prefix}.
         * @return {@code this}
         */
        public Builder s3KeyPrefix(java.lang.String s3KeyPrefix) {
            this.s3KeyPrefix = s3KeyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration {
        private final java.lang.Object cloudWatchEncryptionEnabled;
        private final java.lang.String cloudWatchLogGroupName;
        private final java.lang.Object s3BucketEncryptionEnabled;
        private final java.lang.String s3BucketName;
        private final java.lang.String s3KeyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudWatchEncryptionEnabled = software.amazon.jsii.Kernel.get(this, "cloudWatchEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cloudWatchLogGroupName = software.amazon.jsii.Kernel.get(this, "cloudWatchLogGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3BucketEncryptionEnabled = software.amazon.jsii.Kernel.get(this, "s3BucketEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3KeyPrefix = software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudWatchEncryptionEnabled = builder.cloudWatchEncryptionEnabled;
            this.cloudWatchLogGroupName = builder.cloudWatchLogGroupName;
            this.s3BucketEncryptionEnabled = builder.s3BucketEncryptionEnabled;
            this.s3BucketName = builder.s3BucketName;
            this.s3KeyPrefix = builder.s3KeyPrefix;
        }

        @Override
        public final java.lang.Object getCloudWatchEncryptionEnabled() {
            return this.cloudWatchEncryptionEnabled;
        }

        @Override
        public final java.lang.String getCloudWatchLogGroupName() {
            return this.cloudWatchLogGroupName;
        }

        @Override
        public final java.lang.Object getS3BucketEncryptionEnabled() {
            return this.s3BucketEncryptionEnabled;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getS3KeyPrefix() {
            return this.s3KeyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudWatchEncryptionEnabled() != null) {
                data.set("cloudWatchEncryptionEnabled", om.valueToTree(this.getCloudWatchEncryptionEnabled()));
            }
            if (this.getCloudWatchLogGroupName() != null) {
                data.set("cloudWatchLogGroupName", om.valueToTree(this.getCloudWatchLogGroupName()));
            }
            if (this.getS3BucketEncryptionEnabled() != null) {
                data.set("s3BucketEncryptionEnabled", om.valueToTree(this.getS3BucketEncryptionEnabled()));
            }
            if (this.getS3BucketName() != null) {
                data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            }
            if (this.getS3KeyPrefix() != null) {
                data.set("s3KeyPrefix", om.valueToTree(this.getS3KeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsCluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration.Jsii$Proxy that = (EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration.Jsii$Proxy) o;

            if (this.cloudWatchEncryptionEnabled != null ? !this.cloudWatchEncryptionEnabled.equals(that.cloudWatchEncryptionEnabled) : that.cloudWatchEncryptionEnabled != null) return false;
            if (this.cloudWatchLogGroupName != null ? !this.cloudWatchLogGroupName.equals(that.cloudWatchLogGroupName) : that.cloudWatchLogGroupName != null) return false;
            if (this.s3BucketEncryptionEnabled != null ? !this.s3BucketEncryptionEnabled.equals(that.s3BucketEncryptionEnabled) : that.s3BucketEncryptionEnabled != null) return false;
            if (this.s3BucketName != null ? !this.s3BucketName.equals(that.s3BucketName) : that.s3BucketName != null) return false;
            return this.s3KeyPrefix != null ? this.s3KeyPrefix.equals(that.s3KeyPrefix) : that.s3KeyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudWatchEncryptionEnabled != null ? this.cloudWatchEncryptionEnabled.hashCode() : 0;
            result = 31 * result + (this.cloudWatchLogGroupName != null ? this.cloudWatchLogGroupName.hashCode() : 0);
            result = 31 * result + (this.s3BucketEncryptionEnabled != null ? this.s3BucketEncryptionEnabled.hashCode() : 0);
            result = 31 * result + (this.s3BucketName != null ? this.s3BucketName.hashCode() : 0);
            result = 31 * result + (this.s3KeyPrefix != null ? this.s3KeyPrefix.hashCode() : 0);
            return result;
        }
    }
}
