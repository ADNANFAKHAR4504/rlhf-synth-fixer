package imports.aws.s3_bucket_website_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.272Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(S3BucketWebsiteConfigurationConfig.Jsii$Proxy.class)
public interface S3BucketWebsiteConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#bucket S3BucketWebsiteConfiguration#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * error_document block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#error_document S3BucketWebsiteConfiguration#error_document}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationErrorDocument getErrorDocument() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#expected_bucket_owner S3BucketWebsiteConfiguration#expected_bucket_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpectedBucketOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#id S3BucketWebsiteConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * index_document block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#index_document S3BucketWebsiteConfiguration#index_document}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument getIndexDocument() {
        return null;
    }

    /**
     * redirect_all_requests_to block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#redirect_all_requests_to S3BucketWebsiteConfiguration#redirect_all_requests_to}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRedirectAllRequestsTo getRedirectAllRequestsTo() {
        return null;
    }

    /**
     * routing_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#routing_rule S3BucketWebsiteConfiguration#routing_rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRoutingRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#routing_rules S3BucketWebsiteConfiguration#routing_rules}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingRules() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketWebsiteConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketWebsiteConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketWebsiteConfigurationConfig> {
        java.lang.String bucket;
        imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationErrorDocument errorDocument;
        java.lang.String expectedBucketOwner;
        java.lang.String id;
        imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument indexDocument;
        imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRedirectAllRequestsTo redirectAllRequestsTo;
        java.lang.Object routingRule;
        java.lang.String routingRules;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#bucket S3BucketWebsiteConfiguration#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getErrorDocument}
         * @param errorDocument error_document block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#error_document S3BucketWebsiteConfiguration#error_document}
         * @return {@code this}
         */
        public Builder errorDocument(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationErrorDocument errorDocument) {
            this.errorDocument = errorDocument;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getExpectedBucketOwner}
         * @param expectedBucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#expected_bucket_owner S3BucketWebsiteConfiguration#expected_bucket_owner}.
         * @return {@code this}
         */
        public Builder expectedBucketOwner(java.lang.String expectedBucketOwner) {
            this.expectedBucketOwner = expectedBucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#id S3BucketWebsiteConfiguration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getIndexDocument}
         * @param indexDocument index_document block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#index_document S3BucketWebsiteConfiguration#index_document}
         * @return {@code this}
         */
        public Builder indexDocument(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument indexDocument) {
            this.indexDocument = indexDocument;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getRedirectAllRequestsTo}
         * @param redirectAllRequestsTo redirect_all_requests_to block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#redirect_all_requests_to S3BucketWebsiteConfiguration#redirect_all_requests_to}
         * @return {@code this}
         */
        public Builder redirectAllRequestsTo(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRedirectAllRequestsTo redirectAllRequestsTo) {
            this.redirectAllRequestsTo = redirectAllRequestsTo;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getRoutingRule}
         * @param routingRule routing_rule block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#routing_rule S3BucketWebsiteConfiguration#routing_rule}
         * @return {@code this}
         */
        public Builder routingRule(com.hashicorp.cdktf.IResolvable routingRule) {
            this.routingRule = routingRule;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getRoutingRule}
         * @param routingRule routing_rule block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#routing_rule S3BucketWebsiteConfiguration#routing_rule}
         * @return {@code this}
         */
        public Builder routingRule(java.util.List<? extends imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRule> routingRule) {
            this.routingRule = routingRule;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getRoutingRules}
         * @param routingRules Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#routing_rules S3BucketWebsiteConfiguration#routing_rules}.
         * @return {@code this}
         */
        public Builder routingRules(java.lang.String routingRules) {
            this.routingRules = routingRules;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link S3BucketWebsiteConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketWebsiteConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketWebsiteConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketWebsiteConfigurationConfig {
        private final java.lang.String bucket;
        private final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationErrorDocument errorDocument;
        private final java.lang.String expectedBucketOwner;
        private final java.lang.String id;
        private final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument indexDocument;
        private final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRedirectAllRequestsTo redirectAllRequestsTo;
        private final java.lang.Object routingRule;
        private final java.lang.String routingRules;
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
            this.errorDocument = software.amazon.jsii.Kernel.get(this, "errorDocument", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationErrorDocument.class));
            this.expectedBucketOwner = software.amazon.jsii.Kernel.get(this, "expectedBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.indexDocument = software.amazon.jsii.Kernel.get(this, "indexDocument", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument.class));
            this.redirectAllRequestsTo = software.amazon.jsii.Kernel.get(this, "redirectAllRequestsTo", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRedirectAllRequestsTo.class));
            this.routingRule = software.amazon.jsii.Kernel.get(this, "routingRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.routingRules = software.amazon.jsii.Kernel.get(this, "routingRules", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.errorDocument = builder.errorDocument;
            this.expectedBucketOwner = builder.expectedBucketOwner;
            this.id = builder.id;
            this.indexDocument = builder.indexDocument;
            this.redirectAllRequestsTo = builder.redirectAllRequestsTo;
            this.routingRule = builder.routingRule;
            this.routingRules = builder.routingRules;
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
        public final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationErrorDocument getErrorDocument() {
            return this.errorDocument;
        }

        @Override
        public final java.lang.String getExpectedBucketOwner() {
            return this.expectedBucketOwner;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument getIndexDocument() {
            return this.indexDocument;
        }

        @Override
        public final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRedirectAllRequestsTo getRedirectAllRequestsTo() {
            return this.redirectAllRequestsTo;
        }

        @Override
        public final java.lang.Object getRoutingRule() {
            return this.routingRule;
        }

        @Override
        public final java.lang.String getRoutingRules() {
            return this.routingRules;
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
            if (this.getErrorDocument() != null) {
                data.set("errorDocument", om.valueToTree(this.getErrorDocument()));
            }
            if (this.getExpectedBucketOwner() != null) {
                data.set("expectedBucketOwner", om.valueToTree(this.getExpectedBucketOwner()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIndexDocument() != null) {
                data.set("indexDocument", om.valueToTree(this.getIndexDocument()));
            }
            if (this.getRedirectAllRequestsTo() != null) {
                data.set("redirectAllRequestsTo", om.valueToTree(this.getRedirectAllRequestsTo()));
            }
            if (this.getRoutingRule() != null) {
                data.set("routingRule", om.valueToTree(this.getRoutingRule()));
            }
            if (this.getRoutingRules() != null) {
                data.set("routingRules", om.valueToTree(this.getRoutingRules()));
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
            struct.set("fqn", om.valueToTree("aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketWebsiteConfigurationConfig.Jsii$Proxy that = (S3BucketWebsiteConfigurationConfig.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (this.errorDocument != null ? !this.errorDocument.equals(that.errorDocument) : that.errorDocument != null) return false;
            if (this.expectedBucketOwner != null ? !this.expectedBucketOwner.equals(that.expectedBucketOwner) : that.expectedBucketOwner != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.indexDocument != null ? !this.indexDocument.equals(that.indexDocument) : that.indexDocument != null) return false;
            if (this.redirectAllRequestsTo != null ? !this.redirectAllRequestsTo.equals(that.redirectAllRequestsTo) : that.redirectAllRequestsTo != null) return false;
            if (this.routingRule != null ? !this.routingRule.equals(that.routingRule) : that.routingRule != null) return false;
            if (this.routingRules != null ? !this.routingRules.equals(that.routingRules) : that.routingRules != null) return false;
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
            result = 31 * result + (this.errorDocument != null ? this.errorDocument.hashCode() : 0);
            result = 31 * result + (this.expectedBucketOwner != null ? this.expectedBucketOwner.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.indexDocument != null ? this.indexDocument.hashCode() : 0);
            result = 31 * result + (this.redirectAllRequestsTo != null ? this.redirectAllRequestsTo.hashCode() : 0);
            result = 31 * result + (this.routingRule != null ? this.routingRule.hashCode() : 0);
            result = 31 * result + (this.routingRules != null ? this.routingRules.hashCode() : 0);
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
