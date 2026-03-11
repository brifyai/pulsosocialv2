#!/usr/bin/env python3
"""
Generador de Población Sintética - Panel Chile
Genera 1.000-2.000 agentes sintéticos basados en datos demográficos del INE y CASEN
"""

import random
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import csv

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

POPULATION_SIZE = 1500  # Número de agentes a generar
OUTPUT_FILE = "synthetic_population.json"
SQL_OUTPUT_FILE = "synthetic_population.sql"

# ============================================================================
# DISTRIBUCIONES DEMOGRÁFICAS (Basadas en INE/CASEN 2022)
# ============================================================================

# Distribución por región (porcentaje aproximado)
REGIONS = {
    "Metropolitana": 0.405,
    "Valparaíso": 0.109,
    "Biobío": 0.095,
    "Maule": 0.053,
    "O'Higgins": 0.047,
    "Ñuble": 0.025,
    "Araucanía": 0.047,
    "Los Lagos": 0.047,
    "Los Ríos": 0.022,
    "Coquimbo": 0.042,
    "Tarapacá": 0.021,
    "Antofagasta": 0.035,
    "Atacama": 0.017,
    "Magallanes": 0.010,
    "Aysén": 0.006,
    "Arica y Parinacota": 0.013,
}

# Comunas principales por región
COMMUNES = {
    "Metropolitana": [
        ("Santiago", 0.15), ("Puente Alto", 0.12), ("Maipú", 0.10),
        ("La Florida", 0.08), ("Las Condes", 0.07), ("Peñalolén", 0.05),
        ("Ñuñoa", 0.05), ("Providencia", 0.04), ("La Pintana", 0.04),
        ("San Bernardo", 0.04), ("Quilicura", 0.04), ("Renca", 0.04),
        ("Conchalí", 0.03), ("Recoleta", 0.03), ("Cerrillos", 0.02),
        ("Other", 0.10)
    ],
    "Valparaíso": [
        ("Viña del Mar", 0.20), ("Valparaíso", 0.18), ("Quilpué", 0.10),
        ("Villa Alemana", 0.08), ("San Antonio", 0.07), ("Quillota", 0.06),
        ("Los Andes", 0.05), ("Other", 0.26)
    ],
    "Biobío": [
        ("Concepción", 0.25), ("Talcahuano", 0.15), ("Chillán", 0.12),
        ("Los Ángeles", 0.10), ("Coronel", 0.08), ("San Pedro de la Paz", 0.07),
        ("Other", 0.23)
    ],
    "Araucanía": [
        ("Temuco", 0.35), ("Padre Las Casas", 0.10), ("Villarrica", 0.08),
        ("Angol", 0.07), ("Pucón", 0.05), ("Other", 0.35)
    ],
}

# Distribución urbano/rural por región
URBAN_RURAL = {
    "Metropolitana": {"urbano": 0.98, "rural": 0.02},
    "Valparaíso": {"urbano": 0.85, "rural": 0.15},
    "Biobío": {"urbano": 0.82, "rural": 0.18},
    "Araucanía": {"urbano": 0.65, "rural": 0.35},
    "Maule": {"urbano": 0.60, "rural": 0.40},
    "default": {"urbano": 0.80, "rural": 0.20}
}

# Distribución por sexo y edad
SEX_DISTRIBUTION = {"femenino": 0.515, "masculino": 0.485}

AGE_GROUPS = {
    "18-24": (18, 24, 0.12),
    "25-34": (25, 34, 0.18),
    "35-44": (35, 44, 0.17),
    "45-54": (45, 54, 0.16),
    "55-64": (55, 64, 0.14),
    "65+": (65, 90, 0.23)
}

# Educación por grupo de edad (simplificado)
EDUCATION_BY_AGE = {
    "18-24": {
        "sin_estudios": 0.01, "basica_completa": 0.05, "media_incompleta": 0.25,
        "media_completa": 0.45, "tecnica_completa": 0.12, "universitaria_completa": 0.12
    },
    "25-34": {
        "sin_estudios": 0.02, "basica_completa": 0.05, "media_incompleta": 0.15,
        "media_completa": 0.35, "tecnica_completa": 0.18, "universitaria_completa": 0.25
    },
    "35-44": {
        "sin_estudios": 0.03, "basica_completa": 0.08, "media_incompleta": 0.15,
        "media_completa": 0.35, "tecnica_completa": 0.17, "universitaria_completa": 0.22
    },
    "45-54": {
        "sin_estudios": 0.05, "basica_completa": 0.12, "media_incompleta": 0.15,
        "media_completa": 0.35, "tecnica_completa": 0.15, "universitaria_completa": 0.18
    },
    "55-64": {
        "sin_estudios": 0.08, "basica_completa": 0.15, "media_incompleta": 0.15,
        "media_completa": 0.32, "tecnica_completa": 0.13, "universitaria_completa": 0.17
    },
    "65+": {
        "sin_estudios": 0.15, "basica_completa": 0.20, "media_incompleta": 0.15,
        "media_completa": 0.28, "tecnica_completa": 0.10, "universitaria_completa": 0.12
    }
}

# Ingreso por educación (deciles)
INCOME_BY_EDUCATION = {
    "sin_estudios": {1: 0.35, 2: 0.30, 3: 0.15, 4: 0.10, 5: 0.05, 6: 0.03, 7: 0.01, 8: 0.01, 9: 0.0, 10: 0.0},
    "basica_completa": {1: 0.25, 2: 0.25, 3: 0.20, 4: 0.12, 5: 0.08, 6: 0.05, 7: 0.03, 8: 0.02, 9: 0.0, 10: 0.0},
    "media_incompleta": {1: 0.15, 2: 0.20, 3: 0.20, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.05, 8: 0.03, 9: 0.02, 10: 0.0},
    "media_completa": {1: 0.08, 2: 0.12, 3: 0.15, 4: 0.18, 5: 0.15, 6: 0.12, 7: 0.08, 8: 0.06, 9: 0.04, 10: 0.02},
    "tecnica_completa": {1: 0.03, 2: 0.05, 3: 0.08, 4: 0.12, 5: 0.15, 6: 0.18, 7: 0.15, 8: 0.12, 9: 0.08, 10: 0.04},
    "universitaria_completa": {1: 0.01, 2: 0.02, 3: 0.03, 4: 0.05, 5: 0.08, 6: 0.12, 7: 0.15, 8: 0.18, 9: 0.18, 10: 0.18}
}

# Tipo de hogar por edad
HOUSEHOLD_BY_AGE = {
    "18-24": {"unipersonal": 0.15, "pareja_sin_hijos": 0.10, "pareja_con_hijos": 0.15, "monoparental": 0.05, "extendido": 0.35, "compuesto": 0.20},
    "25-34": {"unipersonal": 0.20, "pareja_sin_hijos": 0.25, "pareja_con_hijos": 0.30, "monoparental": 0.10, "extendido": 0.10, "compuesto": 0.05},
    "35-44": {"unipersonal": 0.10, "pareja_sin_hijos": 0.15, "pareja_con_hijos": 0.45, "monoparental": 0.15, "extendido": 0.10, "compuesto": 0.05},
    "45-54": {"unipersonal": 0.08, "pareja_sin_hijos": 0.15, "pareja_con_hijos": 0.45, "monoparental": 0.12, "extendido": 0.15, "compuesto": 0.05},
    "55-64": {"unipersonal": 0.12, "pareja_sin_hijos": 0.25, "pareja_con_hijos": 0.35, "monoparental": 0.08, "extendido": 0.15, "compuesto": 0.05},
    "65+": {"unipersonal": 0.25, "pareja_sin_hijos": 0.30, "pareja_con_hijos": 0.20, "monoparental": 0.05, "extendido": 0.15, "compuesto": 0.05}
}

# Conectividad
CONNECTIVITY = {
    "solo_movil": 0.25,
    "movil_fija": 0.45,
    "solo_fija": 0.15,
    "sin_conexion": 0.05,
    "banda_ancha_movil": 0.10
}

# Ocupaciones (simplificadas)
OCCUPATIONS = [
    "profesional", "tecnico", "comerciante", "oficinista", "estudiante",
    "jubilado", "trabajador_independiente", "trabajador_hogar", "desempleado",
    "agricultor", "pescador", "minero", "construccion", "servicios", "otro"
]

OCCUPATION_WEIGHTS = {
    "profesional": 0.15, "tecnico": 0.12, "comerciante": 0.08, "oficinista": 0.10,
    "estudiante": 0.08, "jubilado": 0.12, "trabajador_independiente": 0.10,
    "trabajador_hogar": 0.05, "desempleado": 0.06, "agricultor": 0.03,
    "pescador": 0.01, "minero": 0.02, "construccion": 0.04, "servicios": 0.03, "otro": 0.01
}

# ============================================================================
# FUNCIONES DE GENERACIÓN
# ============================================================================

def weighted_choice(choices: Dict[str, float]) -> str:
    """Selecciona un elemento basado en pesos probabilísticos"""
    items = list(choices.keys())
    weights = list(choices.values())
    return random.choices(items, weights=weights, k=1)[0]


def generate_age() -> tuple:
    """Genera edad y grupo etario"""
    group = weighted_choice({k: v[2] for k, v in AGE_GROUPS.items()})
    min_age, max_age, _ = AGE_GROUPS[group]
    age = random.randint(min_age, max_age)
    return age, group


def generate_agent() -> Dict[str, Any]:
    """Genera un agente sintético completo"""
    # Región y comuna
    region = weighted_choice(REGIONS)
    
    # Comuna (usar default si región no está en el diccionario)
    communes_list = COMMUNES.get(region, [("Other", 1.0)])
    comuna = weighted_choice({c[0]: c[1] for c in communes_list})
    
    # Urbano/rural
    ur_dist = URBAN_RURAL.get(region, URBAN_RURAL["default"])
    urban_rural = weighted_choice(ur_dist)
    
    # Sexo
    sex = weighted_choice(SEX_DISTRIBUTION)
    
    # Edad
    age, age_group = generate_age()
    
    # Educación (basada en edad)
    education = weighted_choice(EDUCATION_BY_AGE[age_group])
    
    # Ingreso (basado en educación)
    income_decile = weighted_choice(INCOME_BY_EDUCATION[education])
    
    # Ocupación
    occupation = weighted_choice(OCCUPATION_WEIGHTS)
    
    # Tipo de hogar
    household_type = weighted_choice(HOUSEHOLD_BY_AGE[age_group])
    
    # Conectividad
    connectivity_type = weighted_choice(CONNECTIVITY)
    
    # Peso estadístico (simplificado)
    weight = round(random.uniform(0.8, 1.2), 4)
    
    return {
        "id": str(uuid.uuid4()),
        "region": region,
        "comuna": comuna,
        "urban_rural": urban_rural,
        "sex": sex,
        "age": age,
        "education": education,
        "income_decile": income_decile,
        "occupation": occupation,
        "household_type": household_type,
        "connectivity_type": connectivity_type,
        "weight": weight
    }


def generate_traits(agent: Dict[str, Any]) -> Dict[str, Any]:
    """Genera rasgos psicológicos para un agente"""
    # Los rasgos tienen correlaciones con educación y edad
    
    education_level = {
        "sin_estudios": 0, "basica_completa": 1, "media_incompleta": 2,
        "media_completa": 3, "tecnica_completa": 4, "universitaria_completa": 5
    }
    edu_score = education_level.get(agent["education"], 3) / 5.0
    
    # Digital literacy correlacionado con educación y edad inversa
    age_factor = (100 - agent["age"]) / 82.0
    digital_literacy = round(0.3 * edu_score + 0.7 * age_factor + random.uniform(-0.15, 0.15), 4)
    digital_literacy = max(0, min(1, digital_literacy))
    
    # Civic interest correlacionado con educación
    civic_interest = round(0.4 * edu_score + 0.4 + random.uniform(-0.2, 0.2), 4)
    civic_interest = max(0, min(1, civic_interest))
    
    # Institutional trust - más variable
    institutional_trust = round(random.uniform(0.15, 0.65), 4)
    
    # Risk aversion - correlacionado con edad
    risk_aversion = round(0.3 + 0.4 * (agent["age"] / 100) + random.uniform(-0.2, 0.2), 4)
    risk_aversion = max(0, min(1, risk_aversion))
    
    # Patience
    patience = round(random.uniform(0.2, 0.8), 4)
    
    # Social desirability bias
    social_desirability = round(random.uniform(0.3, 0.7), 4)
    
    # Openness to change - correlacionado inverso con edad
    openness_to_change = round(0.7 - 0.4 * (agent["age"] / 100) + random.uniform(-0.15, 0.15), 4)
    openness_to_change = max(0, min(1, openness_to_change))
    
    # Ideology - distribución normal centrada
    ideology_score = round(random.gauss(0.5, 0.2), 4)
    ideology_score = max(0, min(1, ideology_score))
    
    # Nationalism
    nationalism_score = round(random.uniform(0.3, 0.8), 4)
    
    return {
        "agent_id": agent["id"],
        "institutional_trust": institutional_trust,
        "risk_aversion": risk_aversion,
        "digital_literacy": digital_literacy,
        "patience": patience,
        "civic_interest": civic_interest,
        "social_desirability": social_desirability,
        "openness_to_change": openness_to_change,
        "ideology_score": ideology_score,
        "nationalism_score": nationalism_score
    }


def generate_memory(agent: Dict[str, Any]) -> Dict[str, Any]:
    """Genera memoria inicial para un agente"""
    topics = ["economia", "salud", "educacion", "seguridad", "vivienda", "pensiones", "medio_ambiente"]
    salient = random.sample(topics, k=random.randint(1, 3))
    
    # Escapar apóstrofes en el summary para SQL
    region_escaped = escape_sql_string(agent["region"])
    education_escaped = escape_sql_string(agent["education"])
    
    return {
        "agent_id": agent["id"],
        "summary": f"Agente de {region_escaped}, {agent['age']} años, {education_escaped}",
        "salient_topics": salient,
        "previous_positions": {},
        "contradiction_score": round(random.uniform(0, 0.2), 4),
        "updated_at": datetime.now().isoformat(),
        "memory_version": 1
    }


def generate_state(agent: Dict[str, Any]) -> Dict[str, Any]:
    """Genera estado inicial para un agente"""
    return {
        "agent_id": agent["id"],
        "fatigue": round(random.uniform(0, 0.3), 4),
        "economic_stress": round(random.uniform(0.2, 0.6), 4),
        "mood": round(random.uniform(0.4, 0.7), 4),
        "survey_saturation": 0,
        "last_activation_at": None,
        "updated_at": datetime.now().isoformat()
    }


# ============================================================================
# GENERACIÓN DE SQL
# ============================================================================

def escape_sql_string(s: str) -> str:
    """Escapa apóstrofes para strings SQL"""
    return s.replace("'", "''")


def generate_insert_sql(agents: List[Dict], traits: List[Dict], 
                        memories: List[Dict], states: List[Dict]) -> str:
    """Genera archivo SQL con INSERTs"""
    
    sql_parts = []
    sql_parts.append("-- ============================================================================")
    sql_parts.append("-- POBLACIÓN SINTÉTICA GENERADA AUTOMÁTICAMENTE")
    sql_parts.append(f"-- Fecha: {datetime.now().isoformat()}")
    sql_parts.append(f"-- Tamaño: {len(agents)} agentes")
    sql_parts.append("-- ============================================================================\n")
    
    # Agents
    sql_parts.append("-- INSERTS: agents")
    sql_parts.append("INSERT INTO agents (id, region, comuna, urban_rural, sex, age, education, income_decile, occupation, household_type, connectivity_type, weight, created_at, updated_at, version) VALUES")
    
    agent_values = []
    for a in agents:
        agent_values.append(f"""(
    '{a['id']}', '{escape_sql_string(a['region'])}', '{escape_sql_string(a['comuna'])}', '{a['urban_rural']}', 
    '{a['sex']}', {a['age']}, '{a['education']}', {a['income_decile']}, 
    '{escape_sql_string(a['occupation'])}', '{a['household_type']}', '{a['connectivity_type']}', 
    {a['weight']}, NOW(), NOW(), 1
)""")
    sql_parts.append(",\n".join(agent_values) + ";")
    
    # Traits
    sql_parts.append("\n-- INSERTS: agent_traits")
    sql_parts.append("INSERT INTO agent_traits (agent_id, institutional_trust, risk_aversion, digital_literacy, patience, civic_interest, social_desirability, openness_to_change, ideology_score, nationalism_score, created_at, updated_at) VALUES")
    
    trait_values = []
    for t in traits:
        trait_values.append(f"""(
    '{t['agent_id']}', {t['institutional_trust']}, {t['risk_aversion']}, 
    {t['digital_literacy']}, {t['patience']}, {t['civic_interest']}, 
    {t['social_desirability']}, {t['openness_to_change']}, 
    {t['ideology_score']}, {t['nationalism_score']}, NOW(), NOW()
)""")
    sql_parts.append(",\n".join(trait_values) + ";")
    
    # Memory
    sql_parts.append("\n-- INSERTS: agent_memory")
    sql_parts.append("INSERT INTO agent_memory (agent_id, summary, salient_topics, previous_positions, contradiction_score, updated_at, memory_version) VALUES")
    
    memory_values = []
    for m in memories:
        topics_str = "ARRAY[" + ", ".join(f"'{t}'" for t in m['salient_topics']) + "]"
        memory_values.append(f"""(
    '{m['agent_id']}', '{m['summary']}', {topics_str}, 
    '{{}}'::jsonb, {m['contradiction_score']}, NOW(), {m['memory_version']}
)""")
    sql_parts.append(",\n".join(memory_values) + ";")
    
    # State
    sql_parts.append("\n-- INSERTS: agent_state")
    sql_parts.append("INSERT INTO agent_state (agent_id, fatigue, economic_stress, mood, survey_saturation, last_activation_at, updated_at) VALUES")
    
    state_values = []
    for s in states:
        state_values.append(f"""(
    '{s['agent_id']}', {s['fatigue']}, {s['economic_stress']}, 
    {s['mood']}, {s['survey_saturation']}, NULL, NOW()
)""")
    sql_parts.append(",\n".join(state_values) + ";")
    
    return "\n".join(sql_parts)


# ============================================================================
# MAIN
# ============================================================================

def main():
    print(f"Generando población sintética de {POPULATION_SIZE} agentes...")
    print("=" * 60)
    
    agents = []
    traits = []
    memories = []
    states = []
    
    for i in range(POPULATION_SIZE):
        agent = generate_agent()
        agents.append(agent)
        traits.append(generate_traits(agent))
        memories.append(generate_memory(agent))
        states.append(generate_state(agent))
        
        if (i + 1) % 100 == 0:
            print(f"  Generados {i + 1} agentes...")
    
    print("=" * 60)
    print(f"✓ {len(agents)} agentes generados")
    print(f"✓ {len(traits)} rasgos psicológicos generados")
    print(f"✓ {len(memories)} memorias generadas")
    print(f"✓ {len(states)} estados generados")
    
    # Guardar JSON
    data = {
        "generated_at": datetime.now().isoformat(),
        "population_size": POPULATION_SIZE,
        "agents": agents,
        "traits": traits,
        "memories": memories,
        "states": states
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Datos guardados en {OUTPUT_FILE}")
    
    # Guardar SQL
    sql = generate_insert_sql(agents, traits, memories, states)
    with open(SQL_OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"✓ SQL guardado en {SQL_OUTPUT_FILE}")
    
    # Estadísticas demográficas
    print("\n" + "=" * 60)
    print("ESTADÍSTICAS DEMOGRÁFICAS")
    print("=" * 60)
    
    # Por región
    region_counts = {}
    for a in agents:
        region_counts[a["region"]] = region_counts.get(a["region"], 0) + 1
    
    print("\nDistribución por región:")
    for region, count in sorted(region_counts.items(), key=lambda x: -x[1]):
        pct = count / len(agents) * 100
        print(f"  {region}: {count} ({pct:.1f}%)")
    
    # Por sexo
    sex_counts = {}
    for a in agents:
        sex_counts[a["sex"]] = sex_counts.get(a["sex"], 0) + 1
    
    print("\nDistribución por sexo:")
    for sex, count in sorted(sex_counts.items()):
        pct = count / len(agents) * 100
        print(f"  {sex}: {count} ({pct:.1f}%)")
    
    # Por grupo de edad
    age_groups_count = {"18-29": 0, "30-44": 0, "45-64": 0, "65+": 0}
    for a in agents:
        if a["age"] <= 29:
            age_groups_count["18-29"] += 1
        elif a["age"] <= 44:
            age_groups_count["30-44"] += 1
        elif a["age"] <= 64:
            age_groups_count["45-64"] += 1
        else:
            age_groups_count["65+"] += 1
    
    print("\nDistribución por edad:")
    for group, count in age_groups_count.items():
        pct = count / len(agents) * 100
        print(f"  {group}: {count} ({pct:.1f}%)")
    
    # Por educación
    edu_counts = {}
    for a in agents:
        edu_counts[a["education"]] = edu_counts.get(a["education"], 0) + 1
    
    print("\nDistribución por educación:")
    for edu, count in sorted(edu_counts.items(), key=lambda x: -x[1]):
        pct = count / len(agents) * 100
        print(f"  {edu}: {count} ({pct:.1f}%)")
    
    print("\n" + "=" * 60)
    print("Generación completada exitosamente!")


if __name__ == "__main__":
    main()