#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ComicSiteStack } from '../lib/self-hosted-comic-site-stack';

const app = new cdk.App();
new ComicSiteStack(app, 'ComicSiteStack', {
	env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});