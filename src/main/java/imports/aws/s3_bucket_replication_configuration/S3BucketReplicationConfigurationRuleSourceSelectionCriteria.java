package imports.aws.s3_bucket_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.266Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleSourceSelectionCriteria")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRuleSourceSelectionCriteria.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRuleSourceSelectionCriteria extends software.amazon.jsii.JsiiSerializable {

    /**
     * replica_modifications block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#replica_modifications S3BucketReplicationConfigurationA#replica_modifications}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaReplicaModifications getReplicaModifications() {
        return null;
    }

    /**
     * sse_kms_encrypted_objects block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#sse_kms_encrypted_objects S3BucketReplicationConfigurationA#sse_kms_encrypted_objects}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaSseKmsEncryptedObjects getSseKmsEncryptedObjects() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRuleSourceSelectionCriteria}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRuleSourceSelectionCriteria}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRuleSourceSelectionCriteria> {
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaReplicaModifications replicaModifications;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaSseKmsEncryptedObjects sseKmsEncryptedObjects;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleSourceSelectionCriteria#getReplicaModifications}
         * @param replicaModifications replica_modifications block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#replica_modifications S3BucketReplicationConfigurationA#replica_modifications}
         * @return {@code this}
         */
        public Builder replicaModifications(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaReplicaModifications replicaModifications) {
            this.replicaModifications = replicaModifications;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleSourceSelectionCriteria#getSseKmsEncryptedObjects}
         * @param sseKmsEncryptedObjects sse_kms_encrypted_objects block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#sse_kms_encrypted_objects S3BucketReplicationConfigurationA#sse_kms_encrypted_objects}
         * @return {@code this}
         */
        public Builder sseKmsEncryptedObjects(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaSseKmsEncryptedObjects sseKmsEncryptedObjects) {
            this.sseKmsEncryptedObjects = sseKmsEncryptedObjects;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRuleSourceSelectionCriteria}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRuleSourceSelectionCriteria build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRuleSourceSelectionCriteria}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRuleSourceSelectionCriteria {
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaReplicaModifications replicaModifications;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaSseKmsEncryptedObjects sseKmsEncryptedObjects;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.replicaModifications = software.amazon.jsii.Kernel.get(this, "replicaModifications", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaReplicaModifications.class));
            this.sseKmsEncryptedObjects = software.amazon.jsii.Kernel.get(this, "sseKmsEncryptedObjects", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaSseKmsEncryptedObjects.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.replicaModifications = builder.replicaModifications;
            this.sseKmsEncryptedObjects = builder.sseKmsEncryptedObjects;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaReplicaModifications getReplicaModifications() {
            return this.replicaModifications;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteriaSseKmsEncryptedObjects getSseKmsEncryptedObjects() {
            return this.sseKmsEncryptedObjects;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getReplicaModifications() != null) {
                data.set("replicaModifications", om.valueToTree(this.getReplicaModifications()));
            }
            if (this.getSseKmsEncryptedObjects() != null) {
                data.set("sseKmsEncryptedObjects", om.valueToTree(this.getSseKmsEncryptedObjects()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleSourceSelectionCriteria"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRuleSourceSelectionCriteria.Jsii$Proxy that = (S3BucketReplicationConfigurationRuleSourceSelectionCriteria.Jsii$Proxy) o;

            if (this.replicaModifications != null ? !this.replicaModifications.equals(that.replicaModifications) : that.replicaModifications != null) return false;
            return this.sseKmsEncryptedObjects != null ? this.sseKmsEncryptedObjects.equals(that.sseKmsEncryptedObjects) : that.sseKmsEncryptedObjects == null;
        }

        @Override
        public final int hashCode() {
            int result = this.replicaModifications != null ? this.replicaModifications.hashCode() : 0;
            result = 31 * result + (this.sseKmsEncryptedObjects != null ? this.sseKmsEncryptedObjects.hashCode() : 0);
            return result;
        }
    }
}
