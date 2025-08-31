package imports.aws.s3_account_public_access_block;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3AccountPublicAccessBlock.S3AccountPublicAccessBlockConfig")
@software.amazon.jsii.Jsii.Proxy(S3AccountPublicAccessBlockConfig.Jsii$Proxy.class)
public interface S3AccountPublicAccessBlockConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#account_id S3AccountPublicAccessBlock#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_acls S3AccountPublicAccessBlock#block_public_acls}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBlockPublicAcls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_policy S3AccountPublicAccessBlock#block_public_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBlockPublicPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#id S3AccountPublicAccessBlock#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#ignore_public_acls S3AccountPublicAccessBlock#ignore_public_acls}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIgnorePublicAcls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#restrict_public_buckets S3AccountPublicAccessBlock#restrict_public_buckets}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRestrictPublicBuckets() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3AccountPublicAccessBlockConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3AccountPublicAccessBlockConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3AccountPublicAccessBlockConfig> {
        java.lang.String accountId;
        java.lang.Object blockPublicAcls;
        java.lang.Object blockPublicPolicy;
        java.lang.String id;
        java.lang.Object ignorePublicAcls;
        java.lang.Object restrictPublicBuckets;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#account_id S3AccountPublicAccessBlock#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getBlockPublicAcls}
         * @param blockPublicAcls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_acls S3AccountPublicAccessBlock#block_public_acls}.
         * @return {@code this}
         */
        public Builder blockPublicAcls(java.lang.Boolean blockPublicAcls) {
            this.blockPublicAcls = blockPublicAcls;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getBlockPublicAcls}
         * @param blockPublicAcls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_acls S3AccountPublicAccessBlock#block_public_acls}.
         * @return {@code this}
         */
        public Builder blockPublicAcls(com.hashicorp.cdktf.IResolvable blockPublicAcls) {
            this.blockPublicAcls = blockPublicAcls;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getBlockPublicPolicy}
         * @param blockPublicPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_policy S3AccountPublicAccessBlock#block_public_policy}.
         * @return {@code this}
         */
        public Builder blockPublicPolicy(java.lang.Boolean blockPublicPolicy) {
            this.blockPublicPolicy = blockPublicPolicy;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getBlockPublicPolicy}
         * @param blockPublicPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_policy S3AccountPublicAccessBlock#block_public_policy}.
         * @return {@code this}
         */
        public Builder blockPublicPolicy(com.hashicorp.cdktf.IResolvable blockPublicPolicy) {
            this.blockPublicPolicy = blockPublicPolicy;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#id S3AccountPublicAccessBlock#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getIgnorePublicAcls}
         * @param ignorePublicAcls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#ignore_public_acls S3AccountPublicAccessBlock#ignore_public_acls}.
         * @return {@code this}
         */
        public Builder ignorePublicAcls(java.lang.Boolean ignorePublicAcls) {
            this.ignorePublicAcls = ignorePublicAcls;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getIgnorePublicAcls}
         * @param ignorePublicAcls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#ignore_public_acls S3AccountPublicAccessBlock#ignore_public_acls}.
         * @return {@code this}
         */
        public Builder ignorePublicAcls(com.hashicorp.cdktf.IResolvable ignorePublicAcls) {
            this.ignorePublicAcls = ignorePublicAcls;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getRestrictPublicBuckets}
         * @param restrictPublicBuckets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#restrict_public_buckets S3AccountPublicAccessBlock#restrict_public_buckets}.
         * @return {@code this}
         */
        public Builder restrictPublicBuckets(java.lang.Boolean restrictPublicBuckets) {
            this.restrictPublicBuckets = restrictPublicBuckets;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getRestrictPublicBuckets}
         * @param restrictPublicBuckets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#restrict_public_buckets S3AccountPublicAccessBlock#restrict_public_buckets}.
         * @return {@code this}
         */
        public Builder restrictPublicBuckets(com.hashicorp.cdktf.IResolvable restrictPublicBuckets) {
            this.restrictPublicBuckets = restrictPublicBuckets;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getDependsOn}
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
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link S3AccountPublicAccessBlockConfig#getProvisioners}
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
         * @return a new instance of {@link S3AccountPublicAccessBlockConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3AccountPublicAccessBlockConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3AccountPublicAccessBlockConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3AccountPublicAccessBlockConfig {
        private final java.lang.String accountId;
        private final java.lang.Object blockPublicAcls;
        private final java.lang.Object blockPublicPolicy;
        private final java.lang.String id;
        private final java.lang.Object ignorePublicAcls;
        private final java.lang.Object restrictPublicBuckets;
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
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.blockPublicAcls = software.amazon.jsii.Kernel.get(this, "blockPublicAcls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.blockPublicPolicy = software.amazon.jsii.Kernel.get(this, "blockPublicPolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ignorePublicAcls = software.amazon.jsii.Kernel.get(this, "ignorePublicAcls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.restrictPublicBuckets = software.amazon.jsii.Kernel.get(this, "restrictPublicBuckets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.accountId = builder.accountId;
            this.blockPublicAcls = builder.blockPublicAcls;
            this.blockPublicPolicy = builder.blockPublicPolicy;
            this.id = builder.id;
            this.ignorePublicAcls = builder.ignorePublicAcls;
            this.restrictPublicBuckets = builder.restrictPublicBuckets;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.Object getBlockPublicAcls() {
            return this.blockPublicAcls;
        }

        @Override
        public final java.lang.Object getBlockPublicPolicy() {
            return this.blockPublicPolicy;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIgnorePublicAcls() {
            return this.ignorePublicAcls;
        }

        @Override
        public final java.lang.Object getRestrictPublicBuckets() {
            return this.restrictPublicBuckets;
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

            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getBlockPublicAcls() != null) {
                data.set("blockPublicAcls", om.valueToTree(this.getBlockPublicAcls()));
            }
            if (this.getBlockPublicPolicy() != null) {
                data.set("blockPublicPolicy", om.valueToTree(this.getBlockPublicPolicy()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIgnorePublicAcls() != null) {
                data.set("ignorePublicAcls", om.valueToTree(this.getIgnorePublicAcls()));
            }
            if (this.getRestrictPublicBuckets() != null) {
                data.set("restrictPublicBuckets", om.valueToTree(this.getRestrictPublicBuckets()));
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
            struct.set("fqn", om.valueToTree("aws.s3AccountPublicAccessBlock.S3AccountPublicAccessBlockConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3AccountPublicAccessBlockConfig.Jsii$Proxy that = (S3AccountPublicAccessBlockConfig.Jsii$Proxy) o;

            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.blockPublicAcls != null ? !this.blockPublicAcls.equals(that.blockPublicAcls) : that.blockPublicAcls != null) return false;
            if (this.blockPublicPolicy != null ? !this.blockPublicPolicy.equals(that.blockPublicPolicy) : that.blockPublicPolicy != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ignorePublicAcls != null ? !this.ignorePublicAcls.equals(that.ignorePublicAcls) : that.ignorePublicAcls != null) return false;
            if (this.restrictPublicBuckets != null ? !this.restrictPublicBuckets.equals(that.restrictPublicBuckets) : that.restrictPublicBuckets != null) return false;
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
            int result = this.accountId != null ? this.accountId.hashCode() : 0;
            result = 31 * result + (this.blockPublicAcls != null ? this.blockPublicAcls.hashCode() : 0);
            result = 31 * result + (this.blockPublicPolicy != null ? this.blockPublicPolicy.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ignorePublicAcls != null ? this.ignorePublicAcls.hashCode() : 0);
            result = 31 * result + (this.restrictPublicBuckets != null ? this.restrictPublicBuckets.hashCode() : 0);
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
