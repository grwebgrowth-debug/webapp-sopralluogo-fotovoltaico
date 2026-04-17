# Payload N8N V1

## Regole
- Tutte le misure sono in centimetri
- Il payload deve essere tipizzato e stabile
- n8n riceve il payload finale dopo la revisione tecnica

## Struttura
```json
{
  "survey": {
    "customer": {
      "first_name": "",
      "last_name": "",
      "phone": "",
      "email": "",
      "address": "",
      "city": "",
      "province": ""
    },
    "inspection": {
      "date": "",
      "technician": "",
      "notes": ""
    }
  },
  "roof": {
    "roof_type": "",
    "surfaces": [
      {
        "surface_id": "",
        "name": "",
        "shape": "",
        "orientation": "",
        "tilt_deg": 0,
        "edge_clearance_cm": 0,
        "notes": "",
        "dimensions": {},
        "obstacles": []
      }
    ]
  },
  "panel_selection": {
    "brand": "",
    "model": ""
  },
  "meta": {
    "source": "webapp_sopralluogo_fotovoltaico_v1",
    "schema_version": "1.0"
  }
}
```

## Esempio ostacolo su triangolo
```json
{
  "obstacle_id": "ost_1",
  "type": "camino",
  "shape": "rect",
  "width_cm": 80,
  "height_cm": 60,
  "reference_mode": "triangle_base_right_h",
  "distance_from_base_right_corner_cm": 140,
  "height_from_base_cm": 210,
  "safety_margin_cm": 30
}
```