import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Campaign_Key {
  id: UUIDString;
  __typename?: 'Campaign_Key';
}

export interface CreatePlatformData {
  platform_insert: Platform_Key;
}

export interface CreatePlatformVariables {
  name: string;
  apiType: string;
}

export interface GetUserInsightsData {
  insights: ({
    content: string;
    type: string;
    generatedAt: TimestampString;
  })[];
}

export interface GetUserInsightsVariables {
  campaignId: UUIDString;
}

export interface Insight_Key {
  id: UUIDString;
  __typename?: 'Insight_Key';
}

export interface ListAllCampaignsData {
  campaigns: ({
    id: UUIDString;
    name: string;
    budget: number;
    platform: {
      name: string;
      apiType: string;
    };
  } & Campaign_Key)[];
}

export interface Metric_Key {
  id: UUIDString;
  __typename?: 'Metric_Key';
}

export interface Platform_Key {
  id: UUIDString;
  __typename?: 'Platform_Key';
}

export interface Report_Key {
  id: UUIDString;
  __typename?: 'Report_Key';
}

export interface UpdateCampaignBudgetData {
  campaign_update?: Campaign_Key | null;
}

export interface UpdateCampaignBudgetVariables {
  id: UUIDString;
  newBudget: number;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListAllCampaignsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllCampaignsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllCampaignsData, undefined>;
  operationName: string;
}
export const listAllCampaignsRef: ListAllCampaignsRef;

export function listAllCampaigns(options?: ExecuteQueryOptions): QueryPromise<ListAllCampaignsData, undefined>;
export function listAllCampaigns(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllCampaignsData, undefined>;

interface GetUserInsightsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserInsightsVariables): QueryRef<GetUserInsightsData, GetUserInsightsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserInsightsVariables): QueryRef<GetUserInsightsData, GetUserInsightsVariables>;
  operationName: string;
}
export const getUserInsightsRef: GetUserInsightsRef;

export function getUserInsights(vars: GetUserInsightsVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserInsightsData, GetUserInsightsVariables>;
export function getUserInsights(dc: DataConnect, vars: GetUserInsightsVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserInsightsData, GetUserInsightsVariables>;

interface CreatePlatformRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePlatformVariables): MutationRef<CreatePlatformData, CreatePlatformVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePlatformVariables): MutationRef<CreatePlatformData, CreatePlatformVariables>;
  operationName: string;
}
export const createPlatformRef: CreatePlatformRef;

export function createPlatform(vars: CreatePlatformVariables): MutationPromise<CreatePlatformData, CreatePlatformVariables>;
export function createPlatform(dc: DataConnect, vars: CreatePlatformVariables): MutationPromise<CreatePlatformData, CreatePlatformVariables>;

interface UpdateCampaignBudgetRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCampaignBudgetVariables): MutationRef<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCampaignBudgetVariables): MutationRef<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;
  operationName: string;
}
export const updateCampaignBudgetRef: UpdateCampaignBudgetRef;

export function updateCampaignBudget(vars: UpdateCampaignBudgetVariables): MutationPromise<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;
export function updateCampaignBudget(dc: DataConnect, vars: UpdateCampaignBudgetVariables): MutationPromise<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;

