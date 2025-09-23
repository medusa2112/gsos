#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/gsos-api-stack.js';
import { DataStack } from '../lib/gsos-data-stack.js';
import { AuthStack } from '../lib/gsos-auth-stack.js';

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const data = new DataStack(app, 'GSOS-Data', { env });
const auth = new AuthStack(app, 'GSOS-Auth', { env });
new ApiStack(app, 'GSOS-Api', { env, data, auth });
