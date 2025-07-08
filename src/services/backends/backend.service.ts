import {
	type AstTopLayer,
	type Site,
	type MeasureGroup,
	resolveAstSubCategories
} from '@samply/lens';
import { Spot } from './spot';
import { env } from '$env/dynamic/public';
import { v4 as uuidv4 } from 'uuid';
import { Directory } from './directory';
import { splitAstIntoSpotAndDirectory } from '$lib/utils/split-ast-into-spot-directory';

export const requestBackend = (
	ast: AstTopLayer,
	updateResponse: (response: Map<string, Site>) => void,
	abortController: AbortController,
	measureGroups: MeasureGroup[],
	criteria: string[]
) => {
	const queryId = uuidv4();
	const newAst = resolveAstSubCategories(ast);
	const { spotAst, directoryAst } = splitAstIntoSpotAndDirectory(newAst);
	const spotQuery = {
		lang: 'ast',
		payload: btoa(
			decodeURI(
				JSON.stringify({
					ast: spotAst,
					id: queryId.concat('__search__').concat(queryId)
				})
			)
		)
	};
	const directoryQuery = {
		lang: 'ast',
		payload: btoa(
			decodeURI(
				JSON.stringify({
					ast: directoryAst,
					id: queryId.concat('__search__').concat(queryId)
				})
			)
		)
	};

	console.log('requestBackend: measureGroups', measureGroups, 'criteria', criteria);

	let spotUrl: string = '';
	let locatorSiteList: string[] = [];
	let directoryUrl: string = '';
	let directorySiteList: string[] = [];
	if (env.PUBLIC_ENVIRONMENT === 'test') {
		spotUrl = 'http://localhost/';
		directoryUrl = 'http://localhost:8080/';
		locatorSiteList = ['udi-test'];
		directorySiteList = [];
	} else if (env.PUBLIC_ENVIRONMENT === 'acceptance') {
		spotUrl = 'http://localhost/';
		directoryUrl = 'http://localhost:8080/';
		locatorSiteList = ['udi-test'];
		directorySiteList = [];
	} else {
		// production
		spotUrl = 'http://localhost/';
		directoryUrl = 'http://localhost:8080/';
		directorySiteList = [];
		locatorSiteList = ['udi-test'];
	}
	if (env.PUBLIC_BACKEND_URL) {
		spotUrl = env.PUBLIC_BACKEND_URL;
	}
	const spot = new Spot(new URL(spotUrl), locatorSiteList, queryId);
	spot.send(btoa(decodeURI(JSON.stringify(spotQuery))), updateResponse, abortController);
	const directory = new Directory(new URL(directoryUrl), directorySiteList, queryId);
	directory.send(
		btoa(decodeURI(JSON.stringify(directoryQuery))),
		updateResponse,
		abortController
	);
};
