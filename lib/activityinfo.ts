import { GBVCase } from "./types";
import { prioritizeCases, fmtViolence } from "./risk-calculator";
import { validateActivityInfoResponse } from "./validation";

const TOKEN = process.env.ACTIVITYINFO_TOKEN;
const FORM_URL = "https://www.activityinfo.org/resources/query/v43/form/ck0nbfrmg0iku4c1hdk";

const COLUMN_MAP: Record<string, string> = {
  _id: "record_id",
  _lastEditTime: "last_edit_time",
  "ID do Incidente": "case_id",
  "Qual projeto": "project",
  Parceiro: "partner",
  "nome_gestor.Name": "case_manager",
  data_incident: "incident_date",
  data_identf: "identification_date",
  data_entrev: "interview_date",
  "Data do encerramento": "closure_date",
  "Faixa etaria da sobrevivente": "age_group",
  sexo: "sex",
  "Estado Civil": "marital_status",
  "Pessoa com deficiência": "disability",
  "Necessidades específicas / Vulnerabilidades": "vulnerabilities",
  "distrito.Province.name": "province",
  "distrito.Name": "district",
  "País de origem do sobrevivente": "origin_country",
  tipo_viol: "violence_type",
  "Descrição  do incidente": "incident_description_short",
  "Relato do incidente / Descrição do incidente": "incident_description",
  "Número de alegado(s) perpetrador(es)": "perpetrator_count",
  "sexo_do_alegado_prepetrador": "perpetrator_sex",
  Idade: "perpetrator_age",
  "Relação do alegado perpetrador com o sobrevivente": "perpetrator_relationship",
  "Foi sobrevivente encaminhado para uma casa/abrigo seguro?": "referred_safe_house",
  "O sobrevivente foi encaminhado para serviços médicos?": "referred_medical",
  "O sobrevivente foi encaminhado para serviços psicossociais?": "referred_psychosocial",
  "O sobrevivente foi encaminhado para um serviço de polícia/segurança?": "referred_police",
  "O sobrevivente foi encaminhado para serviços jurídicos?": "referred_legal",
  "O sobrevivente foi encaminhado para serviços de protecção de menores?": "referred_child_protection",
  "O sobrevivente foi encaminhado para serviços de subsistência?": "referred_livelihood",
  "Data de encaminhado para uma casa/abrigo seguro": "date_referred_safe_house",
  "Data de encaminhamento para serviçoes médicos": "date_referred_medical",
  "Data de encaminhado para serviços psicossociais": "date_referred_psychosocial",
  "Data de encaminhado para um serviço de polícia/segurança": "date_referred_police",
  "Descreva o estado emocional do sobrevivente no início da entrevista:": "emotional_state",
  "Será que o sobrevivente estará seguro quando ele ou ela partir?": "is_safe",
  "Porque não": "why_not_safe",
  "Que medidas foram tomadas para garantir a segurança do sobrevivente?": "safety_measures",
  "Estado do caso": "case_status",
  "Motivos do encerramento": "closure_reason",
  "O Caso foi Validado": "validated",
  Consentimento: "consent",
  Proveniencia: "source",
  "Gostaria de dar seguimento ao caso?": "wants_followup",
  "O sobrevivente relatou este incidente em algum outro lugar?": "reported_elsewhere",
  "O sobrevivente teve algum incidente anterior de VBG perpetrado contra ele?": "previous_incident",
  "Quem lhe encaminhou este sobrevivente?": "referred_by",
};

async function fetchActivityInfoRaw(): Promise<any[]> {
  if (!TOKEN) throw new Error("ACTIVITYINFO_TOKEN not configured");
  const res = await fetch(FORM_URL, {
    headers: { Authorization: "Basic " + Buffer.from("user:" + TOKEN).toString("base64") },
  });
  if (!res.ok) throw new Error(`ActivityInfo API error: ${res.status}`);
  const data = await res.json();

  const validation = validateActivityInfoResponse(data);
  if (!validation.valid) {
    console.warn("ActivityInfo validation:", validation.message);
  }

  return data;
}

export async function fetchAllCases(): Promise<GBVCase[]> {
  const data = await fetchActivityInfoRaw();
  if (!Array.isArray(data)) throw new Error(`Expected array, got ${typeof data}`);

  const cases: GBVCase[] = data.map((row: any) => {
    const c: any = {};
    for (const [from, to] of Object.entries(COLUMN_MAP)) {
      if (from in row) c[to] = row[from];
    }
    c.violence_type_short = fmtViolence(c.violence_type);
    return c as GBVCase;
  });

  return cases;
}

export async function loadOpenCases(): Promise<GBVCase[]> {
  const all = await fetchAllCases();
  const open = all.filter(c => c.case_status === "Aberto");
  return prioritizeCases(open);
}

export async function loadAllCases(): Promise<GBVCase[]> {
  return fetchAllCases();
}
