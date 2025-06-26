import { addItemToActiveQueryGroup } from '@samply/lens';
import { v4 as uuidv4 } from 'uuid';

type EmptyObject = Record<string, never>;
type NumericRange = { lower: number | null; upper: number | null };
type DateRange = { lower: Date | null; upper: Date | null };

export class AddItems {
	static gender(item: string | null): void {
		this.singleSelect(item, 'gender', 'Gender');
	}

	static sampleType(items: string[] | null): void {
		if (!items?.length) return;

		for (const item of items) {
			this.singleSelect(item, 'sample_kind', 'Sample type');
		}
	}

	static storageTemperature(items: string[] | null): void {
		if (!items?.length) return;

		for (const item of items) {
			this.singleSelect(item, 'storage_temperature', 'Storage temperature');
		}
	}

	static diagnosis(items: string[] | null): void {
		if (!items?.length) return;

		for (const item of items) {
			this.singleSelect(item, 'diagnosis', 'Diagnosis ICD-10');
		}
	}

	static ageAtDiagnosis(item: NumericRange | EmptyObject | null): void {
		this.numericRange(item, 'diagnosis_age_donor', 'Diagnosis age donor (years)');
	}

	static patientAge(item: NumericRange | EmptyObject | null): void {
		this.numericRange(item, 'patient_age', 'Patient age (years)');
	}

	static dateOfDiagnosis(item: DateRange | EmptyObject | null): void {
		this.dateRange(item, 'diagnosis_date', 'Diagnosis date');
	}

	static samplingDate(item: DateRange | EmptyObject | null): void {
		this.dateRange(item, 'sampling_date', 'Sampling date');
	}

	static country(items: string[] | null): void {
		if (!items?.length) return;

		for (const item of items) {
			this.singleSelect(item, 'country', 'Country');
		}
	}

	static collectionType(items: string[] | null): void {
		if (!items?.length) return;

		for (const item of items) {
			this.singleSelect(item, 'collection_type', 'Collection type');
		}
	}

	static category(items: string[] | null): void {
		if (!items?.length) return;

		for (const item of items) {
			this.singleSelect(item, 'category', 'Category');
		}
	}

	static serviceType(items: string[] | null): void {
		if (!items?.length) return;

		for (const item of items) {
			this.singleSelect(item, 'service_type', 'Service type');
		}
	}

	private static singleSelect(item: string | null, key: string, name: string): void {
		if (!item) return;

		const stringItem: string = item.trim();
		addItemToActiveQueryGroup({
			id: uuidv4(),
			key: key,
			name: name,
			type: 'EQUALS',
			values: [
				{
					name: stringItem,
					value: stringItem,
					queryBindId: uuidv4()
				}
			]
		});
	}

	private static numericRange(
		item: NumericRange | EmptyObject | null,
		key: string,
		name: string
	): void {
		if (!item) return;

		const from = item.lower;
		const to = item.upper;
		if (!from && !to) return;
		addItemToActiveQueryGroup({
			id: uuidv4(),
			key: key,
			name: name,
			type: 'BETWEEN',
			values: [
				{
					name: this.buildName(from, to),
					value: { min: from ?? 0, max: to ?? 0 },
					queryBindId: uuidv4()
				}
			]
		});
	}

	private static dateRange(
		item: DateRange | EmptyObject | null,
		key: string,
		name: string
	): void {
		if (!item) return;

		const from = item.lower;
		const to = item.upper;
		if (!from && !to) return;
		addItemToActiveQueryGroup({
			id: uuidv4(),
			key: key,
			name: name,
			type: 'BETWEEN',
			values: [
				{
					name: this.buildName(from, to),
					// Empty string indicates absence of min/max
					value: { min: from ?? '', max: to ?? '' },
					queryBindId: uuidv4()
				}
			]
		});
	}

	/**
	 * Build the string representation of the range.
	 */
	private static buildName(from: number | Date | null, to: number | Date | null): string {
		if (from !== null && to === null) {
			return `≥ ${from}`;
		} else if (from === null && to !== null) {
			return `≤ ${to}`;
		} else if (from !== null && to !== null && from == to) {
			return `${from}`;
		} else {
			return `${from} - ${to}`;
		}
	}
}
