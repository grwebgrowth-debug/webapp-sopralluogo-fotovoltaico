# Modello dati

## Sopralluogo
- id
- customer
- inspection
- roof
- panel_selection
- meta

## Customer
- first_name
- last_name
- phone
- email
- address
- city
- province

## Inspection
- date
- technician
- notes

## Roof
- roof_type
- surfaces[]

## Surface
- surface_id
- name
- shape
- orientation
- tilt_deg
- edge_clearance_cm
- notes
- dimensions
- obstacles[]

## Shapes supportate
- rectangular
- trapezoid
- triangle
- guided_quad

## Dimensions per shape
### rectangular
- width_cm
- height_cm

### trapezoid
- base_bottom_cm
- base_top_cm
- height_cm

### triangle
- base_cm
- height_cm

### guided_quad
- base_bottom_cm
- left_height_cm
- right_height_cm
- top_width_cm

## Obstacle
- obstacle_id
- type
- shape
- safety_margin_cm
- position
- dimensions

### shape = rect
- width_cm
- height_cm

### shape = circle
- diameter_cm

## Position — falde rettangolari/trapezio/guided_quad
- distance_from_base_cm
- distance_from_left_cm

## Position — falde triangolari
- distance_from_base_right_corner_cm
- height_from_base_cm

## Panel selection
- brand
- model