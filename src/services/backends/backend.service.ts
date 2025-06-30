import {
	type AstTopLayer,
	type Site,
	type MeasureGroup,
	resolveAstSubCategories,
	type AstBottomLayerValue,
	type AstElement
} from '@samply/lens';
import { Spot } from './spot';
import { env } from '$env/dynamic/public';
import { v4 as uuidv4 } from 'uuid';

export const requestBackend = (
	ast: AstTopLayer,
	updateResponse: (response: Map<string, Site>) => void,
	abortController: AbortController,
	measureGroups: MeasureGroup[],
	criteria: string[]
) => {
	const queryId = uuidv4();
	const newAst = resolveAstSubCategories(ast);
	const { spotAst, directoryAst } = splitAst(newAst);
	console.log('requestBackend: directoryAst', directoryAst);
	const query = {
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

	console.log('requestBackend: measureGroups', measureGroups, 'criteria', criteria);

	let spotUrl: string = '';
	let locatorSiteList: string[] = [];
	if (env.PUBLIC_ENVIRONMENT === 'test') {
		//backendUrl = 'http://localhost/backend/';
		spotUrl = 'http://localhost/';
		locatorSiteList = ['udi-test'];
	} else if (env.PUBLIC_ENVIRONMENT === 'acceptance') {
		//backendUrl = 'http://localhost/backend/';
		spotUrl = 'http://localhost/';
		locatorSiteList = ['udi-test'];
	} else {
		// production
		//backendUrl = 'http://localhost/backend/';
		spotUrl = 'http://localhost/';
		locatorSiteList = ['udi-test'];
	}
	if (env.PUBLIC_BACKEND_URL) {
		spotUrl = env.PUBLIC_BACKEND_URL;
	}
	const spot = new Spot(new URL(spotUrl), locatorSiteList, queryId);
	spot.send(btoa(decodeURI(JSON.stringify(query))), updateResponse, abortController);
};

const SPOT_KEYS = new Set([
	'gender',
	'diagnosis',
	'diagnosis_age_donor',
	'date_of_diagnosis',
	'donor_age',
	'sample_kind',
	'sampling_date',
	'storage_temperature',
	'sampling_date'
]);
const DIRECTORY_KEYS = new Set([
	'country',
	'collection-type',
	'category',
	'service-type'
]);

type AstSplitResult = {
	spotAst?: AstElement;
	directoryAst?: AstElement;
};

/**
 * Splits an AST element into two parts, one for the Spot query and one for the Directory query.
 *
 * @param ast - The AST element to be split.
 * @returns An object containing the two parts of the AST, with the keys 'spotAst' and 'directoryAst'.
 *          The 'spotAst' AST element contains only the parts of the original AST that are relevant
 *          to the Spot (Locator) query, and the 'directoryAst' AST element contains only the parts of the original
 *          AST that are relevant to the Directory query.
 */
function splitAst(ast: AstElement): AstSplitResult {
	const spotAst = deepCloneAndFilter(ast, SPOT_KEYS, 'OR');
	const directoryAst = deepCloneAndFilter(ast, DIRECTORY_KEYS, 'OR');
	return { spotAst, directoryAst };
}

/**
 * Recursively clones and filters an AST element based on a set of keys.
 *
 * @param node - The AST element to be cloned and filtered.
 * @param keySet - A set of keys used to determine which nodes to retain.
 * @param defaultOperand - The operand to use for nodes that do not match the keySet.
 * @returns A new AST element that is a filtered clone of the input node.
 */
function deepCloneAndFilter(
	node: AstElement,
	keySet: Set<string>,
	defaultOperand: 'AND' | 'OR' | 'XOR' | 'NOT'
): AstElement {
	if (isBottomLayer(node)) {
		return keySet.has(node.key)
			? { ...node }
			: {
					operand: defaultOperand,
					children: []
				};
	}

	const filteredChildren = node.children
		.map((child) => deepCloneAndFilter(child, keySet, defaultOperand))
		.filter((child) => !isEmptyTopLayer(child));

	return {
		key: node.key,
		operand: node.operand,
		children: filteredChildren
	};
}

/**
 * Returns true if the given AST element is a top layer element that has no children.
 *
 * Checks if a node is an empty top layer: { operand, children: [] }
 *
 * This can be used to prune empty branches from an AST after filtering.
 */
function isEmptyTopLayer(node: AstElement): boolean {
	return !isBottomLayer(node) && (!node.children || node.children.length === 0);
}

/**
 * Checks if a node is a bottom layer: { key, value, operand }
 *
 * This is done by checking if the node has a "children" property.
 * If it does not, then the node is a bottom layer.
 */
function isBottomLayer(node: AstElement): node is AstBottomLayerValue {
	return !('children' in node);
}
