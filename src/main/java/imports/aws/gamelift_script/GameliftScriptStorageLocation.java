package imports.aws.gamelift_script;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftScript.GameliftScriptStorageLocation")
@software.amazon.jsii.Jsii.Proxy(GameliftScriptStorageLocation.Jsii$Proxy.class)
public interface GameliftScriptStorageLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_script#bucket GameliftScript#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_script#key GameliftScript#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_script#role_arn GameliftScript#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_script#object_version GameliftScript#object_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftScriptStorageLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftScriptStorageLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftScriptStorageLocation> {
        java.lang.String bucket;
        java.lang.String key;
        java.lang.String roleArn;
        java.lang.String objectVersion;

        /**
         * Sets the value of {@link GameliftScriptStorageLocation#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_script#bucket GameliftScript#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link GameliftScriptStorageLocation#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_script#key GameliftScript#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link GameliftScriptStorageLocation#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_script#role_arn GameliftScript#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link GameliftScriptStorageLocation#getObjectVersion}
         * @param objectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_script#object_version GameliftScript#object_version}.
         * @return {@code this}
         */
        public Builder objectVersion(java.lang.String objectVersion) {
            this.objectVersion = objectVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftScriptStorageLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftScriptStorageLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftScriptStorageLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftScriptStorageLocation {
        private final java.lang.String bucket;
        private final java.lang.String key;
        private final java.lang.String roleArn;
        private final java.lang.String objectVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectVersion = software.amazon.jsii.Kernel.get(this, "objectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.objectVersion = builder.objectVersion;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getObjectVersion() {
            return this.objectVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            data.set("key", om.valueToTree(this.getKey()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getObjectVersion() != null) {
                data.set("objectVersion", om.valueToTree(this.getObjectVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftScript.GameliftScriptStorageLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftScriptStorageLocation.Jsii$Proxy that = (GameliftScriptStorageLocation.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (!key.equals(that.key)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            return this.objectVersion != null ? this.objectVersion.equals(that.objectVersion) : that.objectVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.key.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.objectVersion != null ? this.objectVersion.hashCode() : 0);
            return result;
        }
    }
}
