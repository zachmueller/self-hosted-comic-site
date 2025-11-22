# AWS CLI Usage Standards

## Profile Configuration

**MANDATORY:** All AWS CLI commands in this project must use the `comics` profile.

### Standard Profile Usage
```bash
aws <command> --profile comics
```

## CDK Operations

### Profile Integration with CDK
All CDK commands must specify the profile either via environment variable or CLI option:

**Preferred Method (Environment Variable):**
```bash
export AWS_PROFILE=comics
cdk deploy
cdk diff
cdk synth
```

**Alternative Method (CLI Option):**
```bash
cdk deploy --profile comics
cdk diff --profile comics
```

## Stack-Specific Context

### Stack Information
- **Stack Name**: `ComicSiteStack-v2`
- **Account**: Derived from `CDK_DEFAULT_ACCOUNT`
- **Region**: Derived from `CDK_DEFAULT_REGION`

### Stack Operations
When referencing the stack in AWS CLI commands:
```bash
aws cloudformation describe-stacks \
  --stack-name ComicSiteStack-v2 \
  --profile comics

aws cloudformation list-stack-resources \
  --stack-name ComicSiteStack-v2 \
  --profile comics
```

## Common AWS Operations

### S3 Operations
```bash
# List comic images bucket
aws s3 ls s3://<comic-bucket-name> --profile comics

# List static assets bucket
aws s3 ls s3://<website-bucket-name> --profile comics

# Sync frontend build to S3
aws s3 sync frontend/dist/ s3://<website-bucket-name> --profile comics
```

### DynamoDB Operations
```bash
# List tables
aws dynamodb list-tables --profile comics

# Scan comics table
aws dynamodb scan \
  --table-name <comics-table-name> \
  --profile comics

# Query with GSI
aws dynamodb query \
  --table-name <comics-table-name> \
  --index-name <gsi-name> \
  --profile comics
```

### Lambda Operations
```bash
# List Lambda functions
aws lambda list-functions --profile comics

# Invoke Lambda function (testing)
aws lambda invoke \
  --function-name <function-name> \
  --payload '{"key":"value"}' \
  --profile comics \
  response.json

# View Lambda logs
aws logs tail /aws/lambda/<function-name> \
  --follow \
  --profile comics
```

### CloudFront Operations
```bash
# List distributions
aws cloudfront list-distributions --profile comics

# Create invalidation (cache clear)
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*" \
  --profile comics
```

### Cognito Operations
```bash
# Describe user pool
aws cognito-idp describe-user-pool \
  --user-pool-id <pool-id> \
  --profile comics

# List users
aws cognito-idp list-users \
  --user-pool-id <pool-id> \
  --profile comics

# Create user (artist account)
aws cognito-idp admin-create-user \
  --user-pool-id <pool-id> \
  --username <email> \
  --profile comics
```

## Resource Identification

### Finding Stack Resources
Before running AWS CLI commands, identify resource names:

```bash
# Get all resources in the stack
aws cloudformation list-stack-resources \
  --stack-name ComicSiteStack-v2 \
  --profile comics \
  --query 'StackResourceSummaries[*].[LogicalResourceId,PhysicalResourceId,ResourceType]' \
  --output table

# Get specific resource by logical ID
aws cloudformation describe-stack-resource \
  --stack-name ComicSiteStack-v2 \
  --logical-resource-id <logical-id> \
  --profile comics \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text
```

## Account and Region Verification

### Pre-Deployment Checks
Always verify the correct account and region before deployment:

```bash
# Verify current account
aws sts get-caller-identity --profile comics

# Verify default region
aws configure get region --profile comics

# List available regions for a service
aws ec2 describe-regions \
  --profile comics \
  --query 'Regions[*].RegionName' \
  --output table
```

## Security Best Practices

### Credential Management
- **Never** commit AWS credentials to the repository
- **Never** include credentials in command examples
- **Never** log or display credential information
- Profile credentials should be stored in `~/.aws/credentials`
- Profile configuration should be in `~/.aws/config`

### IAM Permissions
Ensure the `comics` profile has appropriate permissions for:
- CloudFormation (full stack operations)
- S3 (bucket operations for comic and website buckets)
- DynamoDB (table operations)
- Lambda (function management and invocation)
- CloudFront (distribution and invalidation)
- Cognito (user pool management)
- CloudWatch Logs (log access)
- IAM (for CDK-created roles)

## Troubleshooting

### Profile Not Found
If AWS CLI cannot find the `comics` profile:
```bash
# List available profiles
aws configure list-profiles

# Configure the comics profile
aws configure --profile comics
```

### Permission Denied
Verify IAM permissions for the profile:
```bash
# Check caller identity
aws sts get-caller-identity --profile comics

# Test S3 access
aws s3 ls --profile comics

# View IAM user policies (if using IAM user)
aws iam list-attached-user-policies \
  --user-name <username> \
  --profile comics
```

### Region Issues
If commands fail due to region mismatch:
```bash
# Check configured region
aws configure get region --profile comics

# Override region for specific command
aws <service> <command> \
  --region us-east-1 \
  --profile comics
```

## Integration with Development Workflow

### Pre-Deployment Workflow
```bash
# 1. Verify AWS profile
aws sts get-caller-identity --profile comics

# 2. Build frontend
cd frontend && npm run build && cd ..

# 3. Deploy with profile
export AWS_PROFILE=comics
cdk deploy

# 4. Verify deployment
aws cloudformation describe-stacks \
  --stack-name ComicSiteStack-v2 \
  --profile comics \
  --query 'Stacks[0].StackStatus'
```

### Post-Deployment Verification
```bash
# Get CloudFront distribution URL
aws cloudformation describe-stacks \
  --stack-name ComicSiteStack-v2 \
  --profile comics \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionUrl`].OutputValue' \
  --output text

# Check Lambda function status
aws lambda list-functions \
  --profile comics \
  --query 'Functions[?starts_with(FunctionName, `ComicSiteStack`)].[FunctionName,Runtime,LastModified]' \
  --output table
```

## Command Execution Guidelines

### When Using execute_command Tool
- **Always include** `--profile comics` in AWS CLI commands
- **Verify** the command targets the correct stack (ComicSiteStack-v2)
- **Consider** cost implications before running commands that create resources
- **Check** region context for commands that require specific regions
- **Document** any manual AWS operations in commit messages

### CDK Command Requirements
- Set `AWS_PROFILE=comics` environment variable before CDK operations
- Alternative: Use `--profile comics` flag with CDK commands
- Verify CDK version compatibility before deploying
- Always run `cdk diff` before `cdk deploy` for safety

### Profile Override Prevention
- **Never** override the `comics` profile with other profiles
- **Never** use default AWS credentials for this project
- **Always** explicitly specify the profile in documentation and commands
- **Ensure** CI/CD pipelines (if added) use the correct profile
