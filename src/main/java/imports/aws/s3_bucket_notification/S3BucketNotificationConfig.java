package imports.aws.s3_bucket_notification;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.262Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketNotification.S3BucketNotificationConfig")
@software.amazon.jsii.Jsii.Proxy(S3BucketNotificationConfig.Jsii$Proxy.class)
public interface S3BucketNotificationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#bucket S3BucketNotification#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#eventbridge S3BucketNotification#eventbridge}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEventbridge() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#id S3BucketNotification#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * lambda_function block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#lambda_function S3BucketNotification#lambda_function}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLambdaFunction() {
        return null;
    }

    /**
     * queue block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#queue S3BucketNotification#queue}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueue() {
        return null;
    }

    /**
     * topic block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#topic S3BucketNotification#topic}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTopic() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketNotificationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketNotificationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketNotificationConfig> {
        java.lang.String bucket;
        java.lang.Object eventbridge;
        java.lang.String id;
        java.lang.Object lambdaFunction;
        java.lang.Object queue;
        java.lang.Object topic;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#bucket S3BucketNotification#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getEventbridge}
         * @param eventbridge Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#eventbridge S3BucketNotification#eventbridge}.
         * @return {@code this}
         */
        public Builder eventbridge(java.lang.Boolean eventbridge) {
            this.eventbridge = eventbridge;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getEventbridge}
         * @param eventbridge Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#eventbridge S3BucketNotification#eventbridge}.
         * @return {@code this}
         */
        public Builder eventbridge(com.hashicorp.cdktf.IResolvable eventbridge) {
            this.eventbridge = eventbridge;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#id S3BucketNotification#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getLambdaFunction}
         * @param lambdaFunction lambda_function block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#lambda_function S3BucketNotification#lambda_function}
         * @return {@code this}
         */
        public Builder lambdaFunction(com.hashicorp.cdktf.IResolvable lambdaFunction) {
            this.lambdaFunction = lambdaFunction;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getLambdaFunction}
         * @param lambdaFunction lambda_function block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#lambda_function S3BucketNotification#lambda_function}
         * @return {@code this}
         */
        public Builder lambdaFunction(java.util.List<? extends imports.aws.s3_bucket_notification.S3BucketNotificationLambdaFunction> lambdaFunction) {
            this.lambdaFunction = lambdaFunction;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getQueue}
         * @param queue queue block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#queue S3BucketNotification#queue}
         * @return {@code this}
         */
        public Builder queue(com.hashicorp.cdktf.IResolvable queue) {
            this.queue = queue;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getQueue}
         * @param queue queue block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#queue S3BucketNotification#queue}
         * @return {@code this}
         */
        public Builder queue(java.util.List<? extends imports.aws.s3_bucket_notification.S3BucketNotificationQueue> queue) {
            this.queue = queue;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getTopic}
         * @param topic topic block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#topic S3BucketNotification#topic}
         * @return {@code this}
         */
        public Builder topic(com.hashicorp.cdktf.IResolvable topic) {
            this.topic = topic;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getTopic}
         * @param topic topic block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_notification#topic S3BucketNotification#topic}
         * @return {@code this}
         */
        public Builder topic(java.util.List<? extends imports.aws.s3_bucket_notification.S3BucketNotificationTopic> topic) {
            this.topic = topic;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getDependsOn}
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
         * Sets the value of {@link S3BucketNotificationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketNotificationConfig#getProvisioners}
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
         * @return a new instance of {@link S3BucketNotificationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketNotificationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketNotificationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketNotificationConfig {
        private final java.lang.String bucket;
        private final java.lang.Object eventbridge;
        private final java.lang.String id;
        private final java.lang.Object lambdaFunction;
        private final java.lang.Object queue;
        private final java.lang.Object topic;
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
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventbridge = software.amazon.jsii.Kernel.get(this, "eventbridge", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaFunction = software.amazon.jsii.Kernel.get(this, "lambdaFunction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.queue = software.amazon.jsii.Kernel.get(this, "queue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.topic = software.amazon.jsii.Kernel.get(this, "topic", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.eventbridge = builder.eventbridge;
            this.id = builder.id;
            this.lambdaFunction = builder.lambdaFunction;
            this.queue = builder.queue;
            this.topic = builder.topic;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.Object getEventbridge() {
            return this.eventbridge;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getLambdaFunction() {
            return this.lambdaFunction;
        }

        @Override
        public final java.lang.Object getQueue() {
            return this.queue;
        }

        @Override
        public final java.lang.Object getTopic() {
            return this.topic;
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

            data.set("bucket", om.valueToTree(this.getBucket()));
            if (this.getEventbridge() != null) {
                data.set("eventbridge", om.valueToTree(this.getEventbridge()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLambdaFunction() != null) {
                data.set("lambdaFunction", om.valueToTree(this.getLambdaFunction()));
            }
            if (this.getQueue() != null) {
                data.set("queue", om.valueToTree(this.getQueue()));
            }
            if (this.getTopic() != null) {
                data.set("topic", om.valueToTree(this.getTopic()));
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
            struct.set("fqn", om.valueToTree("aws.s3BucketNotification.S3BucketNotificationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketNotificationConfig.Jsii$Proxy that = (S3BucketNotificationConfig.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (this.eventbridge != null ? !this.eventbridge.equals(that.eventbridge) : that.eventbridge != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lambdaFunction != null ? !this.lambdaFunction.equals(that.lambdaFunction) : that.lambdaFunction != null) return false;
            if (this.queue != null ? !this.queue.equals(that.queue) : that.queue != null) return false;
            if (this.topic != null ? !this.topic.equals(that.topic) : that.topic != null) return false;
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
            int result = this.bucket.hashCode();
            result = 31 * result + (this.eventbridge != null ? this.eventbridge.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lambdaFunction != null ? this.lambdaFunction.hashCode() : 0);
            result = 31 * result + (this.queue != null ? this.queue.hashCode() : 0);
            result = 31 * result + (this.topic != null ? this.topic.hashCode() : 0);
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
