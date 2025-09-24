# GSOS Deployment Guide

## Overview

This project uses a hybrid deployment approach:
- **Frontend Apps**: Deployed to Vercel (Web and Admin apps)
- **Backend Infrastructure**: Deployed to AWS via CDK (API and Infrastructure)

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Vercel CLI** installed and authenticated
3. **Node.js** and **pnpm** installed
4. Environment variables configured

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the environment variables:
   - `AWS_PROFILE`: Your AWS profile name
   - `AWS_REGION`: Your preferred AWS region
   - `TRAY_WEBHOOK_SECRET`: Secret for Tray webhook validation
   - `NEXT_PUBLIC_API_BASE`: Will be set after AWS deployment

## Deployment Steps

### 1. Deploy AWS Infrastructure

Deploy the API and infrastructure to AWS:

```bash
pnpm infra:deploy
```

This will:
- Deploy the DynamoDB table for schools and students
- Deploy Lambda functions for API endpoints
- Deploy API Gateway
- Set up authentication with Cognito

After deployment, note the API Gateway URL from the output.

### 2. Update Environment Variables

Update your `.env` file with the API Gateway URL:
```bash
NEXT_PUBLIC_API_BASE=https://your-api-id.execute-api.eu-west-2.amazonaws.com
```

### 3. Deploy Frontend Apps to Vercel

#### Web App
```bash
cd apps/web
vercel --prod
```

#### Admin App
```bash
cd apps/admin
vercel --prod
```

### 4. Configure Vercel Environment Variables

In your Vercel project settings, add the environment variable:
- `NEXT_PUBLIC_API_BASE`: Your API Gateway URL

## Available Scripts

- `pnpm infra:deploy` - Deploy AWS infrastructure
- `pnpm infra:synth` - Synthesize CDK templates
- `pnpm infra:destroy` - Destroy AWS infrastructure
- `pnpm build` - Build all packages
- `pnpm dev` - Start development servers

## Project Structure

```
gsos/
├── apps/
│   ├── web/          # Web application (Vercel)
│   └── admin/        # Admin application (Vercel)
├── services/
│   └── api/          # Lambda functions (AWS)
├── infra/
│   └── cdk/          # AWS CDK infrastructure
└── packages/
    ├── types/        # Shared TypeScript types
    ├── ui/           # Shared UI components
    └── utils/        # Shared utilities
```

## API Endpoints

After deployment, the following endpoints will be available:

- `GET /health` - Health check
- `POST /tray/webhook` - Tray webhook handler
- `GET /students` - List all students
- `POST /students` - Create a new student
- `GET /students/{id}` - Get a specific student
- `PUT /students/{id}` - Update a specific student
- `DELETE /students/{id}` - Delete a specific student

## Troubleshooting

1. **CDK Deployment Issues**: Ensure AWS credentials are properly configured
2. **Vercel Build Issues**: Check that monorepo build commands are working locally
3. **API Gateway Issues**: Verify Lambda functions are deployed and have proper permissions
4. **Environment Variables**: Ensure all required environment variables are set in both local and Vercel environments