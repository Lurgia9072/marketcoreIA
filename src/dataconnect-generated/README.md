# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListAllCampaigns*](#listallcampaigns)
  - [*GetUserInsights*](#getuserinsights)
- [**Mutations**](#mutations)
  - [*CreatePlatform*](#createplatform)
  - [*UpdateCampaignBudget*](#updatecampaignbudget)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListAllCampaigns
You can execute the `ListAllCampaigns` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllCampaigns(options?: ExecuteQueryOptions): QueryPromise<ListAllCampaignsData, undefined>;

interface ListAllCampaignsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllCampaignsData, undefined>;
}
export const listAllCampaignsRef: ListAllCampaignsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllCampaigns(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllCampaignsData, undefined>;

interface ListAllCampaignsRef {
  ...
  (dc: DataConnect): QueryRef<ListAllCampaignsData, undefined>;
}
export const listAllCampaignsRef: ListAllCampaignsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllCampaignsRef:
```typescript
const name = listAllCampaignsRef.operationName;
console.log(name);
```

### Variables
The `ListAllCampaigns` query has no variables.
### Return Type
Recall that executing the `ListAllCampaigns` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllCampaignsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListAllCampaigns`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllCampaigns } from '@dataconnect/generated';


// Call the `listAllCampaigns()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllCampaigns();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllCampaigns(dataConnect);

console.log(data.campaigns);

// Or, you can use the `Promise` API.
listAllCampaigns().then((response) => {
  const data = response.data;
  console.log(data.campaigns);
});
```

### Using `ListAllCampaigns`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllCampaignsRef } from '@dataconnect/generated';


// Call the `listAllCampaignsRef()` function to get a reference to the query.
const ref = listAllCampaignsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllCampaignsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.campaigns);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.campaigns);
});
```

## GetUserInsights
You can execute the `GetUserInsights` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserInsights(vars: GetUserInsightsVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserInsightsData, GetUserInsightsVariables>;

interface GetUserInsightsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserInsightsVariables): QueryRef<GetUserInsightsData, GetUserInsightsVariables>;
}
export const getUserInsightsRef: GetUserInsightsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserInsights(dc: DataConnect, vars: GetUserInsightsVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserInsightsData, GetUserInsightsVariables>;

interface GetUserInsightsRef {
  ...
  (dc: DataConnect, vars: GetUserInsightsVariables): QueryRef<GetUserInsightsData, GetUserInsightsVariables>;
}
export const getUserInsightsRef: GetUserInsightsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserInsightsRef:
```typescript
const name = getUserInsightsRef.operationName;
console.log(name);
```

### Variables
The `GetUserInsights` query requires an argument of type `GetUserInsightsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserInsightsVariables {
  campaignId: UUIDString;
}
```
### Return Type
Recall that executing the `GetUserInsights` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserInsightsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserInsightsData {
  insights: ({
    content: string;
    type: string;
    generatedAt: TimestampString;
  })[];
}
```
### Using `GetUserInsights`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserInsights, GetUserInsightsVariables } from '@dataconnect/generated';

// The `GetUserInsights` query requires an argument of type `GetUserInsightsVariables`:
const getUserInsightsVars: GetUserInsightsVariables = {
  campaignId: ..., 
};

// Call the `getUserInsights()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserInsights(getUserInsightsVars);
// Variables can be defined inline as well.
const { data } = await getUserInsights({ campaignId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserInsights(dataConnect, getUserInsightsVars);

console.log(data.insights);

// Or, you can use the `Promise` API.
getUserInsights(getUserInsightsVars).then((response) => {
  const data = response.data;
  console.log(data.insights);
});
```

### Using `GetUserInsights`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserInsightsRef, GetUserInsightsVariables } from '@dataconnect/generated';

// The `GetUserInsights` query requires an argument of type `GetUserInsightsVariables`:
const getUserInsightsVars: GetUserInsightsVariables = {
  campaignId: ..., 
};

// Call the `getUserInsightsRef()` function to get a reference to the query.
const ref = getUserInsightsRef(getUserInsightsVars);
// Variables can be defined inline as well.
const ref = getUserInsightsRef({ campaignId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserInsightsRef(dataConnect, getUserInsightsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.insights);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.insights);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreatePlatform
You can execute the `CreatePlatform` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPlatform(vars: CreatePlatformVariables): MutationPromise<CreatePlatformData, CreatePlatformVariables>;

interface CreatePlatformRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePlatformVariables): MutationRef<CreatePlatformData, CreatePlatformVariables>;
}
export const createPlatformRef: CreatePlatformRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPlatform(dc: DataConnect, vars: CreatePlatformVariables): MutationPromise<CreatePlatformData, CreatePlatformVariables>;

interface CreatePlatformRef {
  ...
  (dc: DataConnect, vars: CreatePlatformVariables): MutationRef<CreatePlatformData, CreatePlatformVariables>;
}
export const createPlatformRef: CreatePlatformRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPlatformRef:
```typescript
const name = createPlatformRef.operationName;
console.log(name);
```

### Variables
The `CreatePlatform` mutation requires an argument of type `CreatePlatformVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreatePlatformVariables {
  name: string;
  apiType: string;
}
```
### Return Type
Recall that executing the `CreatePlatform` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePlatformData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePlatformData {
  platform_insert: Platform_Key;
}
```
### Using `CreatePlatform`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPlatform, CreatePlatformVariables } from '@dataconnect/generated';

// The `CreatePlatform` mutation requires an argument of type `CreatePlatformVariables`:
const createPlatformVars: CreatePlatformVariables = {
  name: ..., 
  apiType: ..., 
};

// Call the `createPlatform()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPlatform(createPlatformVars);
// Variables can be defined inline as well.
const { data } = await createPlatform({ name: ..., apiType: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPlatform(dataConnect, createPlatformVars);

console.log(data.platform_insert);

// Or, you can use the `Promise` API.
createPlatform(createPlatformVars).then((response) => {
  const data = response.data;
  console.log(data.platform_insert);
});
```

### Using `CreatePlatform`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPlatformRef, CreatePlatformVariables } from '@dataconnect/generated';

// The `CreatePlatform` mutation requires an argument of type `CreatePlatformVariables`:
const createPlatformVars: CreatePlatformVariables = {
  name: ..., 
  apiType: ..., 
};

// Call the `createPlatformRef()` function to get a reference to the mutation.
const ref = createPlatformRef(createPlatformVars);
// Variables can be defined inline as well.
const ref = createPlatformRef({ name: ..., apiType: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPlatformRef(dataConnect, createPlatformVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.platform_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.platform_insert);
});
```

## UpdateCampaignBudget
You can execute the `UpdateCampaignBudget` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateCampaignBudget(vars: UpdateCampaignBudgetVariables): MutationPromise<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;

interface UpdateCampaignBudgetRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCampaignBudgetVariables): MutationRef<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;
}
export const updateCampaignBudgetRef: UpdateCampaignBudgetRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCampaignBudget(dc: DataConnect, vars: UpdateCampaignBudgetVariables): MutationPromise<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;

interface UpdateCampaignBudgetRef {
  ...
  (dc: DataConnect, vars: UpdateCampaignBudgetVariables): MutationRef<UpdateCampaignBudgetData, UpdateCampaignBudgetVariables>;
}
export const updateCampaignBudgetRef: UpdateCampaignBudgetRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCampaignBudgetRef:
```typescript
const name = updateCampaignBudgetRef.operationName;
console.log(name);
```

### Variables
The `UpdateCampaignBudget` mutation requires an argument of type `UpdateCampaignBudgetVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCampaignBudgetVariables {
  id: UUIDString;
  newBudget: number;
}
```
### Return Type
Recall that executing the `UpdateCampaignBudget` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCampaignBudgetData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCampaignBudgetData {
  campaign_update?: Campaign_Key | null;
}
```
### Using `UpdateCampaignBudget`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCampaignBudget, UpdateCampaignBudgetVariables } from '@dataconnect/generated';

// The `UpdateCampaignBudget` mutation requires an argument of type `UpdateCampaignBudgetVariables`:
const updateCampaignBudgetVars: UpdateCampaignBudgetVariables = {
  id: ..., 
  newBudget: ..., 
};

// Call the `updateCampaignBudget()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCampaignBudget(updateCampaignBudgetVars);
// Variables can be defined inline as well.
const { data } = await updateCampaignBudget({ id: ..., newBudget: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCampaignBudget(dataConnect, updateCampaignBudgetVars);

console.log(data.campaign_update);

// Or, you can use the `Promise` API.
updateCampaignBudget(updateCampaignBudgetVars).then((response) => {
  const data = response.data;
  console.log(data.campaign_update);
});
```

### Using `UpdateCampaignBudget`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCampaignBudgetRef, UpdateCampaignBudgetVariables } from '@dataconnect/generated';

// The `UpdateCampaignBudget` mutation requires an argument of type `UpdateCampaignBudgetVariables`:
const updateCampaignBudgetVars: UpdateCampaignBudgetVariables = {
  id: ..., 
  newBudget: ..., 
};

// Call the `updateCampaignBudgetRef()` function to get a reference to the mutation.
const ref = updateCampaignBudgetRef(updateCampaignBudgetVars);
// Variables can be defined inline as well.
const ref = updateCampaignBudgetRef({ id: ..., newBudget: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCampaignBudgetRef(dataConnect, updateCampaignBudgetVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.campaign_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.campaign_update);
});
```

