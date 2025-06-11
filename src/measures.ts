export const patientsMeasureBbmri = {
	key: 'bbmri-patients',
	measure: {
		code: {
			text: 'patients'
		},
		population: [
			{
				code: {
					coding: [
						{
							system: 'http://terminology.hl7.org/CodeSystem/measure-population',
							code: 'initial-population'
						}
					]
				},
				criteria: {
					language: 'text/cql-identifier',
					expression: 'InInitialPopulation'
				}
			}
		],
		stratifier: [
			{
				code: {
					text: 'Age'
				},
				criteria: {
					language: 'text/cql',
					expression: 'AgeClass'
				}
			},
			{
				code: {
					text: 'Gender'
				},
				criteria: {
					language: 'text/cql',
					expression: 'Gender'
				}
			},
			{
				code: {
					text: 'Custodian'
				},
				criteria: {
					language: 'text/cql',
					expression: 'Custodian'
				}
			}
		]
	},
	cql: `
define AgeClass:
if (Patient.birthDate is null) then 'unknown' else ToString((AgeInYears() div 10) * 10)

define Gender:
if (Patient.gender is null) then 'unknown' else Patient.gender

define Custodian:
    First(from Specimen.extension E
    where E.url = 'https://fhir.bbmri.de/StructureDefinition/Custodian'
    return (E.value as Reference).identifier.value)
`
};

export const patientsMeasureBbmriProd = {
	key: 'bbmri-patients',
	measure: {
		code: {
			text: 'patients'
		},
		population: [
			{
				code: {
					coding: [
						{
							system: 'http://terminology.hl7.org/CodeSystem/measure-population',
							code: 'initial-population'
						}
					]
				},
				criteria: {
					language: 'text/cql-identifier',
					expression: 'InInitialPopulation'
				}
			}
		],
		stratifier: [
			{
				code: {
					text: 'Age'
				},
				criteria: {
					language: 'text/cql',
					expression: 'AgeClass'
				}
			},
			{
				code: {
					text: 'Gender'
				},
				criteria: {
					language: 'text/cql',
					expression: 'Gender'
				}
			},
			{
				code: {
					text: 'Custodian'
				},
				criteria: {
					language: 'text/cql',
					expression: 'Custodian'
				}
			}
		]
	},
	cql: `
BBMRI_STRAT_AGE_STRATIFIER

BBMRI_STRAT_GENDER_STRATIFIER

BBMRI_STRAT_CUSTODIAN_STRATIFIER
`
};

export const diagnosisMeasureBbmri = {
	key: 'bbmri-diagnosis',
	measure: {
		code: {
			text: 'diagnosis'
		},
		extension: [
			{
				url: 'http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/cqfm-populationBasis',
				valueCode: 'Condition'
			}
		],
		population: [
			{
				code: {
					coding: [
						{
							system: 'http://terminology.hl7.org/CodeSystem/measure-population',
							code: 'initial-population'
						}
					]
				},
				criteria: {
					language: 'text/cql-identifier',
					expression: 'Diagnosis'
				}
			}
		],
		stratifier: [
			{
				code: {
					text: 'diagnosis'
				},
				criteria: {
					language: 'text/cql-identifier',
					expression: 'DiagnosisCode'
				}
			}
		]
	},
	cql: `
define Diagnosis:
if InInitialPopulation then [Condition] else {} as List<Condition>

define function DiagnosisCode(condition FHIR.Condition):
condition.code.coding.where(system = 'http://fhir.de/CodeSystem/bfarm/icd-10-gm').code.first()

define function DiagnosisCode(condition FHIR.Condition, specimen FHIR.Specimen):
Coalesce(
  condition.code.coding.where(system = 'http://hl7.org/fhir/sid/icd-10').code.first(),
  condition.code.coding.where(system = 'http://fhir.de/CodeSystem/dimdi/icd-10-gm').code.first(),
  specimen.extension.where(url='https://fhir.bbmri.de/StructureDefinition/SampleDiagnosis').value.coding.code.first(),
  condition.code.coding.where(system = 'http://fhir.de/CodeSystem/bfarm/icd-10-gm').code.first()
  )
`
};

export const diagnosisMeasureBbmriProd = {
	key: 'bbmri-diagnosis',
	measure: {
		code: {
			text: 'diagnosis'
		},
		extension: [
			{
				url: 'http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/cqfm-populationBasis',
				valueCode: 'Condition'
			}
		],
		population: [
			{
				code: {
					coding: [
						{
							system: 'http://terminology.hl7.org/CodeSystem/measure-population',
							code: 'initial-population'
						}
					]
				},
				criteria: {
					language: 'text/cql-identifier',
					expression: 'Diagnosis'
				}
			}
		],
		stratifier: [
			{
				code: {
					text: 'diagnosis'
				},
				criteria: {
					language: 'text/cql-identifier',
					expression: 'DiagnosisCode'
				}
			}
		]
	},
	cql: `
BBMRI_STRAT_DIAGNOSIS_STRATIFIER
`
};

export const specimenMeasureBbmri = {
	key: 'bbmri-specimen',
	measure: {
		code: {
			text: 'specimen'
		},
		extension: [
			{
				url: 'http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/cqfm-populationBasis',
				valueCode: 'Specimen'
			}
		],
		population: [
			{
				code: {
					coding: [
						{
							system: 'http://terminology.hl7.org/CodeSystem/measure-population',
							code: 'initial-population'
						}
					]
				},
				criteria: {
					language: 'text/cql-identifier',
					expression: 'Specimen'
				}
			}
		],
		stratifier: [
			{
				code: {
					text: 'sample_kind'
				},
				criteria: {
					language: 'text/cql',
					expression: 'SampleType'
				}
			}
		]
	},
	cql: `
define function SampleType(specimen FHIR.Specimen):
    case FHIRHelpers.ToCode(specimen.type.coding.where(system = 'https://fhir.bbmri.de/CodeSystem/SampleMaterialType').first())
       when Code 'plasma-edta' from SampleMaterialType then 'blood-plasma'
       when Code 'plasma-citrat' from SampleMaterialType then 'blood-plasma'
       when Code 'plasma-heparin' from SampleMaterialType then 'blood-plasma'
       when Code 'plasma-cell-free' from SampleMaterialType then 'blood-plasma'
       when Code 'plasma-other' from SampleMaterialType then 'blood-plasma'
       when Code 'plasma' from SampleMaterialType then 'blood-plasma'
       when Code 'tissue-formalin' from SampleMaterialType then 'tissue-ffpe'
       when Code 'tumor-tissue-ffpe' from SampleMaterialType then 'tissue-ffpe'
       when Code 'normal-tissue-ffpe' from SampleMaterialType then 'tissue-ffpe'
       when Code 'other-tissue-ffpe' from SampleMaterialType then 'tissue-ffpe'
       when Code 'tumor-tissue-frozen' from SampleMaterialType then 'tissue-frozen'
       when Code 'normal-tissue-frozen' from SampleMaterialType then 'tissue-frozen'
       when Code 'other-tissue-frozen' from SampleMaterialType then 'tissue-frozen'
       when Code 'tissue-paxgene-or-else' from SampleMaterialType then 'tissue-other'
       when Code 'derivative' from SampleMaterialType then 'derivative-other'
       when Code 'liquid' from SampleMaterialType then 'liquid-other'
       when Code 'tissue' from SampleMaterialType then 'tissue-other'
       when Code 'serum' from SampleMaterialType then 'blood-serum'
       when Code 'cf-dna' from SampleMaterialType then 'dna'
       when Code 'g-dna' from SampleMaterialType then 'dna'
       when Code 'blood-plasma' from SampleMaterialType then 'blood-plasma'
       when Code 'tissue-ffpe' from SampleMaterialType then 'tissue-ffpe'
       when Code 'tissue-frozen' from SampleMaterialType then 'tissue-frozen'
       when Code 'tissue-other' from SampleMaterialType then 'tissue-other'
       when Code 'derivative-other' from SampleMaterialType then 'derivative-other'
       when Code 'liquid-other' from SampleMaterialType then 'liquid-other'
       when Code 'blood-serum' from SampleMaterialType then 'blood-serum'
       when Code 'dna' from SampleMaterialType then 'dna'
       when Code 'buffy-coat' from SampleMaterialType then 'buffy-coat'
       when Code 'urine' from SampleMaterialType then 'urine'
       when Code 'ascites' from SampleMaterialType then 'ascites'
       when Code 'saliva' from SampleMaterialType then 'saliva'
       when Code 'csf-liquor' from SampleMaterialType then 'csf-liquor'
       when Code 'bone-marrow' from SampleMaterialType then 'bone-marrow'
       when Code 'peripheral-blood-cells-vital' from SampleMaterialType then 'peripheral-blood-cells-vital'
       when Code 'stool-faeces' from SampleMaterialType then 'stool-faeces'
       when Code 'rna' from SampleMaterialType then 'rna'
       when Code 'whole-blood' from SampleMaterialType then 'whole-blood'
       when Code 'swab' from SampleMaterialType then 'swab'
       when Code 'dried-whole-blood' from SampleMaterialType then 'dried-whole-blood'
       when null  then 'Unknown'
       else 'Unknown'
   end
define Specimen:
`
};

export const specimenMeasureBbmriProd = {
	key: 'bbmri-specimen',
	measure: {
		code: {
			text: 'specimen'
		},
		extension: [
			{
				url: 'http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/cqfm-populationBasis',
				valueCode: 'Specimen'
			}
		],
		population: [
			{
				code: {
					coding: [
						{
							system: 'http://terminology.hl7.org/CodeSystem/measure-population',
							code: 'initial-population'
						}
					]
				},
				criteria: {
					language: 'text/cql-identifier',
					expression: 'Specimen'
				}
			}
		],
		stratifier: [
			{
				code: {
					text: 'sample_kind'
				},
				criteria: {
					language: 'text/cql',
					expression: 'SampleType'
				}
			}
		]
	},
	cql: `
BBMRI_STRAT_SAMPLE_TYPE_STRATIFIER

BBMRI_STRAT_DEF_SPECIMEN
    if InInitialPopulation then [Specimen] else {} as List<Specimen>

`
};
