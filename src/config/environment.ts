// VITE_TARGET_ENVIRONMENT should be set by the ci pipeline

import type { MeasureGroup, MeasureItem } from '@samply/lens';
import {
	patientsMeasureBbmriProd,
	specimenMeasureBbmriProd,
	diagnosisMeasureBbmriProd
} from '../measures';

export const genderHeaders: Map<string, string> = new Map<string, string>()
	.set('male', 'männlich')
	.set('female', 'weiblich')
	.set('other', 'Divers, Intersexuell')
	.set('unknown', 'unbekannt');

export const barChartBackgroundColors: string[] = [
	'#052c65',
	'#073d8b',
	'#094db1',
	'#0b5ed7',
	'#0d6efd',
	'#3b8afd',
	'#69a5fe',
	'#97c1fe',
	'#c5dcff'
];

export const barChartHoverColors: string[] = ['#E95713'];

export const measures: MeasureGroup[] = [
	{
		name: 'BBMRI',
		measures: [
			patientsMeasureBbmriProd as MeasureItem,
			specimenMeasureBbmriProd as MeasureItem,
			diagnosisMeasureBbmriProd as MeasureItem
		]
	}
];

export const backendMeasures = `BBMRI_STRAT_DEF_IN_INITIAL_POPULATION`;
