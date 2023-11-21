import { HttpsProxyAgent } from 'https-proxy-agent';
import vsaApiCall from './vsaApiCall.js';
export const baseUrl = '';
const delayMs = 2000; // delay each request by 100ms
const maxIterate = 5;
export const useProxy = false; // if not using a proxy set to false.
export const proxyUrl = `http://proxy9:8888`
export const agent = useProxy && proxyUrl && proxyUrl.length && new HttpsProxyAgent(proxyUrl);
export const iterateUrlObj = {};
iterateUrlObj.iterateUrlNum	= 0;

console.log('** Kaseya API Call Test');

const authToken = '';
const password = undefined;

const agentId = '';
const username = '';
const agentProcIdArray = ['','','','',''];
const agentProcVarCaption = 'testprompt';
const agentProcVarName = 'testvariable';
let agentProcVarContent = 'test variable content';

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
	} catch (e) {
		console.log('error processing request for iteration '+iterateUrlObj.iterateUrlNum+' - error is : ', e);
	}
}

console.log('** Complete -- '+(iterateUrlObj.iterateUrlNum+1)+' **');

