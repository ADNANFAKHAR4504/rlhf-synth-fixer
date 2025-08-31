package imports.aws.lb_trust_store_revocation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.539Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbTrustStoreRevocation.LbTrustStoreRevocationConfig")
@software.amazon.jsii.Jsii.Proxy(LbTrustStoreRevocationConfig.Jsii$Proxy.class)
public interface LbTrustStoreRevocationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_bucket LbTrustStoreRevocation#revocations_s3_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRevocationsS3Bucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_key LbTrustStoreRevocation#revocations_s3_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRevocationsS3Key();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#trust_store_arn LbTrustStoreRevocation#trust_store_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrustStoreArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#id LbTrustStoreRevocation#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_object_version LbTrustStoreRevocation#revocations_s3_object_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRevocationsS3ObjectVersion() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#timeouts LbTrustStoreRevocation#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbTrustStoreRevocationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbTrustStoreRevocationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbTrustStoreRevocationConfig> {
        java.lang.String revocationsS3Bucket;
        java.lang.String revocationsS3Key;
        java.lang.String trustStoreArn;
        java.lang.String id;
        java.lang.String revocationsS3ObjectVersion;
        imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getRevocationsS3Bucket}
         * @param revocationsS3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_bucket LbTrustStoreRevocation#revocations_s3_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder revocationsS3Bucket(java.lang.String revocationsS3Bucket) {
            this.revocationsS3Bucket = revocationsS3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getRevocationsS3Key}
         * @param revocationsS3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_key LbTrustStoreRevocation#revocations_s3_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder revocationsS3Key(java.lang.String revocationsS3Key) {
            this.revocationsS3Key = revocationsS3Key;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getTrustStoreArn}
         * @param trustStoreArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#trust_store_arn LbTrustStoreRevocation#trust_store_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder trustStoreArn(java.lang.String trustStoreArn) {
            this.trustStoreArn = trustStoreArn;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#id LbTrustStoreRevocation#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getRevocationsS3ObjectVersion}
         * @param revocationsS3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_object_version LbTrustStoreRevocation#revocations_s3_object_version}.
         * @return {@code this}
         */
        public Builder revocationsS3ObjectVersion(java.lang.String revocationsS3ObjectVersion) {
            this.revocationsS3ObjectVersion = revocationsS3ObjectVersion;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#timeouts LbTrustStoreRevocation#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getDependsOn}
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
         * Sets the value of {@link LbTrustStoreRevocationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LbTrustStoreRevocationConfig#getProvisioners}
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
         * @return a new instance of {@link LbTrustStoreRevocationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbTrustStoreRevocationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbTrustStoreRevocationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbTrustStoreRevocationConfig {
        private final java.lang.String revocationsS3Bucket;
        private final java.lang.String revocationsS3Key;
        private final java.lang.String trustStoreArn;
        private final java.lang.String id;
        private final java.lang.String revocationsS3ObjectVersion;
        private final imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeouts timeouts;
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
            this.revocationsS3Bucket = software.amazon.jsii.Kernel.get(this, "revocationsS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.revocationsS3Key = software.amazon.jsii.Kernel.get(this, "revocationsS3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trustStoreArn = software.amazon.jsii.Kernel.get(this, "trustStoreArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.revocationsS3ObjectVersion = software.amazon.jsii.Kernel.get(this, "revocationsS3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeouts.class));
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
            this.revocationsS3Bucket = java.util.Objects.requireNonNull(builder.revocationsS3Bucket, "revocationsS3Bucket is required");
            this.revocationsS3Key = java.util.Objects.requireNonNull(builder.revocationsS3Key, "revocationsS3Key is required");
            this.trustStoreArn = java.util.Objects.requireNonNull(builder.trustStoreArn, "trustStoreArn is required");
            this.id = builder.id;
            this.revocationsS3ObjectVersion = builder.revocationsS3ObjectVersion;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getRevocationsS3Bucket() {
            return this.revocationsS3Bucket;
        }

        @Override
        public final java.lang.String getRevocationsS3Key() {
            return this.revocationsS3Key;
        }

        @Override
        public final java.lang.String getTrustStoreArn() {
            return this.trustStoreArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getRevocationsS3ObjectVersion() {
            return this.revocationsS3ObjectVersion;
        }

        @Override
        public final imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("revocationsS3Bucket", om.valueToTree(this.getRevocationsS3Bucket()));
            data.set("revocationsS3Key", om.valueToTree(this.getRevocationsS3Key()));
            data.set("trustStoreArn", om.valueToTree(this.getTrustStoreArn()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRevocationsS3ObjectVersion() != null) {
                data.set("revocationsS3ObjectVersion", om.valueToTree(this.getRevocationsS3ObjectVersion()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.lbTrustStoreRevocation.LbTrustStoreRevocationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbTrustStoreRevocationConfig.Jsii$Proxy that = (LbTrustStoreRevocationConfig.Jsii$Proxy) o;

            if (!revocationsS3Bucket.equals(that.revocationsS3Bucket)) return false;
            if (!revocationsS3Key.equals(that.revocationsS3Key)) return false;
            if (!trustStoreArn.equals(that.trustStoreArn)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.revocationsS3ObjectVersion != null ? !this.revocationsS3ObjectVersion.equals(that.revocationsS3ObjectVersion) : that.revocationsS3ObjectVersion != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.revocationsS3Bucket.hashCode();
            result = 31 * result + (this.revocationsS3Key.hashCode());
            result = 31 * result + (this.trustStoreArn.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.revocationsS3ObjectVersion != null ? this.revocationsS3ObjectVersion.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
