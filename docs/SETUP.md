# Panel Sintético Chile - Guía de Setup

## Requisitos Previos

1. **Supabase** (selfhost en Easypanel)
2. **Convex** (backend serverless)
3. **Node.js 18+** (desarrollo local)
4. **Python 3.10+** (generación de población)

---

## 1. Configuración de Supabase

### 1.1 Ejecutar Migraciones

En el SQL Editor de Supabase, ejecutar en orden:

```sql
-- 1. Schema inicial
-- Copiar contenido de: supabase/migrations/001_initial_schema.sql
```

```sql
-- 2. Población sintética (1500 agentes)
-- Copiar contenido de: supabase/migrations/002_synthetic_population.sql
```

### 1.2 Verificar Instalación

```sql
-- Contar agentes por región
SELECT region, COUNT(*) as count 
FROM agents 
GROUP BY region 
ORDER BY count DESC;

-- Verificar rasgos
SELECT COUNT(*) FROM agent_traits;
SELECT COUNT(*) FROM agent_memory;
SELECT COUNT(*) FROM agent_state;
```

### 1.3 Obtener Credenciales

En Supabase Dashboard:
1. Ir a **Settings** → **API**
2. Copiar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

---

## 2. Configuración de Convex

### 2.1 Instalar Dependencias

```bash
cd ai-town-main\ 2
npm install @supabase/supabase-js
```

### 2.2 Variables de Entorno en Convex

En [Convex Dashboard](https://dashboard.convex.cloud):

1. Ir a **Settings** → **Environment Variables**
2. Agregar:
   ```
   SUPABASE_URL=https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2.3 Deploy en Convex

```bash
npx convex deploy
```

---

## 3. Configuración en Easypanel

### 3.1 Variables de Entorno del Servicio

En el dashboard de Easypanel, configurar:

```bash
# Convex
VITE_CONVEX_URL=https://blessed-anaconda-376.convex.cloud

# Supabase
VITE_SUPABASE_URL=https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Producción
NODE_ENV=production
```

### 3.2 Build y Deploy

El Dockerfile ya está configurado para:
- Build de Vite
- Servir con nginx en puerto 3000
- Inyectar variables de entorno

---

## 4. Uso del Survey Engine

### 4.1 Ejecutar Encuesta de Calibración Cadem

```typescript
// Desde el frontend o consola de Convex
import { api } from './_generated/api';

// 1. Obtener preguntas de calibración
const questions = await ctx.runQuery(api.surveyEngine.getCademCalibrationQuestions);

// 2. Ejecutar encuesta a 100 agentes
const result = await ctx.runAction(api.surveyEngine.executeSurveyRun, {
  runId: 'cadem-2024-01',
  surveyId: 'cadem-calibration',
  agentIds: ['uuid-1', 'uuid-2', ...], // IDs de agentes
  questions: questions.map(q => ({
    code: q.code,
    type: q.type,
    topic: q.topic,
  })),
});

// 3. Obtener resultados
const stats = await ctx.runQuery(api.surveyEngine.getSurveyResults, {
  runId: 'cadem-2024-01',
});
```

### 4.2 Funciones Disponibles

| Función | Tipo | Descripción |
|---------|------|-------------|
| `getCademCalibrationQuestions` | query | Obtiene preguntas de calibración Cadem |
| `getAgentData` | action | Obtiene perfil completo de un agente |
| `registerResponse` | action | Registra respuesta en Supabase |
| `executeAgentSurvey` | action | Ejecuta encuesta a un agente |
| `executeSurveyRun` | action | Ejecuta encuesta a múltiples agentes |
| `getSurveyResults` | query | Obtiene resultados agregados |

### 4.3 Ejemplo de Resultado

```json
{
  "stats": [
    {
      "questionCode": "aprueba_boric",
      "avgScore": 0.42,
      "avgConfidence": 0.85,
      "responseCount": 1500
    },
    {
      "questionCode": "evaluacion_pais",
      "avgScore": 0.35,
      "avgConfidence": 0.78,
      "responseCount": 1500
    }
  ]
}
```

---

## 5. Motor de Respuestas

### 5.1 Factores de Cálculo

El score de respuesta se calcula como:

```
baseScore = 0.5  # Neutral

# Ajuste por ideología (para preguntas políticas)
if topic in ['aprobacion', 'gobierno', 'politica']:
    baseScore = 1 - ideology_score

# Ajuste por educación (para preguntas económicas)
if topic in ['economia', 'empleo', 'inflacion']:
    baseScore *= (1 - 0.2 * education_factor)

# Ajuste por estrés económico
if topic in ['economia', 'gobierno', 'pais']:
    baseScore *= (1 - 0.3 * economic_stress)

# Modificadores adicionales
baseScore += (institutional_trust - 0.5) * 0.3
baseScore *= 0.9 if risk_aversion > 0.7 else 1.0
baseScore = baseScore * (1 - social_desirability * 0.2) + 0.5 * social_desirability * 0.2
```

### 5.2 Configuración por Defecto

```typescript
const DEFAULT_CONFIG = {
  ideology_weight: 0.7,        // Peso de ideología
  trust_modifier: 0.3,         // Peso de confianza institucional
  economic_sensitivity: 0.5,   // Sensibilidad económica
  news_exposure_curve: 0.4,    // Influencia de eventos
  social_desirability_bias: 0.2, // Sesgo de deseabilidad
};
```

---

## 6. Troubleshooting

### Error: `function auth.jwt() does not exist`

**Solución:** El schema ya está actualizado para no usar `auth.jwt()`. Si persiste, verificar que las políticas RLS estén configuradas como `USING (TRUE)`.

### Error: `relation "benchmarks" does not exist`

**Solución:** Ejecutar `001_initial_schema.sql` completo. La tabla `benchmarks` debe crearse antes que `survey_runs`.

### Error: `syntax error at or near "Higgins"`

**Solución:** El script `generate_population.py` ya escapa apóstrofes. Regenerar el SQL si se modificó manualmente.

### Convex no encuentra variables de entorno

**Solución:** Verificar en Convex Dashboard → Settings → Environment Variables que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configuradas.

---

## 7. Recursos

- [Documentación de Producto](./product.md)
- [Arquitectura del Sistema](./architecture.md)
- [Modelo de Datos](./data_model.md)
- [Validación y Calibración](./validation.md)
- [Repositorio GitHub](https://github.com/brifyai/pulsosocialv2)