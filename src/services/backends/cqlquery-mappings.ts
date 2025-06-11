export const alias = new Map<string, string>([
    ["icd10", "http://hl7.org/fhir/sid/icd-10"],
    ["icd10gm", "http://fhir.de/CodeSystem/dimdi/icd-10-gm"],
    ["loinc", "http://loinc.org"],
    ["SampleMaterialType", "https://fhir.bbmri.de/CodeSystem/SampleMaterialType"], //specimentype
    ["StorageTemperature", "https://fhir.bbmri.de/CodeSystem/StorageTemperature"],
    ["FastingStatus", "http://terminology.hl7.org/CodeSystem/v2-0916"],
    ["SmokingStatus", "http://hl7.org/fhir/uv/ips/ValueSet/current-smoking-status-uv-ips"],
])

export const cqltemplate = new Map<string, string>([
    ["gender", "Patient.gender = '{{C}}'"],
    ["conditionSampleDiagnosis", "((exists[Condition: Code '{{C}}' from {{A1}}]) or (exists[Condition: Code '{{C}}' from {{A2}}])) or (exists from [Specimen] S where (S.extension.where(url='https://fhir.bbmri.de/StructureDefinition/SampleDiagnosis').value.coding.code contains '{{C}}'))"],
    ["conditionValue", "exists [Condition: Code '{{C}}' from {{A1}}]"],
    ["conditionRangeDate", "exists from [Condition] C\nwhere FHIRHelpers.ToDateTime(C.onset) between {{D1}} and {{D2}}"],
    ["conditionRangeAge", "exists from [Condition] C\nwhere AgeInYearsAt(FHIRHelpers.ToDateTime(C.onset)) between Ceiling({{D1}}) and Ceiling({{D2}})"],
    ["conditionGreaterThanAge", "exists from [Condition] C\nwhere AgeInYearsAt(FHIRHelpers.ToDateTime(C.onset)) between Ceiling({{D1}}) and Ceiling({{D2}})"],
    ["age", "AgeInYears() between Ceiling({{D1}}) and Ceiling({{D2}})"],
    ["observation", "exists from [Observation: Code '{{K}}' from {{A1}}] O\nwhere O.value.coding.code contains '{{C}}'"],
    ["observationRange", "exists from [Observation: Code '{{K}}' from {{A1}}] O\nwhere O.value between {{D1}} and {{D2}}"],
    ["observationBodyWeight", "exists from [Observation: Code '{{K}}' from {{A1}}] O\nwhere ((O.value as Quantity) < {{D1}} 'kg' and (O.value as Quantity) > {{D2}} 'kg')"],
    ["observationBMI", "exists from [Observation: Code '{{K}}' from {{A1}}] O\nwhere ((O.value as Quantity) < {{D1}} 'kg/m2' and (O.value as Quantity) > {{D2}} 'kg/m2')"],
    ["hasSpecimen", "exists [Specimen]"],
    ["specimen", "exists [Specimen: Code '{{C}}' from {{A1}}]"],
    ["retrieveSpecimenByType", "(S.type.coding.code contains '{{C}}')"],
    ["retrieveSpecimenByTemperature", "(S.extension.where(url='https://fhir.bbmri.de/StructureDefinition/StorageTemperature').value.coding.code contains '{{C}}')"],
    ["retrieveSpecimenBySamplingDate", "(FHIRHelpers.ToDateTime(S.collection.collected) between {{D1}} and {{D2}})"],
    ["retrieveSpecimenByFastingStatus", "(S.collection.fastingStatus.coding.code contains '{{C}}')"],
    ["samplingDate", "exists from [Specimen] S\nwhere FHIRHelpers.ToDateTime(S.collection.collected) between {{D1}} and {{D2}}"],
    ["fastingStatus", "exists from [Specimen] S\nwhere S.collection.fastingStatus.coding.code contains '{{C}}'"],
    ["storageTemperature", "exists from [Specimen] S where (S.extension.where(url='https://fhir.bbmri.de/StructureDefinition/StorageTemperature').value.coding contains Code '{{C}}' from {{A1}})"]
])

export const criterionMap = new Map<string, { type: string, alias?: string[] }>([
    ["gender", { type: "gender" }],
    ["diagnosis", { type: "conditionSampleDiagnosis", alias: ["icd10", "icd10gm"] }],
    ["29463-7", { type: "observationBodyWeight", alias: ["loinc"] }],         //Body weight
    ["39156-5", { type: "observationBMI", alias: ["loinc"] }],                //BMI
    ["72166-2", { type: "observation", alias: ["loinc"] }],                  //Smoking habit
    ["donor_age", { type: "age" }],
    ["date_of_diagnosis", { type: "conditionRangeDate" }],
    ["sample_kind", { type: "specimen", alias: ["SampleMaterialType"] }],
    ["storage_temperature", { type: "storageTemperature", alias: ["StorageTemperature"] }],
    ["pat_with_samples", { type: "hasSpecimen" }],
    ["diagnosis_age_donor", { type: "conditionRangeAge" }],
    ["fasting_status", { type: "fastingStatus", alias: ["FastingStatus"] }],
    ["sampling_date", { type: "samplingDate" }]
])