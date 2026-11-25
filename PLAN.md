# How Cars Work Build Plan

[Project overview](README.md)

## First milestone

Publish a complete lesson called **From fuel to the front wheels**. A reader opens the vehicle map, selects the engine, steps through the four strokes and traces torque through the transmission, final drive, differential and front wheels. That sequence establishes the lesson format before the site expands.

Use the **2019 Japan-market RAV4 X 2.0 petrol FWD** as the launch reference. Use the **2019 Japan-market RAV4 Hybrid X E-Four** for the first comparison. Document other AWD systems, export-market transmissions and later generations as named variants with their own sources. [Toyota Japan launch specifications](https://global.toyota/en/newsroom/toyota/27541875.html)

## Build sequence

| Milestone | Deliverable | Acceptance criteria |
| --- | --- | --- |
| 1. Vehicle map | Original RAV4-inspired cutaway with engine, transmission, differential and front-wheel hotspots. A text list provides the same navigation. | All four hotspots work by touch and keyboard. Each opens or jumps to the relevant explanation. The selected vehicle is named on the page. |
| 2. Engine lesson | Compact Inkworks figure with a link to the full drafting sheet. Guide the reader through intake, compression, power and exhaust. | Stepping and scrubbing keep the model and phase text in sync. Two crankshaft revolutions cover the four strokes. The stock demo is identified as a generic inline-four until RAV4-specific details are verified. |
| 3. Driveline lesson | SVG torque path with a CVT ratio control and a turning example that shows different front-wheel speeds. | Start and end points of torque flow are visible. The petrol baseline uses Direct Shift-CVT. Simplified ratios or operating behaviour are labelled. |
| 4. Brakes and tyres | Follow pedal input to the calipers. Add an illustrative ABS scenario with wheel-speed traces. | Controls update the diagram and a text equivalent. The scenario explains wheel lock and modulation without predicting real-world stopping distances. |
| 5. Steering and suspension | Let the reader turn the front wheels and move one wheel over a bump. | The scene makes steering, spring travel and damping distinguishable. Component placement is checked against the selected vehicle or identified as generic. |
| 6. Launch | Publish the four lessons with the vehicle map and a guided drive linking them. Add an overview of the remaining systems. | Every live link opens a complete lesson. The full guided route works on a mid-range phone and with keyboard input. Source and asset records are complete. |

## Lesson template

1. Start with one practical question, such as “Why do the front wheels turn at different speeds in a corner?”
2. Locate the system on the vehicle map and label the parts needed to answer the question.
3. Offer one primary interaction with an observable result. Include pause, reset or step controls where applicable.
4. Explain the result in plain language. Put equations, control strategies and detailed specifications in an expandable engineering section.
5. Provide a labelled diagram and a text explanation. Record the source, vehicle applicability and any simplifications.
6. Link to the next system or to a comparison that reuses the same principle.

Keep vehicle specifications separate from reusable lessons. A vehicle record should identify the market, model, production period, grade, engine, transmission, drivetrain and sources. A lesson record should identify its learning objective, vehicle applicability, controls, fallback and references.

## Implementation choices

| Need | Initial approach | When to expand |
| --- | --- | --- |
| Site and viewer | Static pages with semantic HTML, CSS and JavaScript. Use an SVG cutaway as the vehicle map. | Add a site framework when routing and content reuse justify it. Evaluate React Three Fiber when the full-vehicle map needs an orbitable model with selectable parts. |
| Mechanism motion | Embed the static Inkworks kit. Keep animation, phase text and chart controls driven by the same mechanism state. | Create new mechanism files for parts readers need to step through. Use `exploded-view` for assemblies such as differentials and calipers. |
| Flow and signal diagrams | Use SVG and native controls for torque, fluid pressure, wiring and energy flow. | Evaluate Rive when several lessons need reusable authored state animations. |
| Asset delivery | Load 3D when the reader opens a demo. Pause off-screen or inactive scenes and supply a static fallback. | For imported models, clean meshes in Blender and measure before choosing Meshopt geometry or KTX2 texture compression. |
| Quality checks | Use Inkworks smoke tests for its controls and Playwright for complete lesson journeys. Check touch behaviour on a real phone. | Add browser regression checks as new embedded scenes and vehicle variants ship. |

## Expansion roadmap

| Release | Scope | First interaction |
| --- | --- | --- |
| Core systems | Cooling, lubrication, fuel and exhaust, HVAC, 12 V power, sensors and vehicle networks | Trace coolant through the engine and radiator under illustrative cold and warm states. |
| Hybrid and electric | RAV4 Hybrid X E-Four, then a documented plug-in hybrid and a battery-electric example | Select launch, cruise or braking and follow mechanical and electrical energy. Show the Toyota hybrid power split separately from the petrol belt CVT. |
| Safety | Body structure, seat belts, airbags, ABS, stability control and driver assistance | Step through detection, intervention and occupant protection. Label generic sensor overlays and verify fitted equipment by model and grade. |
| Sports cars, supercars and hypercars | Balance and weight transfer, differential behaviour, cooling, aero and composite structures | Compare a documented road car and track-focused car using the same cornering or airflow lesson. |
| Vans, buses and lorries | Payload and axle loads, packaging and accessibility, air brakes and retarders | Move a load fore and aft to see how axle reactions change. Use an illustrative vehicle and document the assumptions. |

## Evidence and launch checks

- [ ] Verify vehicle-specific details against the applicable year, market, grade and production period. Check the Japanese owner's manual alongside Toyota's launch data. [RAV4 manuals](https://manual.toyota.jp/rav4/)
- [ ] Identify simplified timing, forces, thresholds and charts in the lesson. Teach CAN arbitration with an illustrative message bus. Source the restraint system separately before depicting airbag deployment.
- [ ] Use ORNL teardown values for the vehicle that ORNL tested. Start hybrid and EV component explanations with DOE references. [DOE hybrid guide](https://afdc.energy.gov/vehicles/how-do-hybrid-electric-cars-work) · [ORNL Prius teardown](https://www.ornl.gov/publication/evaluation-2010-toyota-prius-hybrid-synergy-drive-system-0)
- [ ] Use documented scenarios for safety and commercial examples. Match the scenario, vehicle and protocol version before citing results. [Euro NCAP occupant protection](https://www.euroncap.com/adult-occupant-protection/) · [Volvo Trucks axle-load guidance](https://www.volvotrucks.us/media/vtna/files/shared/body-builder/manuals/2025/p6700-section-0.pdf) · [Bendix Air Brake Handbook](https://static.nhtsa.gov/odi/inv/2020/INRD-PE20003-10835.pdf)
- [ ] Record asset origin, licence and permissions for public interactive delivery and editing. Prefer original models and diagrams.
- [ ] Confirm all lessons support keyboard use, visible focus, reduced motion and a readable fallback. Check that touch gestures in a demo leave the surrounding page easy to scroll.
- [ ] On a representative phone, measure initial transfer size, time until controls respond and playback smoothness. Record the device and browser so later lessons can be compared against the same baseline.
