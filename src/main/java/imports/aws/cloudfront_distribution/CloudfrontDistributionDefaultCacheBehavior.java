package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.231Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionDefaultCacheBehavior")
@software.amazon.jsii.Jsii.Proxy(CloudfrontDistributionDefaultCacheBehavior.Jsii$Proxy.class)
public interface CloudfrontDistributionDefaultCacheBehavior extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#allowed_methods CloudfrontDistribution#allowed_methods}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedMethods();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cached_methods CloudfrontDistribution#cached_methods}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCachedMethods();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#target_origin_id CloudfrontDistribution#target_origin_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetOriginId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#viewer_protocol_policy CloudfrontDistribution#viewer_protocol_policy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getViewerProtocolPolicy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cache_policy_id CloudfrontDistribution#cache_policy_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCachePolicyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#compress CloudfrontDistribution#compress}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCompress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#default_ttl CloudfrontDistribution#default_ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDefaultTtl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#field_level_encryption_id CloudfrontDistribution#field_level_encryption_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFieldLevelEncryptionId() {
        return null;
    }

    /**
     * forwarded_values block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#forwarded_values CloudfrontDistribution#forwarded_values}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues getForwardedValues() {
        return null;
    }

    /**
     * function_association block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#function_association CloudfrontDistribution#function_association}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFunctionAssociation() {
        return null;
    }

    /**
     * grpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#grpc_config CloudfrontDistribution#grpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorGrpcConfig getGrpcConfig() {
        return null;
    }

    /**
     * lambda_function_association block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#lambda_function_association CloudfrontDistribution#lambda_function_association}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLambdaFunctionAssociation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#max_ttl CloudfrontDistribution#max_ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxTtl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#min_ttl CloudfrontDistribution#min_ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinTtl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_request_policy_id CloudfrontDistribution#origin_request_policy_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOriginRequestPolicyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#realtime_log_config_arn CloudfrontDistribution#realtime_log_config_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRealtimeLogConfigArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#response_headers_policy_id CloudfrontDistribution#response_headers_policy_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResponseHeadersPolicyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#smooth_streaming CloudfrontDistribution#smooth_streaming}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSmoothStreaming() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#trusted_key_groups CloudfrontDistribution#trusted_key_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTrustedKeyGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#trusted_signers CloudfrontDistribution#trusted_signers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTrustedSigners() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontDistributionDefaultCacheBehavior}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontDistributionDefaultCacheBehavior}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontDistributionDefaultCacheBehavior> {
        java.util.List<java.lang.String> allowedMethods;
        java.util.List<java.lang.String> cachedMethods;
        java.lang.String targetOriginId;
        java.lang.String viewerProtocolPolicy;
        java.lang.String cachePolicyId;
        java.lang.Object compress;
        java.lang.Number defaultTtl;
        java.lang.String fieldLevelEncryptionId;
        imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues forwardedValues;
        java.lang.Object functionAssociation;
        imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorGrpcConfig grpcConfig;
        java.lang.Object lambdaFunctionAssociation;
        java.lang.Number maxTtl;
        java.lang.Number minTtl;
        java.lang.String originRequestPolicyId;
        java.lang.String realtimeLogConfigArn;
        java.lang.String responseHeadersPolicyId;
        java.lang.Object smoothStreaming;
        java.util.List<java.lang.String> trustedKeyGroups;
        java.util.List<java.lang.String> trustedSigners;

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getAllowedMethods}
         * @param allowedMethods Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#allowed_methods CloudfrontDistribution#allowed_methods}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowedMethods(java.util.List<java.lang.String> allowedMethods) {
            this.allowedMethods = allowedMethods;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getCachedMethods}
         * @param cachedMethods Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cached_methods CloudfrontDistribution#cached_methods}. This parameter is required.
         * @return {@code this}
         */
        public Builder cachedMethods(java.util.List<java.lang.String> cachedMethods) {
            this.cachedMethods = cachedMethods;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getTargetOriginId}
         * @param targetOriginId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#target_origin_id CloudfrontDistribution#target_origin_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetOriginId(java.lang.String targetOriginId) {
            this.targetOriginId = targetOriginId;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getViewerProtocolPolicy}
         * @param viewerProtocolPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#viewer_protocol_policy CloudfrontDistribution#viewer_protocol_policy}. This parameter is required.
         * @return {@code this}
         */
        public Builder viewerProtocolPolicy(java.lang.String viewerProtocolPolicy) {
            this.viewerProtocolPolicy = viewerProtocolPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getCachePolicyId}
         * @param cachePolicyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cache_policy_id CloudfrontDistribution#cache_policy_id}.
         * @return {@code this}
         */
        public Builder cachePolicyId(java.lang.String cachePolicyId) {
            this.cachePolicyId = cachePolicyId;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getCompress}
         * @param compress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#compress CloudfrontDistribution#compress}.
         * @return {@code this}
         */
        public Builder compress(java.lang.Boolean compress) {
            this.compress = compress;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getCompress}
         * @param compress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#compress CloudfrontDistribution#compress}.
         * @return {@code this}
         */
        public Builder compress(com.hashicorp.cdktf.IResolvable compress) {
            this.compress = compress;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getDefaultTtl}
         * @param defaultTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#default_ttl CloudfrontDistribution#default_ttl}.
         * @return {@code this}
         */
        public Builder defaultTtl(java.lang.Number defaultTtl) {
            this.defaultTtl = defaultTtl;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getFieldLevelEncryptionId}
         * @param fieldLevelEncryptionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#field_level_encryption_id CloudfrontDistribution#field_level_encryption_id}.
         * @return {@code this}
         */
        public Builder fieldLevelEncryptionId(java.lang.String fieldLevelEncryptionId) {
            this.fieldLevelEncryptionId = fieldLevelEncryptionId;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getForwardedValues}
         * @param forwardedValues forwarded_values block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#forwarded_values CloudfrontDistribution#forwarded_values}
         * @return {@code this}
         */
        public Builder forwardedValues(imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues forwardedValues) {
            this.forwardedValues = forwardedValues;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getFunctionAssociation}
         * @param functionAssociation function_association block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#function_association CloudfrontDistribution#function_association}
         * @return {@code this}
         */
        public Builder functionAssociation(com.hashicorp.cdktf.IResolvable functionAssociation) {
            this.functionAssociation = functionAssociation;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getFunctionAssociation}
         * @param functionAssociation function_association block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#function_association CloudfrontDistribution#function_association}
         * @return {@code this}
         */
        public Builder functionAssociation(java.util.List<? extends imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorFunctionAssociation> functionAssociation) {
            this.functionAssociation = functionAssociation;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getGrpcConfig}
         * @param grpcConfig grpc_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#grpc_config CloudfrontDistribution#grpc_config}
         * @return {@code this}
         */
        public Builder grpcConfig(imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorGrpcConfig grpcConfig) {
            this.grpcConfig = grpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getLambdaFunctionAssociation}
         * @param lambdaFunctionAssociation lambda_function_association block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#lambda_function_association CloudfrontDistribution#lambda_function_association}
         * @return {@code this}
         */
        public Builder lambdaFunctionAssociation(com.hashicorp.cdktf.IResolvable lambdaFunctionAssociation) {
            this.lambdaFunctionAssociation = lambdaFunctionAssociation;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getLambdaFunctionAssociation}
         * @param lambdaFunctionAssociation lambda_function_association block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#lambda_function_association CloudfrontDistribution#lambda_function_association}
         * @return {@code this}
         */
        public Builder lambdaFunctionAssociation(java.util.List<? extends imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorLambdaFunctionAssociation> lambdaFunctionAssociation) {
            this.lambdaFunctionAssociation = lambdaFunctionAssociation;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getMaxTtl}
         * @param maxTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#max_ttl CloudfrontDistribution#max_ttl}.
         * @return {@code this}
         */
        public Builder maxTtl(java.lang.Number maxTtl) {
            this.maxTtl = maxTtl;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getMinTtl}
         * @param minTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#min_ttl CloudfrontDistribution#min_ttl}.
         * @return {@code this}
         */
        public Builder minTtl(java.lang.Number minTtl) {
            this.minTtl = minTtl;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getOriginRequestPolicyId}
         * @param originRequestPolicyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_request_policy_id CloudfrontDistribution#origin_request_policy_id}.
         * @return {@code this}
         */
        public Builder originRequestPolicyId(java.lang.String originRequestPolicyId) {
            this.originRequestPolicyId = originRequestPolicyId;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getRealtimeLogConfigArn}
         * @param realtimeLogConfigArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#realtime_log_config_arn CloudfrontDistribution#realtime_log_config_arn}.
         * @return {@code this}
         */
        public Builder realtimeLogConfigArn(java.lang.String realtimeLogConfigArn) {
            this.realtimeLogConfigArn = realtimeLogConfigArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getResponseHeadersPolicyId}
         * @param responseHeadersPolicyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#response_headers_policy_id CloudfrontDistribution#response_headers_policy_id}.
         * @return {@code this}
         */
        public Builder responseHeadersPolicyId(java.lang.String responseHeadersPolicyId) {
            this.responseHeadersPolicyId = responseHeadersPolicyId;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getSmoothStreaming}
         * @param smoothStreaming Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#smooth_streaming CloudfrontDistribution#smooth_streaming}.
         * @return {@code this}
         */
        public Builder smoothStreaming(java.lang.Boolean smoothStreaming) {
            this.smoothStreaming = smoothStreaming;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getSmoothStreaming}
         * @param smoothStreaming Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#smooth_streaming CloudfrontDistribution#smooth_streaming}.
         * @return {@code this}
         */
        public Builder smoothStreaming(com.hashicorp.cdktf.IResolvable smoothStreaming) {
            this.smoothStreaming = smoothStreaming;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getTrustedKeyGroups}
         * @param trustedKeyGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#trusted_key_groups CloudfrontDistribution#trusted_key_groups}.
         * @return {@code this}
         */
        public Builder trustedKeyGroups(java.util.List<java.lang.String> trustedKeyGroups) {
            this.trustedKeyGroups = trustedKeyGroups;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionDefaultCacheBehavior#getTrustedSigners}
         * @param trustedSigners Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#trusted_signers CloudfrontDistribution#trusted_signers}.
         * @return {@code this}
         */
        public Builder trustedSigners(java.util.List<java.lang.String> trustedSigners) {
            this.trustedSigners = trustedSigners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontDistributionDefaultCacheBehavior}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontDistributionDefaultCacheBehavior build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontDistributionDefaultCacheBehavior}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontDistributionDefaultCacheBehavior {
        private final java.util.List<java.lang.String> allowedMethods;
        private final java.util.List<java.lang.String> cachedMethods;
        private final java.lang.String targetOriginId;
        private final java.lang.String viewerProtocolPolicy;
        private final java.lang.String cachePolicyId;
        private final java.lang.Object compress;
        private final java.lang.Number defaultTtl;
        private final java.lang.String fieldLevelEncryptionId;
        private final imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues forwardedValues;
        private final java.lang.Object functionAssociation;
        private final imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorGrpcConfig grpcConfig;
        private final java.lang.Object lambdaFunctionAssociation;
        private final java.lang.Number maxTtl;
        private final java.lang.Number minTtl;
        private final java.lang.String originRequestPolicyId;
        private final java.lang.String realtimeLogConfigArn;
        private final java.lang.String responseHeadersPolicyId;
        private final java.lang.Object smoothStreaming;
        private final java.util.List<java.lang.String> trustedKeyGroups;
        private final java.util.List<java.lang.String> trustedSigners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowedMethods = software.amazon.jsii.Kernel.get(this, "allowedMethods", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cachedMethods = software.amazon.jsii.Kernel.get(this, "cachedMethods", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.targetOriginId = software.amazon.jsii.Kernel.get(this, "targetOriginId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.viewerProtocolPolicy = software.amazon.jsii.Kernel.get(this, "viewerProtocolPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cachePolicyId = software.amazon.jsii.Kernel.get(this, "cachePolicyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.compress = software.amazon.jsii.Kernel.get(this, "compress", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.defaultTtl = software.amazon.jsii.Kernel.get(this, "defaultTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.fieldLevelEncryptionId = software.amazon.jsii.Kernel.get(this, "fieldLevelEncryptionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.forwardedValues = software.amazon.jsii.Kernel.get(this, "forwardedValues", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues.class));
            this.functionAssociation = software.amazon.jsii.Kernel.get(this, "functionAssociation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.grpcConfig = software.amazon.jsii.Kernel.get(this, "grpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorGrpcConfig.class));
            this.lambdaFunctionAssociation = software.amazon.jsii.Kernel.get(this, "lambdaFunctionAssociation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maxTtl = software.amazon.jsii.Kernel.get(this, "maxTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minTtl = software.amazon.jsii.Kernel.get(this, "minTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.originRequestPolicyId = software.amazon.jsii.Kernel.get(this, "originRequestPolicyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.realtimeLogConfigArn = software.amazon.jsii.Kernel.get(this, "realtimeLogConfigArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.responseHeadersPolicyId = software.amazon.jsii.Kernel.get(this, "responseHeadersPolicyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.smoothStreaming = software.amazon.jsii.Kernel.get(this, "smoothStreaming", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.trustedKeyGroups = software.amazon.jsii.Kernel.get(this, "trustedKeyGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.trustedSigners = software.amazon.jsii.Kernel.get(this, "trustedSigners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowedMethods = java.util.Objects.requireNonNull(builder.allowedMethods, "allowedMethods is required");
            this.cachedMethods = java.util.Objects.requireNonNull(builder.cachedMethods, "cachedMethods is required");
            this.targetOriginId = java.util.Objects.requireNonNull(builder.targetOriginId, "targetOriginId is required");
            this.viewerProtocolPolicy = java.util.Objects.requireNonNull(builder.viewerProtocolPolicy, "viewerProtocolPolicy is required");
            this.cachePolicyId = builder.cachePolicyId;
            this.compress = builder.compress;
            this.defaultTtl = builder.defaultTtl;
            this.fieldLevelEncryptionId = builder.fieldLevelEncryptionId;
            this.forwardedValues = builder.forwardedValues;
            this.functionAssociation = builder.functionAssociation;
            this.grpcConfig = builder.grpcConfig;
            this.lambdaFunctionAssociation = builder.lambdaFunctionAssociation;
            this.maxTtl = builder.maxTtl;
            this.minTtl = builder.minTtl;
            this.originRequestPolicyId = builder.originRequestPolicyId;
            this.realtimeLogConfigArn = builder.realtimeLogConfigArn;
            this.responseHeadersPolicyId = builder.responseHeadersPolicyId;
            this.smoothStreaming = builder.smoothStreaming;
            this.trustedKeyGroups = builder.trustedKeyGroups;
            this.trustedSigners = builder.trustedSigners;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedMethods() {
            return this.allowedMethods;
        }

        @Override
        public final java.util.List<java.lang.String> getCachedMethods() {
            return this.cachedMethods;
        }

        @Override
        public final java.lang.String getTargetOriginId() {
            return this.targetOriginId;
        }

        @Override
        public final java.lang.String getViewerProtocolPolicy() {
            return this.viewerProtocolPolicy;
        }

        @Override
        public final java.lang.String getCachePolicyId() {
            return this.cachePolicyId;
        }

        @Override
        public final java.lang.Object getCompress() {
            return this.compress;
        }

        @Override
        public final java.lang.Number getDefaultTtl() {
            return this.defaultTtl;
        }

        @Override
        public final java.lang.String getFieldLevelEncryptionId() {
            return this.fieldLevelEncryptionId;
        }

        @Override
        public final imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues getForwardedValues() {
            return this.forwardedValues;
        }

        @Override
        public final java.lang.Object getFunctionAssociation() {
            return this.functionAssociation;
        }

        @Override
        public final imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorGrpcConfig getGrpcConfig() {
            return this.grpcConfig;
        }

        @Override
        public final java.lang.Object getLambdaFunctionAssociation() {
            return this.lambdaFunctionAssociation;
        }

        @Override
        public final java.lang.Number getMaxTtl() {
            return this.maxTtl;
        }

        @Override
        public final java.lang.Number getMinTtl() {
            return this.minTtl;
        }

        @Override
        public final java.lang.String getOriginRequestPolicyId() {
            return this.originRequestPolicyId;
        }

        @Override
        public final java.lang.String getRealtimeLogConfigArn() {
            return this.realtimeLogConfigArn;
        }

        @Override
        public final java.lang.String getResponseHeadersPolicyId() {
            return this.responseHeadersPolicyId;
        }

        @Override
        public final java.lang.Object getSmoothStreaming() {
            return this.smoothStreaming;
        }

        @Override
        public final java.util.List<java.lang.String> getTrustedKeyGroups() {
            return this.trustedKeyGroups;
        }

        @Override
        public final java.util.List<java.lang.String> getTrustedSigners() {
            return this.trustedSigners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("allowedMethods", om.valueToTree(this.getAllowedMethods()));
            data.set("cachedMethods", om.valueToTree(this.getCachedMethods()));
            data.set("targetOriginId", om.valueToTree(this.getTargetOriginId()));
            data.set("viewerProtocolPolicy", om.valueToTree(this.getViewerProtocolPolicy()));
            if (this.getCachePolicyId() != null) {
                data.set("cachePolicyId", om.valueToTree(this.getCachePolicyId()));
            }
            if (this.getCompress() != null) {
                data.set("compress", om.valueToTree(this.getCompress()));
            }
            if (this.getDefaultTtl() != null) {
                data.set("defaultTtl", om.valueToTree(this.getDefaultTtl()));
            }
            if (this.getFieldLevelEncryptionId() != null) {
                data.set("fieldLevelEncryptionId", om.valueToTree(this.getFieldLevelEncryptionId()));
            }
            if (this.getForwardedValues() != null) {
                data.set("forwardedValues", om.valueToTree(this.getForwardedValues()));
            }
            if (this.getFunctionAssociation() != null) {
                data.set("functionAssociation", om.valueToTree(this.getFunctionAssociation()));
            }
            if (this.getGrpcConfig() != null) {
                data.set("grpcConfig", om.valueToTree(this.getGrpcConfig()));
            }
            if (this.getLambdaFunctionAssociation() != null) {
                data.set("lambdaFunctionAssociation", om.valueToTree(this.getLambdaFunctionAssociation()));
            }
            if (this.getMaxTtl() != null) {
                data.set("maxTtl", om.valueToTree(this.getMaxTtl()));
            }
            if (this.getMinTtl() != null) {
                data.set("minTtl", om.valueToTree(this.getMinTtl()));
            }
            if (this.getOriginRequestPolicyId() != null) {
                data.set("originRequestPolicyId", om.valueToTree(this.getOriginRequestPolicyId()));
            }
            if (this.getRealtimeLogConfigArn() != null) {
                data.set("realtimeLogConfigArn", om.valueToTree(this.getRealtimeLogConfigArn()));
            }
            if (this.getResponseHeadersPolicyId() != null) {
                data.set("responseHeadersPolicyId", om.valueToTree(this.getResponseHeadersPolicyId()));
            }
            if (this.getSmoothStreaming() != null) {
                data.set("smoothStreaming", om.valueToTree(this.getSmoothStreaming()));
            }
            if (this.getTrustedKeyGroups() != null) {
                data.set("trustedKeyGroups", om.valueToTree(this.getTrustedKeyGroups()));
            }
            if (this.getTrustedSigners() != null) {
                data.set("trustedSigners", om.valueToTree(this.getTrustedSigners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontDistribution.CloudfrontDistributionDefaultCacheBehavior"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontDistributionDefaultCacheBehavior.Jsii$Proxy that = (CloudfrontDistributionDefaultCacheBehavior.Jsii$Proxy) o;

            if (!allowedMethods.equals(that.allowedMethods)) return false;
            if (!cachedMethods.equals(that.cachedMethods)) return false;
            if (!targetOriginId.equals(that.targetOriginId)) return false;
            if (!viewerProtocolPolicy.equals(that.viewerProtocolPolicy)) return false;
            if (this.cachePolicyId != null ? !this.cachePolicyId.equals(that.cachePolicyId) : that.cachePolicyId != null) return false;
            if (this.compress != null ? !this.compress.equals(that.compress) : that.compress != null) return false;
            if (this.defaultTtl != null ? !this.defaultTtl.equals(that.defaultTtl) : that.defaultTtl != null) return false;
            if (this.fieldLevelEncryptionId != null ? !this.fieldLevelEncryptionId.equals(that.fieldLevelEncryptionId) : that.fieldLevelEncryptionId != null) return false;
            if (this.forwardedValues != null ? !this.forwardedValues.equals(that.forwardedValues) : that.forwardedValues != null) return false;
            if (this.functionAssociation != null ? !this.functionAssociation.equals(that.functionAssociation) : that.functionAssociation != null) return false;
            if (this.grpcConfig != null ? !this.grpcConfig.equals(that.grpcConfig) : that.grpcConfig != null) return false;
            if (this.lambdaFunctionAssociation != null ? !this.lambdaFunctionAssociation.equals(that.lambdaFunctionAssociation) : that.lambdaFunctionAssociation != null) return false;
            if (this.maxTtl != null ? !this.maxTtl.equals(that.maxTtl) : that.maxTtl != null) return false;
            if (this.minTtl != null ? !this.minTtl.equals(that.minTtl) : that.minTtl != null) return false;
            if (this.originRequestPolicyId != null ? !this.originRequestPolicyId.equals(that.originRequestPolicyId) : that.originRequestPolicyId != null) return false;
            if (this.realtimeLogConfigArn != null ? !this.realtimeLogConfigArn.equals(that.realtimeLogConfigArn) : that.realtimeLogConfigArn != null) return false;
            if (this.responseHeadersPolicyId != null ? !this.responseHeadersPolicyId.equals(that.responseHeadersPolicyId) : that.responseHeadersPolicyId != null) return false;
            if (this.smoothStreaming != null ? !this.smoothStreaming.equals(that.smoothStreaming) : that.smoothStreaming != null) return false;
            if (this.trustedKeyGroups != null ? !this.trustedKeyGroups.equals(that.trustedKeyGroups) : that.trustedKeyGroups != null) return false;
            return this.trustedSigners != null ? this.trustedSigners.equals(that.trustedSigners) : that.trustedSigners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowedMethods.hashCode();
            result = 31 * result + (this.cachedMethods.hashCode());
            result = 31 * result + (this.targetOriginId.hashCode());
            result = 31 * result + (this.viewerProtocolPolicy.hashCode());
            result = 31 * result + (this.cachePolicyId != null ? this.cachePolicyId.hashCode() : 0);
            result = 31 * result + (this.compress != null ? this.compress.hashCode() : 0);
            result = 31 * result + (this.defaultTtl != null ? this.defaultTtl.hashCode() : 0);
            result = 31 * result + (this.fieldLevelEncryptionId != null ? this.fieldLevelEncryptionId.hashCode() : 0);
            result = 31 * result + (this.forwardedValues != null ? this.forwardedValues.hashCode() : 0);
            result = 31 * result + (this.functionAssociation != null ? this.functionAssociation.hashCode() : 0);
            result = 31 * result + (this.grpcConfig != null ? this.grpcConfig.hashCode() : 0);
            result = 31 * result + (this.lambdaFunctionAssociation != null ? this.lambdaFunctionAssociation.hashCode() : 0);
            result = 31 * result + (this.maxTtl != null ? this.maxTtl.hashCode() : 0);
            result = 31 * result + (this.minTtl != null ? this.minTtl.hashCode() : 0);
            result = 31 * result + (this.originRequestPolicyId != null ? this.originRequestPolicyId.hashCode() : 0);
            result = 31 * result + (this.realtimeLogConfigArn != null ? this.realtimeLogConfigArn.hashCode() : 0);
            result = 31 * result + (this.responseHeadersPolicyId != null ? this.responseHeadersPolicyId.hashCode() : 0);
            result = 31 * result + (this.smoothStreaming != null ? this.smoothStreaming.hashCode() : 0);
            result = 31 * result + (this.trustedKeyGroups != null ? this.trustedKeyGroups.hashCode() : 0);
            result = 31 * result + (this.trustedSigners != null ? this.trustedSigners.hashCode() : 0);
            return result;
        }
    }
}
