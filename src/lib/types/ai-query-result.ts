import * as chrono from 'chrono-node';

type FieldType = 'string' | '[]' | 'string[]' | 'object';
type EmptyObject = Record<string, never>;
type AgeRange = { lower: number | null; upper: number | null };
type DateRange = { lower: Date | null; upper: Date | null };

const genderMap: Record<string, 'male' | 'female' | 'unknown' | 'other'> = {
	female: 'female',
	females: 'female',
	woman: 'female',
	women: 'female',
	girl: 'female',
	girls: 'female',
	male: 'male',
	males: 'male',
	man: 'male',
	men: 'male',
	boy: 'male',
	boys: 'male',
	unknown: 'unknown',
	'n/a': 'unknown',
	na: 'unknown',
	other: 'other',
	nonbinary: 'other',
	'non-binary': 'other',
	diverse: 'other',
	intersexual: 'other',
	transgender: 'other'
};
const allowedSampleTypes = new Set([
	'blood-serum',
	'tissue-frozen',
	'whole-blood',
	'blood-plasma',
	'derivative-other',
	'tissue-other',
	'peripheral-blood-cells-vital',
	'urine',
	'rna',
	'liquid-other',
	'buffy-coat',
	'dna',
	'csf-liquor',
	'stool-faeces',
	'bone-marrow',
	'tissue-ffpe',
	'saliva',
	'ascites',
	'swab',
	'dried-whole-blood'
]);

export class AiQueryResult {
	private constructor(
		public readonly gender: string,
		public readonly diagnosis: string[],
		public readonly age_at_diagnosis: AgeRange,
		public readonly date_of_diagnosis: DateRange,
		public readonly donor_age: AgeRange,
		public readonly sample_type: string[],
		public readonly sampling_date: DateRange,
		public readonly sample_storage_temperature: string[],
		public readonly country: string[],
		public readonly collection_type: string[],
		public readonly category: string[],
		public readonly service_type: string[]
	) {}

	// Static factory to handle JSON parsing
	static fromJson(json: string): AiQueryResult {
		const obj = JSON.parse(json);
		return new AiQueryResult(
			obj.gender,
			obj.diagnosis,
			obj.age_at_diagnosis,
			obj.date_of_diagnosis,
			obj.donor_age,
			obj.sample_type,
			obj.sampling_date,
			obj.sample_storage_temperature,
			obj.country,
			obj.collection_type,
			obj.category,
			obj.service_type
		);
	}

	/**
	 * Validates whether a given field in an object matches the expected type.
	 *
	 * @param obj - The object containing the field to validate.
	 * @param field - The name of the field to validate.
	 * @param expectedType - The expected type of the field, which can be 'string', 'string[]', or 'object'.
	 * @returns A boolean indicating whether the field exists, is not null or undefined, and matches the expected type.
	 */

	private validateField(field: string, expectedType: FieldType): boolean {
		if (!(field in this)) {
			console.error(`Field "${field}" does not exist.`);
			return false;
		}

		const value = (this as Record<string, unknown>)[field];

		if (value == null) {
			console.error(`Field "${field}" is null or undefined.`);
			return false;
		}

		switch (expectedType) {
			case 'string':
				if (typeof value !== 'string') {
					console.error(`Field "${field}" is not a string:`, value);
					return false;
				}
				break;

			case '[]':
				if (!Array.isArray(value)) {
					console.error(`Field "${field}" is not an array:`, value);
					return false;
				}
				break;

			case 'string[]':
				if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
					console.error(`Field "${field}" is not an array of strings:`, value);
					return false;
				}
				break;

			case 'object':
				if (typeof value !== 'object' || Array.isArray(value)) {
					console.error(`Field "${field}" is not an object (map-like):`, value);
					return false;
				}
				break;

			default:
				console.error(`Unknown type for field "${field}":`, expectedType);
				return false;
		}

		return true;
	}

	// Functions for terms relevant to the Directory

	public getCountry(): string[] | null {
		if (!this.validateField('country', 'string[]')) return null;
		return this.country;
	}

	public getCollectionType(): string[] | null {
		if (!this.validateField('collection_type', 'string[]')) return null;
		return this.collection_type;
	}

	public getCategory(): string[] | null {
		if (!this.validateField('category', 'string[]')) return null;
		return this.category;
	}

	public getServiceType(): string[] | null {
		if (!this.validateField('service_type', 'string[]')) return null;
		return this.service_type;
	}

	// Functions relevant for terms relevant to the Locator

	/**
	 * Returns the normalized gender of the donor, if it can be parsed, or null if not.
	 * The normalization is done by mapping the raw value to one of the following:
	 * - 'male'
	 * - 'female'
	 * - 'unknown'
	 * - 'other'
	 *
	 * If the raw value is not recognized, a warning is logged and null is returned.
	 */
	public getGender(): 'male' | 'female' | 'unknown' | 'other' | null {
		let raw: string;
		if (!this.validateField('gender', 'string')) {
			if (!this.validateField('gender', 'string[]')) {
				return null;
			}
			raw = this.gender[0].trim().toLowerCase();
			console.info('Gender field is an array, using first element: ', raw);
		} else {
			raw = this.gender.trim().toLowerCase();
		}

		const normalized = genderMap[raw];

		if (!normalized) {
			console.warn(`Unrecognized gender value: "${this.gender}"`);
			return null;
		}

		return normalized;
	}

	/**
	 * Returns the list of ICD-10 diagnosis codes that were found in the "diagnosis" field.
	 * Returns null if the field is not present, not an array of strings, or if no valid
	 * ICD-10 codes were found in the field.
	 *
	 * @returns {string[] | null}
	 */
	public getDiagnosis(): string[] | null {
		if (!this.validateField('diagnosis', 'string[]')) return null;

		const icd10Pattern = /[A-TV-Z][0-9]{2}(?:\.[0-9A-TV-Z]{1,4})?/g;
		const originalEntries = this.diagnosis;
		const validCodes: string[] = [];

		for (const entry of originalEntries) {
			if (typeof entry !== 'string') {
				continue;
			}

			const matches = entry.match(icd10Pattern);

			if (matches && matches.length > 0) {
				validCodes.push(...matches);
			}
		}

		if (originalEntries.length > 0 && validCodes.length === 0) {
			return null;
		}

		return validCodes;
	}
	/**
	 * Returns the list of recognized sample types from the "sample_type" field.
	 * Returns null if the field is not present, not an array of strings, or if no valid
	 * sample types were found in the field.
	 *
	 * @returns {string[] | null}
	 */
	public getSampleType(): string[] | null {
		if (!this.validateField('sample_type', 'string[]')) return null;

		const original = this.sample_type;
		const valid: string[] = [];

		for (const entry of original) {
			const cleaned = entry.trim().toLowerCase();

			if (allowedSampleTypes.has(cleaned)) {
				valid.push(cleaned);
			} else if (cleaned.endsWith('-plasma')) {
				valid.push('blood-plasma'); // Deal with AI hallucination
			} else if (cleaned.endsWith('-blood')) {
				valid.push('whole-blood'); // Deal with AI hallucination
			} else if (cleaned.startsWith('blood-')) {
				valid.push('whole-blood'); // Deal with AI hallucination
			} else if (cleaned.endsWith('-tissue')) {
				valid.push('tissue-other'); // Deal with AI hallucination
			} else if (cleaned.startsWith('tissue-')) {
				valid.push('tissue-other'); // Deal with AI hallucination
			} else if (cleaned.startsWith('stool-')) {
				valid.push('stool-faeces'); // Deal with AI hallucination
			} else if (cleaned.endsWith('-faeces')) {
				valid.push('stool-faeces'); // Deal with AI hallucination
			} else {
				console.warn(`Unrecognized sample type ignored: "${entry}"`);
			}
		}

		if (original.length > 0 && valid.length === 0) {
			return null;
		}

		return valid;
	}

	/**
	 * Parses the date range from the specified field, returning an object with
	 * 'lower' and 'upper' Date properties. If the field is missing, invalid, or
	 * both bounds are empty, appropriate logs are generated and either null or an
	 * empty object is returned.
	 *
	 * @param fieldName - The name of the field containing the date range.
	 * @returns An object with 'lower' and 'upper' Date properties, an empty object
	 * if both bounds are empty, or null if the field is missing or invalid.
	 */
	private parseDateRange(
		fieldName: string
	): { lower: Date | null; upper: Date | null } | EmptyObject | null {
		const range = (this as Record<string, unknown>)[fieldName];

		if (!range || typeof range !== 'object') {
			return null;
		}

		const rawLower = typeof range.lower === 'string' ? range.lower.trim() : '';
		const rawUpper = typeof range.upper === 'string' ? range.upper.trim() : '';

		// If both bounds are explicitly empty, treat as "no date specified"
		if (rawLower === '' && rawUpper === '') {
			console.info(`No date range provided for "${fieldName}". Returning empty object.`);
			return {};
		}

		const parsedLower = rawLower ? chrono.parseDate(rawLower) : null;
		const parsedUpper = rawUpper ? chrono.parseDate(rawUpper) : null;

		if (!parsedLower && !parsedUpper) {
			return null;
		}

		return { lower: parsedLower, upper: parsedUpper };
	}

	/**
	 * Returns the parsed sampling date range from the "sampling_date" field.
	 * Returns null if the field is not present, not an object with "lower" and "upper"
	 * string properties, or if no valid date range was parsed.
	 *
	 * @returns {{ lower: Date | null; upper: Date | null } | null}
	 */
	public getSamplingDate():
		| { lower: Date | null; upper: Date | null }
		| null
		| EmptyObject {
		const diagnosisDate = this.parseDateRange('date_of_diagnosis');
		const samplingDate = this.parseDateRange('sampling_date');

		// If there is no diagnosis and no sampling date, but we have a diagnosis date,
		// return the diagnosis date.
		if (!this.hasDiagnosis() && diagnosisDate && !samplingDate) {
			return diagnosisDate;
		}

		return samplingDate;
	}

	/**
	 * Returns the parsed date range from the "date_of_diagnosis" field as a { lower: Date | null; upper: Date | null } object.
	 * If the field is not present, not an object with "lower" and "upper" string properties, or if no valid date range was parsed,
	 * null is returned.
	 *
	 * If the diagnosis field is empty and the parsed date ranges for "date_of_diagnosis" and "sampling_date" are structurally equal,
	 * an empty object is returned instead of null. This is to prevent filtering by diagnosis date from being applied when no diagnosis
	 * exists.
	 *
	 * @returns {{ lower: Date | null; upper: Date | null } | null | {}}
	 */
	public getDateOfDiagnosis():
		| { lower: Date | null; upper: Date | null }
		| null
		| EmptyObject {
		const diagnosisDate = this.parseDateRange('date_of_diagnosis');
		const samplingDate = this.parseDateRange('sampling_date');

		const datesAreEqual =
			diagnosisDate &&
			samplingDate &&
			diagnosisDate.lower?.getTime() === samplingDate.lower?.getTime() &&
			diagnosisDate.upper?.getTime() === samplingDate.upper?.getTime();

		// If no diagnosis is present, and date ranges are structurally equal, return empty object
		if (!this.hasDiagnosis() && datesAreEqual) {
			return {};
		}

		return diagnosisDate;
	}

	/**
	 * Parses an age range from the specified field and returns an object
	 * with "lower" and "upper" properties containing the respective age values
	 * as integers, or null if not applicable. If the field does not exist or
	 * is not an object, null is returned. If both age values are empty, an
	 * empty object is returned. If both parsed values are null, null is returned.
	 * A warning is logged if the lower bound is greater than the upper bound.
	 *
	 * @param fieldName - The name of the field containing the age range to parse.
	 * @returns An object with "lower" and "upper" properties, or an empty object, or null.
	 */
	private parseAgeRange(fieldName: string): AgeRange | EmptyObject | null {
		if (!this.validateField(fieldName, 'object')) return null;

		const range = (this as Record<string, unknown>)[fieldName];

		// Lambda to parse age from either a string or a number. If a string is provided,
		// extract the first group of digits, throwing away any non-digit characters.
		const parseAge = (value: number | string): number | null => {
			if (typeof value === 'number') return Number.isInteger(value) ? value : null;

			if (typeof value === 'string') {
				const match = value.trim().match(/\d+/); // Find first group of digits
				if (match) return parseInt(match[0], 10);
			}

			return null;
		};

		if (!('lower' in range) && !('upper' in range)) {
			console.info(`No elements in "${fieldName}" — returning empty object.`);
			return {};
		}

		if (range.lower === '' && range.upper === '') {
			console.info(`No values in "${fieldName}" — returning empty object.`);
			return {};
		}

		// Catch cases where the AI puts things like "60+" into upper
		if (!range.lower && range.upper !== null && typeof range.upper === 'string') {
			const match = range.upper.match(/^(\d+)\+/);
			if (match) {
				range.lower = parseInt(match[1], 10);
				range.upper = null;
			}
		}

		let lower = parseAge(range.lower);
		let upper = parseAge(range.upper);

		if (lower === null && upper === null) {
			console.error(`Invalid or missing bounds in "${fieldName}".`);
			return null;
		}

		if (lower !== null && upper !== null && lower > upper) {
			console.warn(
				`"${fieldName}" lower bound (${lower}) is greater than upper bound (${upper}).`
			);
			lower = upper;
		}

		if (lower !== null && lower >= 150) {
			console.warn(`"${fieldName}" lower bound (${lower}) is unreasonably large.`);
			lower = null;
		}

		if (upper !== null && upper >= 150) {
			console.warn(`"${fieldName}" upper bound (${upper}) is unreasonably large.`);
			upper = null;
		}

		return { lower, upper };
	}

	/**
	 * Returns true if the age range is either null or has both lower and upper bounds set to null.
	 * Otherwise, returns false.
	 * @param ageRange - The age range to check.
	 * @returns True if the age range is empty, false otherwise.
	 */
	private isEmptyAgeRange(ageRange: AgeRange): boolean {
		return !ageRange || (ageRange.lower === null && ageRange.upper === null);
	}

	/**
	 * Retrieves the age range from the "donor_age" field.
	 * Returns null if the age range is invalid or missing.
	 * If the age range is valid, returns an object with
	 * "lower" and "upper" properties, each holding the
	 * respective age value (or null if not applicable).
	 *
	 * If there is no diagnosis and no donor age range, but a diagnosis age is available,
	 * return that.
	 *
	 * @returns {{ lower: number | null; upper: number | null } | null}
	 */
	public getDonorAge():
		| { lower: number | null; upper: number | null }
		| EmptyObject
		| null {
		const donorAge = this.parseAgeRange('donor_age');
		const diagnosisAge = this.parseAgeRange('age_at_diagnosis');

		if (
			!this.hasDiagnosis() &&
			this.isEmptyAgeRange(donorAge) &&
			!this.isEmptyAgeRange(diagnosisAge)
		) {
			return diagnosisAge;
		}

		return donorAge;
	}

	/**
	 * Checks if a diagnosis exists in the AI query result.
	 *
	 * @returns {boolean} True if a diagnosis exists, false otherwise.
	 */
	private hasDiagnosis(): boolean {
		if (this.getDiagnosis() && this.getDiagnosis().length > 0) return true;
		return false;
	}

	/**
	 * Retrieves the age range at diagnosis from the "age_at_diagnosis" field.
	 * Returns null if the age range is invalid or missing. If no diagnosis
	 * is found, an empty object is returned. If the age at diagnosis matches
	 * an incomplete donor age value, the age is suppressed as redundant
	 * and an empty object is returned.
	 *
	 * @returns {{ lower: number | null; upper: number | null } | {} | null}
	 */

	public getAgeAtDiagnosis():
		| { lower: number | null; upper: number | null }
		| EmptyObject
		| null {
		if (!this.hasDiagnosis()) {
			console.info('No diagnosis found — age at diagnosis will not be reported.');
			return {};
		}

		const donorAge = this.parseAgeRange('donor_age');
		const diagnosisAge = this.parseAgeRange('age_at_diagnosis');

		// If both age ranges only specify one bound (say, just lower: 60) and they’re the
		// same, the following block concludes there's no meaningful difference between
		// “age at diagnosis” and “current patient age,” so it opts to skip one to avoid duplication.
		if (
			donorAge &&
			diagnosisAge &&
			typeof donorAge === 'object' &&
			typeof diagnosisAge === 'object' &&
			!(Array.isArray(donorAge) || Array.isArray(diagnosisAge))
		) {
			// Extract the non-null component of donor age
			const patientNonNull =
				donorAge.lower !== null && donorAge.upper === null
					? donorAge.lower
					: donorAge.upper !== null && donorAge.lower === null
						? donorAge.upper
						: null;

			const diagnosisNonNull =
				diagnosisAge.lower !== null && diagnosisAge.upper === null
					? diagnosisAge.lower
					: diagnosisAge.upper !== null && diagnosisAge.lower === null
						? diagnosisAge.upper
						: null;

			if (
				patientNonNull !== null &&
				diagnosisNonNull !== null &&
				patientNonNull === diagnosisNonNull
			) {
				console.info(
					'Age at diagnosis matches incomplete donor age value — suppressing as redundant.'
				);
				return {};
			}
		}

		return diagnosisAge;
	}

	private normalizeStorageTemperature = (input: string): string => {
		const value = input.trim().toLowerCase();

		if (/room\s?temp|ambient/.test(value)) return 'temperatureRoom';
		if (/4\s?°?c|four degrees/.test(value)) return 'four_degrees';
		if (/2\s?[-–to]{1,3}\s?10\s?°?c/.test(value)) return 'temperature2to10';
		if (/-18\s?[-–to]{1,3}\s?35\s?°?c/.test(value)) return 'temperature-18to-35';
		if (/-60\s?[-–to]{1,3}\s?85\s?°?c/.test(value)) return 'temperature-60to-85';
		if (/liquid\s?nitrogen|cryopreserv|(-1\d{2,}\s?°?c)/.test(value))
			return 'temperatureLN';
		if (/liquid\s?nitrogen|cryopreserv|(-196\s?°?c)/.test(value)) return 'temperatureLN';
		if (/gas\s?nitrogen/.test(value)) return 'temperatureGN';
		if (/uncharted|unknown/.test(value)) return 'storage_temperature_uncharted';

		console.warn(`Unrecognized temperature input: "${input}"`);
		return '';
	};

	public getSampleStorageTemperature(): string[] | null {
		if (!this.validateField('sample_storage_temperature', '[]')) return null;

		const original = this.sample_storage_temperature;
		const normalized: string[] = [];

		for (const entry of original) {
			// Coerce numbers to string before normalization
			const stringified = typeof entry === 'number' ? entry.toString() : String(entry);
			const mapped = this.normalizeStorageTemperature(stringified);

			if (mapped) {
				normalized.push(mapped);
			} else {
				console.warn(`Unrecognized storage temperature: "${entry}"`);
			}
		}

		if (original.length > 0 && normalized.length === 0) {
			console.error('All sample storage temperatures were unrecognized or invalid.');
			return null;
		}

		return normalized;
	}
}
