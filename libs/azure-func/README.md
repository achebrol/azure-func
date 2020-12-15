# Azure Cloud Functions Generator
Generate a Azure Function App within a Nx workspace with dev tools: 
* Create : `nx generate @techops/azure-func:http functionName`                       
* Serve  : `nx serve functionName`                
* Test   : `nx test functionName`      
* Deploy : `nx deploy functionName`       

<details>
<summary>What is a Azure FunctionApp?</summary>
Azure FunctionApp is a serverless execution environment for building and 
connecting cloud services. With FunctionApp you write simple, single-purpose 
functions that are attached to events emitted from your cloud infrastructure and 
services. Your function is triggered when an event being watched is fired.

* [Learn how to write a function app from scratch.](https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-typescript)
</details>

<details>
<summary>What is NX?</summary>
Nx is a set of extensible dev tools for monorepo, which helps you develop like Google, Facebook, and Microsoft.
It has first-class support for many frontend and backend technologies, so its documentation comes in multiple flavours.

* [Learn Nx features in 10 minutes.](https://nx.dev/angular/getting-started/why-nx)
</details>

## Setup

### Before you begin
1. Install [Node.js version 10 or greater](https://nodejs.org/)

1. Create a Nx workspace.

		npx create-nx-workspace@latest workspaceName
		cd workspaceName
		yarn add tslib
		yarn add -D @techops/azure-func
		
    Read more about [Nx Workspace](https://nx.dev/angular)
    
## Create a function

<div align="center">
<img src="https://github.com/JoelCode/azure-func/blob/master/http-function-structure.png?raw=true" width="300">
<p>HTTP Function Structure</p>
</div>

### Trigger: HTTP
    nx generate @techops/azure-func:http functionName
### Trigger: HTTP with Apollo GraphQL Gateway
    nx generate @techops/azure-func:apollo functionName
## Test the function
    nx serve functionName
    nx test functionName

## Deploy the function
    nx build functionName
    nx deploy functionName

> The 'build' option bundle all your internal dependencies in main.js & create a new package.json with your external dependencies (version number from root/package.json.)

## App Composition
<div align="center">
<img src="https://github.com/JoelCode/azure-func/blob/master/nx-dev-flow.png?raw=true" width="900">
<p>Add Microservice (Azure FunctionApp) to NX</p>
</div>

## Others
### Reporting Errors to [Stackdriver Error Reporting](https://cloud.google.com/error-reporting/docs)

    // These WILL be reported to Stackdriver Error Reporting
    console.error(new Error('I failed you'));
    console.error('I failed you', new Error('I failed you too'));
    throw new Error('I failed you'); // Will cause a cold start if not caught

### Nx Commands
    nx lint functionName
    nx format:write functionName
    nx format:write  functionName
    nx format:check  functionName
    nx affected --target=build
    nx build functionName --with-deps

### Google Cloud Commands
    gcloud functions deploy myFunction --set-env-vars foo=bar, zoo=lop
    gcloud functions myFunction --update-env-vars foo=bar, zoo=lop
    gcloud functions deploy myFunction --service-account emailOfServiceAccount
    gcloud functions deploy myFunction --max-instances maxInstancesCount
    gcloud functions deploy myFunction --clear-max-instances
    gcloud functions logs read functionName

### Hire Me
Joel Turcotte Gaucher - [linkedin](https://www.linkedin.com/in/joel-turcotte-gaucher-ba057167/) - joelturcotte.g@gmail.com
