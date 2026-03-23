import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chatCompletion } from '$lib/server/ai';

const staticPromptParts = [
	'You are an expert in Biobanks and patient data.',
	'You can analyze queries in free text and generate JSON with the following elements:',
	'gender (a simple string),',
	'diagnosis (convert named diagnoses into a list of ICD-10 codes like A02 or C45.1),',
	'age_at_diagnosis (a map, with explicit lower and upper values),',
	'date_of_diagnosis (a map, with explicit lower and upper values),',
	'donor_age (a map, with explicit lower and upper values),',
	'sample_type (a list containing zero or more of the following: blood-serum, tissue-frozen, whole-blood, blood-plasma, derivative-other, tissue-other, peripheral-blood-cells-vital, urine, rna, liquid-other, buffy-coat, dna, csf-liquor, stool-faeces, bone-marrow, tissue-ffpe, saliva, ascites, swab, dried-whole-blood),',
	'sampling_date (a map, with explicit lower and upper values),',
	'sample_storage_temperature (a list),',
	'country (a list of two letter country codes, e.g. DE),',
	'collection_type (a list containing zero or more of the following: BIRTH_COHORT, CASE_CONTROL, COHORT, CROSS_SECTIONAL, DISEASE_SPECIFIC, IMAGE, HOSPITAL, LONGITUDINAL, NON_HUMAN, POPULATION_BASED, TWIN_STUDY),',
	'category (a list containing zero or more of the following: autoimmune,cardiovascular,covid19,infectious,metabolic,nervous_system,oncology,paediatrics,population,rare_disease),',
	'service_type (a list containing zero or more of the following: ai-consulting,algorithm-design,animal-model-development,assay-development,BehavioralScience,BigDataManagement,Bioimage-analysis,biomarker-discovery,biostatistic-services,BrainNeurologicalResearch,CancerResearch,cell-line-development,CertificationPrograms,clinical-chemistry-services,CollaborationNetworkingMulticentricStudies,ComputingServices,ConsultationProtocolDevelopment,data-analysis,Diagnostic-Imaging-Service,EpidemiologyInfectiousDiseaseResearch,ethics-proposal-review,functional-and-system-analytics,genomic-annotation,genomics-analysis,Histology-Tissue-Analysis,informed-consent-management,lipidomics-analysis,Live-Cell-Imaging,metabolomics-analysis,microbiome-analysis,MicrobiomeStudies,Microscopy-Techniques,MRI-CT-Imaging,nucleic-acid-extraction,otherBiobankingElsiServices,otherBioinformaticsDataScienceServices,otherConsultingTrainingEducationServices,otherPathologyImagingServices,OtherResearchDomains,otherSampleBioanalyticalServices,PathologySupport,PediatricResearch,peptide-carbohydrate-lipid-analytics,PET-Scans,pharmacokinetic-pharmacodynamic-services,protein-analytics,protein-purification,proteomics-analysis,RareDiseaseResearch,sample-collection,sample-data-management,sample-processing,sample-quality-control,sample-storage,ScientificAdvisoryClinicalStudies,sequencing,software-development,StrategicPlanningforClinicalStudies,tissue-culture,toxicology-testing,TrainingResourceLabProtocols,transcriptomics-analysis),',
	'Return only valid JSON.',
	'Please convert the following text into JSON:'
];

const staticPrompt = staticPromptParts.join(' ');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { searchText } = await request.json();

		if (typeof searchText !== 'string' || !searchText.trim()) {
			return json({ error: 'searchText is required' }, { status: 400 });
		}

		const raw = await chatCompletion([
			{ role: 'system', content: staticPrompt },
			{ role: 'user', content: searchText }
		]);

		if (!raw) {
			return json({ error: 'AI query failed' }, { status: 502 });
		}

		return json({ raw });
	} catch (error) {
		console.error('AI route error:', error);
		return json({ error: 'Invalid request' }, { status: 400 });
	}
};
