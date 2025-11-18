# Self-Hosted Comic Site

A serverless comic website platform built with React, TypeScript, and AWS CDK. Designed for individual comic artists to easily deploy and manage their own comic site.

## Project Overview

This project enables comic artists to host their comics on AWS with:
- **Artist-First Design**: Streamlined upload workflow optimized for iPad
- **Serverless Architecture**: 100% managed AWS services (S3, DynamoDB, Lambda, CloudFront, Cognito)
- **Cost-Conscious**: Target hosting cost of $3.50-7.50/month
- **Simple Deployment**: Single command deployment via AWS CDK

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: AWS Lambda functions with TypeScript
- **Database**: DynamoDB with GSIs for efficient querying
- **Storage**: S3 for comic images and static assets
- **CDN**: CloudFront for global content delivery
- **Authentication**: Cognito for artist login

## Prerequisites

- **Node.js**: v20.17.0 or higher
- **npm**: v10.9.1 or higher
- **AWS CLI**: Configured with appropriate credentials
- **AWS CDK**: v2.x installed globally (`npm install -g aws-cdk`)

## Project Structure

```
self-hosted-comic-site/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── auth/          # Authentication logic
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   ├── hooks/         # Custom React hooks
│   │   ├── validation/    # Zod validation schemas
│   │   └── styles/        # CSS and style files
│   ├── vite.config.ts     # Vite configuration
│   └── package.json       # Frontend dependencies
├── lib/                   # CDK stack definition
├── lambda/                # Lambda function code (TypeScript)
├── shared/                # Shared code between frontend and backend
├── specs/                 # Feature specifications
├── plans/                 # Implementation plans
└── tasks/                 # Task breakdowns
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd self-hosted-comic-site
```

### 2. Install CDK Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` with your AWS resource values (these will be available after first deployment).

## Local Development

### Running the Frontend Dev Server

```bash
cd frontend
npm run dev
```

The development server will start at `http://localhost:3000` with hot module replacement enabled.

### Frontend Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check code formatting
npm run format:check
```

### Code Quality

The project uses ESLint and Prettier for code quality:
- **ESLint**: Enforces TypeScript and React best practices
- **Prettier**: Ensures consistent code formatting
- **Configuration**: Single quotes, no semicolons, 100 char line width

## Deployment

### First-Time Deployment

1. **Build the Frontend**:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

2. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap
   ```

3. **Deploy the Stack**:
   ```bash
   cdk deploy
   ```

4. **Note Output Values**: After deployment, save the output values (UserPoolId, ClientId, Distribution URL, etc.)

5. **Update Frontend Environment**: Add the output values to `frontend/.env`

6. **Rebuild and Redeploy**:
   ```bash
   cd frontend
   npm run build
   cd ..
   cdk deploy
   ```

### Subsequent Deployments

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Deploy to AWS
cdk deploy
```

### CDK Commands

```bash
# Show differences between deployed and local state
cdk diff

# Synthesize CloudFormation template
cdk synth

# Deploy stack
cdk deploy

# Destroy stack (WARNING: Deletes all resources)
cdk destroy
```

## Development Workflow

### Creating New Components

1. Create component file in `frontend/src/components/`
2. Use TypeScript with proper type definitions
3. Import using path aliases (e.g., `@components/MyComponent`)
4. Add tests if applicable

### Path Aliases

The project uses path aliases for clean imports:

```typescript
import { MyComponent } from '@components/MyComponent'
import { useAuth } from '@hooks/useAuth'
import { ComicType } from '@types/comic'
import { validateComic } from '@validation/comic.schema'
```

Available aliases:
- `@/` → `src/`
- `@components/` → `src/components/`
- `@pages/` → `src/pages/`
- `@utils/` → `src/utils/`
- `@types/` → `src/types/`
- `@hooks/` → `src/hooks/`
- `@auth/` → `src/auth/`
- `@validation/` → `src/validation/`
- `@styles/` → `src/styles/`

## AWS Resources Created

The CDK stack creates the following resources:

- **S3 Buckets**:
  - Comic images bucket (with CORS enabled)
  - Website static assets bucket
  
- **DynamoDB Table**:
  - Comics table with GSIs for slug, title, and tag lookups
  
- **CloudFront Distribution**:
  - Global CDN for website and API
  - SPA routing configured (404 → index.html)
  
- **Cognito**:
  - User Pool for artist authentication
  - Identity Pool for AWS credential management
  
- **Lambda Functions**:
  - getComics: List comics with pagination
  - getComic: Retrieve single comic with relationships
  - processUpload: Handle comic uploads
  - manageS3Cache: CloudFront cache invalidation

## Constitutional Principles

This project adheres to four core principles:

1. **Artist-First**: All decisions prioritize the comic artist's ease of use
2. **Serverless-First**: Use managed AWS services, no servers to maintain
3. **Cost-Conscious**: Target $10/month or less for hosting costs
4. **Deployment Simplicity**: Single command deployment process

## Troubleshooting

### Frontend Won't Start

- Ensure Node.js version is 20.17.0 or higher
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Check for port conflicts (default port is 3000)

### CDK Deploy Fails

- Ensure AWS credentials are configured: `aws configure`
- Check that CDK is bootstrapped: `cdk bootstrap`
- Verify frontend build exists: `ls frontend/dist`

### Build Errors

- Clear Vite cache: `rm -rf frontend/node_modules/.vite`
- Rebuild: `cd frontend && npm run build`

## Contributing

This project is designed for a single comic artist's site. However, contributions to improve the platform are welcome through pull requests.

## License

See LICENSE file for details.

## Support

For issues or questions, please file an issue in the GitHub repository.
