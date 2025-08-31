package imports.aws.data_aws_s3_objects;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.848Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsS3Objects.DataAwsS3ObjectsConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsS3ObjectsConfig.Jsii$Proxy.class)
public interface DataAwsS3ObjectsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#bucket DataAwsS3Objects#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#delimiter DataAwsS3Objects#delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#encoding_type DataAwsS3Objects#encoding_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncodingType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#fetch_owner DataAwsS3Objects#fetch_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFetchOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#id DataAwsS3Objects#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#max_keys DataAwsS3Objects#max_keys}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxKeys() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#prefix DataAwsS3Objects#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#request_payer DataAwsS3Objects#request_payer}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRequestPayer() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#start_after DataAwsS3Objects#start_after}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartAfter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsS3ObjectsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsS3ObjectsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsS3ObjectsConfig> {
        java.lang.String bucket;
        java.lang.String delimiter;
        java.lang.String encodingType;
        java.lang.Object fetchOwner;
        java.lang.String id;
        java.lang.Number maxKeys;
        java.lang.String prefix;
        java.lang.String requestPayer;
        java.lang.String startAfter;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#bucket DataAwsS3Objects#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getDelimiter}
         * @param delimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#delimiter DataAwsS3Objects#delimiter}.
         * @return {@code this}
         */
        public Builder delimiter(java.lang.String delimiter) {
            this.delimiter = delimiter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getEncodingType}
         * @param encodingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#encoding_type DataAwsS3Objects#encoding_type}.
         * @return {@code this}
         */
        public Builder encodingType(java.lang.String encodingType) {
            this.encodingType = encodingType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getFetchOwner}
         * @param fetchOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#fetch_owner DataAwsS3Objects#fetch_owner}.
         * @return {@code this}
         */
        public Builder fetchOwner(java.lang.Boolean fetchOwner) {
            this.fetchOwner = fetchOwner;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getFetchOwner}
         * @param fetchOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#fetch_owner DataAwsS3Objects#fetch_owner}.
         * @return {@code this}
         */
        public Builder fetchOwner(com.hashicorp.cdktf.IResolvable fetchOwner) {
            this.fetchOwner = fetchOwner;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#id DataAwsS3Objects#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getMaxKeys}
         * @param maxKeys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#max_keys DataAwsS3Objects#max_keys}.
         * @return {@code this}
         */
        public Builder maxKeys(java.lang.Number maxKeys) {
            this.maxKeys = maxKeys;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#prefix DataAwsS3Objects#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getRequestPayer}
         * @param requestPayer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#request_payer DataAwsS3Objects#request_payer}.
         * @return {@code this}
         */
        public Builder requestPayer(java.lang.String requestPayer) {
            this.requestPayer = requestPayer;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getStartAfter}
         * @param startAfter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/s3_objects#start_after DataAwsS3Objects#start_after}.
         * @return {@code this}
         */
        public Builder startAfter(java.lang.String startAfter) {
            this.startAfter = startAfter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsS3ObjectsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsS3ObjectsConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsS3ObjectsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsS3ObjectsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsS3ObjectsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsS3ObjectsConfig {
        private final java.lang.String bucket;
        private final java.lang.String delimiter;
        private final java.lang.String encodingType;
        private final java.lang.Object fetchOwner;
        private final java.lang.String id;
        private final java.lang.Number maxKeys;
        private final java.lang.String prefix;
        private final java.lang.String requestPayer;
        private final java.lang.String startAfter;
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
            this.delimiter = software.amazon.jsii.Kernel.get(this, "delimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encodingType = software.amazon.jsii.Kernel.get(this, "encodingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fetchOwner = software.amazon.jsii.Kernel.get(this, "fetchOwner", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxKeys = software.amazon.jsii.Kernel.get(this, "maxKeys", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requestPayer = software.amazon.jsii.Kernel.get(this, "requestPayer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startAfter = software.amazon.jsii.Kernel.get(this, "startAfter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.delimiter = builder.delimiter;
            this.encodingType = builder.encodingType;
            this.fetchOwner = builder.fetchOwner;
            this.id = builder.id;
            this.maxKeys = builder.maxKeys;
            this.prefix = builder.prefix;
            this.requestPayer = builder.requestPayer;
            this.startAfter = builder.startAfter;
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
        public final java.lang.String getDelimiter() {
            return this.delimiter;
        }

        @Override
        public final java.lang.String getEncodingType() {
            return this.encodingType;
        }

        @Override
        public final java.lang.Object getFetchOwner() {
            return this.fetchOwner;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMaxKeys() {
            return this.maxKeys;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final java.lang.String getRequestPayer() {
            return this.requestPayer;
        }

        @Override
        public final java.lang.String getStartAfter() {
            return this.startAfter;
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
            if (this.getDelimiter() != null) {
                data.set("delimiter", om.valueToTree(this.getDelimiter()));
            }
            if (this.getEncodingType() != null) {
                data.set("encodingType", om.valueToTree(this.getEncodingType()));
            }
            if (this.getFetchOwner() != null) {
                data.set("fetchOwner", om.valueToTree(this.getFetchOwner()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaxKeys() != null) {
                data.set("maxKeys", om.valueToTree(this.getMaxKeys()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }
            if (this.getRequestPayer() != null) {
                data.set("requestPayer", om.valueToTree(this.getRequestPayer()));
            }
            if (this.getStartAfter() != null) {
                data.set("startAfter", om.valueToTree(this.getStartAfter()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsS3Objects.DataAwsS3ObjectsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsS3ObjectsConfig.Jsii$Proxy that = (DataAwsS3ObjectsConfig.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (this.delimiter != null ? !this.delimiter.equals(that.delimiter) : that.delimiter != null) return false;
            if (this.encodingType != null ? !this.encodingType.equals(that.encodingType) : that.encodingType != null) return false;
            if (this.fetchOwner != null ? !this.fetchOwner.equals(that.fetchOwner) : that.fetchOwner != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.maxKeys != null ? !this.maxKeys.equals(that.maxKeys) : that.maxKeys != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            if (this.requestPayer != null ? !this.requestPayer.equals(that.requestPayer) : that.requestPayer != null) return false;
            if (this.startAfter != null ? !this.startAfter.equals(that.startAfter) : that.startAfter != null) return false;
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
            result = 31 * result + (this.delimiter != null ? this.delimiter.hashCode() : 0);
            result = 31 * result + (this.encodingType != null ? this.encodingType.hashCode() : 0);
            result = 31 * result + (this.fetchOwner != null ? this.fetchOwner.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maxKeys != null ? this.maxKeys.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.requestPayer != null ? this.requestPayer.hashCode() : 0);
            result = 31 * result + (this.startAfter != null ? this.startAfter.hashCode() : 0);
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
