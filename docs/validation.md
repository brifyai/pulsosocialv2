# Validación y Calibración

## Visión General

La validación es el componente crítico que diferencia este sistema de un simple generador de texto. Cada respuesta sintética debe ser comparable con datos reales y el sistema debe poder auto-corregirse.

## Principios de Validación

1. **Nunca confiar ciegamente en el LLM**: El LLM solo expresa, no decide
2. **Validación continua**: Comparar constantemente con benchmarks reales
3. **Múltiples fuentes**: No depender de una sola encuestadora
4. **Trazabilidad completa**: Cada respuesta debe poder auditarse
5. **Recalibración periódica**: Los parámetros deben ajustarse con el tiempo

---

## Métricas de Validación

### Métricas Principales

| Métrica | Descripción | Fórmula | Objetivo V1 |
|---------|-------------|---------|-------------|
| **MAE** | Error absoluto medio | `mean(|sintético - real|)` | < 5 pp |
| **RMSE** | Raíz del error cuadrático medio | `sqrt(mean((sintético - real)²))` | < 7 pp |
| **Max Error** | Máximo error absoluto | `max(|sintético - real|)` | < 10 pp |
| **Direccionalidad** | % de veces que acierta dirección de cambio | `mean(sign(sintético) == sign(real))` | > 80% |
| **Estabilidad** | Consistencia entre corridas | `std(respuestas_mismo_agente)` | Baja varianza |

### Métricas por Segmento

Validar también por subgrupos:
- Región (RM, Valparaíso, Biobío, etc.)
- Edad (18-29, 30-44, 45-64, 65+)
- Educación (baja, media, alta)
- Income decile (1-3, 4-6, 7-10)

---

## Benchmarks de Referencia

### Fuentes Prioritarias

| Fuente | Tipo | Frecuencia | Acceso |
|--------|------|------------|--------|
| **Cadem** | Privada | Semanal | Público (parcial) |
| **CEP** | Académica | Semestral | Público |
| **Pulso Ciudadano** | Privada | Mensual | Público |
| **CEN** | Gobierno | Anual | Público |
| **CASEN** | Gobierno | Bienal | Público |

### Preguntas de Calibración Inicial

Basado en encuestas Cadem disponibles:

| Código | Pregunta | Tipo | Opciones |
|--------|----------|------|----------|
| `aprueba_boric` | Aprobación presidencial | Escala 1-7 | Aprueba/Desaprueba/NsNc |
| `aprueba_gobierno` | Aprobación del gobierno | Escala 1-7 | Aprueba/Desaprueba/NsNc |
| `evaluacion_pais` | ¿Cómo va el país? | Escala 1-7 | Muy bien → Muy mal |
| `expectativas_futuro` | Expectativas para el próximo año | Categórica | Mejor/Igual/Peor |
| `situacion_economica` | Situación económica personal | Escala 1-7 | Muy buena → Muy mala |
| `noticia_semana` | Noticia más importante de la semana | Abierta | Categorizar |
| `tension_cable` | Tensión por cable submarino | Escala 1-7 | Muy preocupado → Nada preocupado |
| `socio_estrategico` | Socio estratégico preferido | Múltiple | EE.UU./China/Ninguno |
| `economia_abierta` | ¿Economía abierta o protegida? | Binaria | Abierta/Protegida |

---

## Proceso de Calibración

### Fase 1: Calibración Inicial

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Datos reales   │────▶│  Calcular       │────▶│  Establecer     │
│  (Cadem, CEP)   │     │  distribuciones │     │  líneas base    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Ajustar        │◀────│  Comparar       │◀────│  Ejecutar       │
│  parámetros     │     │  sintético-real │     │  simulación     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Parámetros a calibrar:**

| Parámetro | Descripción | Rango | Impacto |
|-----------|-------------|-------|---------|
| `ideology_weight` | Peso de ideología en respuestas | 0-1 | Alto |
| `trust_modifier` | Modificador por confianza institucional | -0.5 a 0.5 | Medio |
| `economic_sensitivity` | Sensibilidad a noticias económicas | 0-1 | Alto |
| `news_exposure_curve` | Curva de exposición a noticias | 0-1 | Medio |
| `social_desirability_bias` | Sesgo por deseabilidad social | 0-0.5 | Medio |

### Fase 2: Recalibración Continua

**Frecuencia recomendada:**
- Recalibración ligera: Semanal (ajustar parámetros menores)
- Recalibración completa: Mensual (revisar distribuciones)
- Recalibración post-evento: Después de eventos mayores

**Disparadores de recalibración:**
- Error MAE > 7% por 2 semanas consecutivas
- Cambio de gobierno o evento político mayor
- Nueva encuesta de referencia disponible
- Drift detectado en distribuciones

---

## Módulo de Validación (Python)

### Estructura del Módulo

```python
# python/calibration/validator.py

from dataclasses import dataclass
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

@dataclass
class ValidationMetrics:
    mae: float
    rmse: float
    max_error: float
    directionality: float
    by_segment: Dict[str, float]
    
@dataclass
class CalibrationResult:
    previous_params: Dict[str, float]
    new_params: Dict[str, float]
    improvement: float
    metrics: ValidationMetrics

class SurveyValidator:
    """Valida respuestas sintéticas contra benchmarks reales."""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        
    def load_benchmark(self, benchmark_id: str) -> pd.DataFrame:
        """Carga un benchmark desde la base de datos."""
        pass
        
    def load_synthetic_results(self, run_id: str) -> pd.DataFrame:
        """Carga resultados sintéticos de una corrida."""
        pass
        
    def calculate_metrics(
        self, 
        synthetic: pd.DataFrame, 
        real: pd.DataFrame
    ) -> ValidationMetrics:
        """Calcula métricas de validación."""
        pass
        
    def compare_with_cadem(
        self, 
        synthetic_results: Dict[str, Dict],
        cadem_wave: str
    ) -> ValidationMetrics:
        """Comparación específica con Cadem."""
        pass
        
    def detect_drift(
        self, 
        historical_errors: List[float],
        threshold: float = 0.05
    ) -> bool:
        """Detecta si hay drift significativo en las respuestas."""
        pass

class ParameterCalibrator:
    """Ajusta parámetros del modelo para minimizar error."""
    
    def __init__(self, validator: SurveyValidator):
        self.validator = validator
        self.param_ranges = {
            'ideology_weight': (0.3, 0.9),
            'trust_modifier': (-0.5, 0.5),
            'economic_sensitivity': (0.2, 0.8),
            'news_exposure_curve': (0.1, 0.6),
            'social_desirability_bias': (0.0, 0.4),
        }
        
    def grid_search(
        self,
        benchmark_id: str,
        n_iterations: int = 100
    ) -> CalibrationResult:
        """Búsqueda por grilla de parámetros óptimos."""
        pass
        
    def bayesian_optimization(
        self,
        benchmark_id: str,
        n_iterations: int = 50
    ) -> CalibrationResult:
        """Optimización bayesiana de parámetros."""
        pass
        
    def save_calibration(
        self, 
        result: CalibrationResult,
        model_version: str
    ) -> str:
        """Guarda calibración en la base de datos."""
        pass
```

### Script de Validación

```python
# python/calibration/validate_against_cadem.py

"""
Script para validar resultados sintéticos contra Cadem.

Uso:
    python validate_against_cadem.py --benchmark cadem_2025_01
"""

import argparse
from validator import SurveyValidator, ParameterCalibrator
from supabase import create_client
import json

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--benchmark', required=True)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--output', default='validation_report.json')
    args = parser.parse_args()
    
    # Conectar a Supabase
    supabase = create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY
    )
    
    # Validar
    validator = SurveyValidator(supabase)
    synthetic = validator.load_synthetic_results(args.run_id)
    real = validator.load_benchmark(args.benchmark)
    
    metrics = validator.calculate_metrics(synthetic, real)
    
    # Generar reporte
    report = {
        'benchmark': args.benchmark,
        'synthetic_run': args.run_id,
        'metrics': {
            'mae': metrics.mae,
            'rmse': metrics.rmse,
            'max_error': metrics.max_error,
            'directionality': metrics.directionality,
        },
        'by_question': metrics.by_segment,
        'passes_threshold': metrics.mae < 0.05,
    }
    
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"Validación completada. MAE: {metrics.mae:.3f}")
    print(f"Reporte guardado en {args.output}")

if __name__ == '__main__':
    main()
```

---

## Pipeline de Ingesta de Benchmarks

### Paso 1: Extraer datos de Cadem

```python
# python/etl/load_cadem.py

"""
Carga datos de encuestas Cadem desde archivos JSON/CSV.

Los datos deben estar en formato:
{
    "wave": "Enero 2025",
    "field_dates": "2025-01-05 a 2025-01-08",
    "sample_size": 1200,
    "margin_of_error": 3.1,
    "results": {
        "aprueba_boric": {
            "aprueba": 35,
            "desaprueba": 55,
            "ns_nc": 10
        },
        ...
    }
}
"""

import json
from supabase import create_client
from datetime import datetime

def load_cadem_json(filepath: str) -> dict:
    """Carga un archivo JSON de Cadem."""
    with open(filepath, 'r') as f:
        return json.load(f)

def save_benchmark_to_supabase(cadem_data: dict, supabase):
    """Guarda benchmark en Supabase."""
    
    benchmark = {
        'source_name': 'Cadem',
        'source_wave': cadem_data['wave'],
        'field_date': cadem_data['field_dates'].split(' a ')[0],
        'methodology_json': {
            'sample_size': cadem_data['sample_size'],
            'margin_of_error': cadem_data['margin_of_error'],
            'method': 'telefonica',
        },
        'results_json': cadem_data['results'],
    }
    
    result = supabase.table('benchmarks').insert(benchmark).execute()
    return result.data[0]['id']

def main():
    import sys
    filepath = sys.argv[1]
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    cadem_data = load_cadem_json(filepath)
    benchmark_id = save_benchmark_to_supabase(cadem_data, supabase)
    
    print(f"Benchmark guardado con ID: {benchmark_id}")

if __name__ == '__main__':
    main()
```

---

## Reporte de Validación

### Template de Reporte

```markdown
# Reporte de Validación - [Fecha]

## Resumen Ejecutivo

| Métrica | Valor | Umbral | Estado |
|---------|-------|--------|--------|
| MAE | 4.2% | < 5% | ✅ |
| RMSE | 5.8% | < 7% | ✅ |
| Max Error | 9.1% | < 10% | ✅ |
| Direccionalidad | 85% | > 80% | ✅ |

## Comparación por Pregunta

| Pregunta | Real | Sintético | Error |
|----------|------|-----------|-------|
| Aprobación Bóric | 35% | 37% | +2pp |
| Aprobación Gobierno | 28% | 26% | -2pp |
| Evaluación País | 15% | 18% | +3pp |

## Comparación por Segmento

| Segmento | MAE |
|----------|-----|
| RM | 3.8% |
| Valparaíso | 4.5% |
| Biobío | 5.2% |
| 18-29 años | 4.1% |
| 30-44 años | 3.9% |
| 45-64 años | 4.8% |
| 65+ años | 5.5% |

## Recomendaciones

1. Ajustar parámetro `ideology_weight` de 0.7 a 0.65
2. Revisar distribución de edad para segmento 65+
3. Incorporar nueva pregunta de tensión cable submarino

## Próximos Pasos

- [ ] Ejecutar recalibración con nuevos parámetros
- [ ] Validar con próxima encuesta Cadem
- [ ] Revisar weights de expansión regional
```

---

## Dashboard de Monitoreo

### Métricas en Tiempo Real

```typescript
// types/monitoring.ts

export interface ValidationDashboard {
  // Estado actual
  currentMae: number;
  currentRmse: number;
  lastCalibrationDate: string;
  
  // Histórico
  maeHistory: { date: string; mae: number }[];
  
  // Por pregunta
  byQuestion: {
    questionCode: string;
    real: number;
    synthetic: number;
    error: number;
  }[];
  
  // Alertas
  alerts: {
    type: 'high_error' | 'drift_detected' | 'calibration_needed';
    message: string;
    severity: 'warning' | 'error';
  }[];
}
```

### Alertas Automáticas

| Condición | Alerta | Acción Recomendada |
|-----------|--------|-------------------|
| MAE > 7% | 🔴 Error alto | Recalibración inmediata |
| MAE > 5% por 2 semanas | 🟡 Drift detectado | Revisar parámetros |
| Max Error > 12% | 🟡 Outlier detectado | Investigar pregunta específica |
| Sin calibración por 30 días | 🟡 Calibración vencida | Ejecutar recalibración |

---

## Checklist de Validación V1

### Antes de Lanzar
- [ ] Cargar al menos 2 benchmarks de Cadem
- [ ] Ejecutar validación inicial
- [ ] MAE < 5% en preguntas clave
- [ ] Documentar parámetros de calibración

### Semanal
- [ ] Comparar con nueva Cadem (si disponible)
- [ ] Revisar alertas de drift
- [ ] Actualizar dashboard de métricas

### Mensual
- [ ] Ejecutar recalibración completa
- [ ] Revisar distribuciones demográficas
- [ ] Actualizar documentación de validación

---

## Límites y Advertencias

### Lo que el sistema NO puede hacer

1. **Predecir elecciones**: No es un modelo predictivo electoral
2. **Reemplazar encuestas reales**: Es una herramienta complementaria
3. **Capturar eventos inesperados**: Depende de eventos cargados manualmente
4. **Opinión de minorías pequeñas**: Muestra limitada para segmentos < 1%

### Advertencias de Uso

> ⚠️ **Este sistema produce simulaciones, no mediciones reales.**
> Los resultados deben interpretarse como aproximaciones calibradas, no como datos empíricos.

> ⚠️ **El error reportado es vs. benchmarks históricos.**
> La precisión para eventos futuros o no medidos es incierta.

> ⚠️ **Los segmentos pequeños tienen mayor incertidumbre.**
> Resultados para grupos < 5% de la población tienen margen de error ampliado.