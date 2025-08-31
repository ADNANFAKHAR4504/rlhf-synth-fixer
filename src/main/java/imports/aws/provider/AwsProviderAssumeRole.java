package imports.aws.provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.084Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.provider.AwsProviderAssumeRole")
@software.amazon.jsii.Jsii.Proxy(AwsProviderAssumeRole.Jsii$Proxy.class)
public interface AwsProviderAssumeRole extends software.amazon.jsii.JsiiSerializable {

    /**
     * The duration, between 15 minutes and 12 hours, of the role session.
     * <p>
     * Valid time units are ns, us (or µs), ms, s, h, or m.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#duration AwsProvider#duration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDuration() {
        return null;
    }

    /**
     * A unique identifier that might be required when you assume a role in another account.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#external_id AwsProvider#external_id}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExternalId() {
        return null;
    }

    /**
     * IAM Policy JSON describing further restricting permissions for the IAM Role being assumed.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#policy AwsProvider#policy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * Amazon Resource Names (ARNs) of IAM Policies describing further restricting permissions for the IAM Role being assumed.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#policy_arns AwsProvider#policy_arns}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPolicyArns() {
        return null;
    }

    /**
     * Amazon Resource Name (ARN) of an IAM Role to assume prior to making API calls.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#role_arn AwsProvider#role_arn}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * An identifier for the assumed role session.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#session_name AwsProvider#session_name}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSessionName() {
        return null;
    }

    /**
     * Source identity specified by the principal assuming the role.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#source_identity AwsProvider#source_identity}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceIdentity() {
        return null;
    }

    /**
     * Assume role session tags.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#tags AwsProvider#tags}
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Assume role session tag keys to pass to any subsequent sessions.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#transitive_tag_keys AwsProvider#transitive_tag_keys}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTransitiveTagKeys() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AwsProviderAssumeRole}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AwsProviderAssumeRole}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AwsProviderAssumeRole> {
        java.lang.String duration;
        java.lang.String externalId;
        java.lang.String policy;
        java.util.List<java.lang.String> policyArns;
        java.lang.String roleArn;
        java.lang.String sessionName;
        java.lang.String sourceIdentity;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.List<java.lang.String> transitiveTagKeys;

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getDuration}
         * @param duration The duration, between 15 minutes and 12 hours, of the role session.
         *                 Valid time units are ns, us (or µs), ms, s, h, or m.
         *                 
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#duration AwsProvider#duration}
         * @return {@code this}
         */
        public Builder duration(java.lang.String duration) {
            this.duration = duration;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getExternalId}
         * @param externalId A unique identifier that might be required when you assume a role in another account.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#external_id AwsProvider#external_id}
         * @return {@code this}
         */
        public Builder externalId(java.lang.String externalId) {
            this.externalId = externalId;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getPolicy}
         * @param policy IAM Policy JSON describing further restricting permissions for the IAM Role being assumed.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#policy AwsProvider#policy}
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getPolicyArns}
         * @param policyArns Amazon Resource Names (ARNs) of IAM Policies describing further restricting permissions for the IAM Role being assumed.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#policy_arns AwsProvider#policy_arns}
         * @return {@code this}
         */
        public Builder policyArns(java.util.List<java.lang.String> policyArns) {
            this.policyArns = policyArns;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getRoleArn}
         * @param roleArn Amazon Resource Name (ARN) of an IAM Role to assume prior to making API calls.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#role_arn AwsProvider#role_arn}
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getSessionName}
         * @param sessionName An identifier for the assumed role session.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#session_name AwsProvider#session_name}
         * @return {@code this}
         */
        public Builder sessionName(java.lang.String sessionName) {
            this.sessionName = sessionName;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getSourceIdentity}
         * @param sourceIdentity Source identity specified by the principal assuming the role.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#source_identity AwsProvider#source_identity}
         * @return {@code this}
         */
        public Builder sourceIdentity(java.lang.String sourceIdentity) {
            this.sourceIdentity = sourceIdentity;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getTags}
         * @param tags Assume role session tags.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#tags AwsProvider#tags}
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRole#getTransitiveTagKeys}
         * @param transitiveTagKeys Assume role session tag keys to pass to any subsequent sessions.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#transitive_tag_keys AwsProvider#transitive_tag_keys}
         * @return {@code this}
         */
        public Builder transitiveTagKeys(java.util.List<java.lang.String> transitiveTagKeys) {
            this.transitiveTagKeys = transitiveTagKeys;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AwsProviderAssumeRole}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AwsProviderAssumeRole build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AwsProviderAssumeRole}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AwsProviderAssumeRole {
        private final java.lang.String duration;
        private final java.lang.String externalId;
        private final java.lang.String policy;
        private final java.util.List<java.lang.String> policyArns;
        private final java.lang.String roleArn;
        private final java.lang.String sessionName;
        private final java.lang.String sourceIdentity;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.List<java.lang.String> transitiveTagKeys;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.duration = software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.externalId = software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyArns = software.amazon.jsii.Kernel.get(this, "policyArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sessionName = software.amazon.jsii.Kernel.get(this, "sessionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceIdentity = software.amazon.jsii.Kernel.get(this, "sourceIdentity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.transitiveTagKeys = software.amazon.jsii.Kernel.get(this, "transitiveTagKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.duration = builder.duration;
            this.externalId = builder.externalId;
            this.policy = builder.policy;
            this.policyArns = builder.policyArns;
            this.roleArn = builder.roleArn;
            this.sessionName = builder.sessionName;
            this.sourceIdentity = builder.sourceIdentity;
            this.tags = builder.tags;
            this.transitiveTagKeys = builder.transitiveTagKeys;
        }

        @Override
        public final java.lang.String getDuration() {
            return this.duration;
        }

        @Override
        public final java.lang.String getExternalId() {
            return this.externalId;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final java.util.List<java.lang.String> getPolicyArns() {
            return this.policyArns;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getSessionName() {
            return this.sessionName;
        }

        @Override
        public final java.lang.String getSourceIdentity() {
            return this.sourceIdentity;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.List<java.lang.String> getTransitiveTagKeys() {
            return this.transitiveTagKeys;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDuration() != null) {
                data.set("duration", om.valueToTree(this.getDuration()));
            }
            if (this.getExternalId() != null) {
                data.set("externalId", om.valueToTree(this.getExternalId()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getPolicyArns() != null) {
                data.set("policyArns", om.valueToTree(this.getPolicyArns()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getSessionName() != null) {
                data.set("sessionName", om.valueToTree(this.getSessionName()));
            }
            if (this.getSourceIdentity() != null) {
                data.set("sourceIdentity", om.valueToTree(this.getSourceIdentity()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTransitiveTagKeys() != null) {
                data.set("transitiveTagKeys", om.valueToTree(this.getTransitiveTagKeys()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.provider.AwsProviderAssumeRole"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AwsProviderAssumeRole.Jsii$Proxy that = (AwsProviderAssumeRole.Jsii$Proxy) o;

            if (this.duration != null ? !this.duration.equals(that.duration) : that.duration != null) return false;
            if (this.externalId != null ? !this.externalId.equals(that.externalId) : that.externalId != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.policyArns != null ? !this.policyArns.equals(that.policyArns) : that.policyArns != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            if (this.sessionName != null ? !this.sessionName.equals(that.sessionName) : that.sessionName != null) return false;
            if (this.sourceIdentity != null ? !this.sourceIdentity.equals(that.sourceIdentity) : that.sourceIdentity != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            return this.transitiveTagKeys != null ? this.transitiveTagKeys.equals(that.transitiveTagKeys) : that.transitiveTagKeys == null;
        }

        @Override
        public final int hashCode() {
            int result = this.duration != null ? this.duration.hashCode() : 0;
            result = 31 * result + (this.externalId != null ? this.externalId.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.policyArns != null ? this.policyArns.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.sessionName != null ? this.sessionName.hashCode() : 0);
            result = 31 * result + (this.sourceIdentity != null ? this.sourceIdentity.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.transitiveTagKeys != null ? this.transitiveTagKeys.hashCode() : 0);
            return result;
        }
    }
}
