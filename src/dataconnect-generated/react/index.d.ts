import { ListAllCampaignsData, GetUserInsightsData, GetUserInsightsVariables, CreatePlatformData, CreatePlatformVariables, UpdateCampaignBudgetData, UpdateCampaignBudgetVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListAllCampaigns(options?: useDataConnectQueryOptions<ListAllCampaignsData>): UseDataConnectQueryResult<ListAllCampaignsData, undefined>;
export function useListAllCampaigns(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllCampaignsData>): UseDataConnectQueryResult<ListAllCampaignsData, undefined>;

export function useGetUserInsights(vars: GetUserInsightsVariables, options?: useDataConnectQueryOptions<GetUserInsightsData>): UseDataConnectQueryResult<GetUserInsightsData, GetUserInsightsVariables>;
export function useGetUserInsights(dc: DataConnect, vars: GetUserInsightsVariables, options?: useDataConnectQueryOptions<GetUserInsightsData>): UseDataConnectQueryResult<GetUserInsightsData, GetUserInsightsVariables>;

export function useCreatePlatform(options?: useDataConnectMutationOptions<CreatePlatformData, FirebaseError, CreatePlatformVariables>): UseDataConnectMutationResult<CreatePlatformData, CreatePlatformVariables>;
export function useCreatePlatform(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePlatformData, FirebaseError, CreatePlatformVariables>): UseDataConnectMutationResult<CreatePlatformData, CreatePlatformVariables>;

export function useUpdateCampaignBudget(options?: useDataConnectMutationOptions<UpdateCampaignBudgetData, FirebaseError, UpdateCampaignBudgetVariables>): UseDataConnectMutationResult<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;
export function useUpdateCampaignBudget(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCampaignBudgetData, FirebaseError, UpdateCampaignBudgetVariables>): UseDataConnectMutationResult<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;
