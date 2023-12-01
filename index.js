import { HttpsProxyAgent } from 'https-proxy-agent';
import vsaApiCall from './vsaApiCall.js';

const delayMs = 2000; // delay each request by 100ms
const maxIterate = 5;
export const useProxy = false; // if not using a proxy set to false.
export const authObj = {};
authObj.authToken	= 0;
export const proxyUrl = `http://optionalproxy:8888`
export const agent = useProxy && proxyUrl && proxyUrl.length && new HttpsProxyAgent(proxyUrl);

console.log('** Kaseya API Call Test BEGIN **');
export const baseUrl = 'https://yourserver.com';
// we can use a personal access token and username, or we can use a username/password combo.
const authToken = '';
const username = 'newaccount';
const password = undefined;
// the agentguid to run the procedures on
const agentId = '';
// pool of procedure Ids we imported to use for our calls.
const agentProcIdArray = ['','','','',''];
// if you want to reproduce the issue just use 5 static procedure Ids...you will see the results do not get logged to the script log properly as they are not really run on the endpoint.
// const agentProcIdArray = ['554082963','554082963','554082963','554082963','554082963'];
const agentProcVarCaption = 'testprompt';
const agentProcVarName = 'testvariable';
const executionId = Date.now();
let agentProcVarContent = 'test variable content-'+executionId;

for (let i = 0; i < maxIterate; i++) {
	try {
		const agentProcId = agentProcIdArray[i];
		await new Promise(r => setTimeout(r, delayMs)); // one-line delay so we dont hammer the webserver...
		const payload = {
			username,
			authToken,
			password,
			endpoint: `/automation/agentprocs/${agentId}/${agentProcId}/runnow`,
			method: 'PUT',
			optionalParameters: {
				"ScriptPrompts": [{
				"Caption": agentProcVarCaption,
				"Name": agentProcVarName,
				"Value": `${agentProcVarContent}-${i}`}]
			}
		};
		await vsaApiCall(payload, i);
		console.log('vsaApiCall script call completed successfully');
	} catch (e) {
		console.log('error processing request for iteration '+i+' - error is : ', e);
	}
}

await new Promise(r => setTimeout(r, delayMs)); // one-line delay so we dont hammer the webserver...
const payload = {
	username,
	authToken,
	password,
	endpoint: `/assetmgmt/logs/${agentId}/agentprocedure`,
	method: 'GET',
	optionalParameters: {
		"$orderby": 'LastExecution desc',
		"$top":"30"
	}
};

try {
	const result = await vsaApiCall(payload);
	console.log('vsaApiCall script log  result: ', result.data);
} catch (e) {
	console.log('vsaApiCall script log request error: ', e);
}
console.log('** Kaseya API Call Test END **');
