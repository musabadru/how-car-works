# How Cars Work

An interactive guide to how modern cars move, turn and stop. Start with a clickable vehicle cutaway, then follow the parts from the pedal to the road. The site is aimed at curious readers with no mechanical background and includes deeper explanations for readers who want the engineering detail.

**Project status:** Planning. See [PLAN.md](PLAN.md) for the build sequence and launch criteria.

## The reference car

The first vehicle is a **2019 Japanese-market Toyota RAV4 X**, with the **2.0-litre M20A-FKS petrol engine**, **Direct Shift-CVT** and **front-wheel drive**. The first comparison is the **2019 Japanese-market RAV4 Hybrid X E-Four**. Each vehicle-specific lesson identifies the year, market, grade and drivetrain so readers can distinguish between variants. [Toyota Japan launch specifications](https://global.toyota/en/newsroom/toyota/27541875.html)

## What readers will do

| Route | Experience |
| --- | --- |
| Explore the car | Select a component on a cutaway and open a lesson about its role. |
| Follow a drive | Start the car, pull away, turn and brake. Each step links to the systems involved. |
| Compare vehicles | Explore what changes when a vehicle is designed for electric driving, track performance, passenger transport or heavy cargo. |

The first four lessons cover **the engine, transmission and driveline, brakes and tyres, and steering and suspension**. Later releases cover electrical systems, cooling, lubrication, HVAC, body structures, safety and driver assistance, hybrid and electric powertrains, sports cars, supercars, hypercars, vans, buses and lorries.

## How the lessons work

Each lesson starts with a question, gives the reader a control to try and explains what changes on screen. Inkworks provides interactive 3D views for mechanisms such as the four-stroke engine. Original SVG diagrams show flows such as torque, hydraulic pressure, electrical signals and hybrid energy. Each interactive includes a readable diagram and explanation for readers who use a keyboard, prefer reduced motion or cannot load WebGL.

## Try the Inkworks engine example

The following runs the upstream Inkworks example locally. It is a generic inline-four demonstration.

```bash
git clone https://github.com/Moh4696/inkworks-skill
cd inkworks-skill/skills/inkworks
python3 kit/serve.py 9081
```

Open the [full drafting sheet](http://localhost:9081/?m=engine&layout=sheet) or the [compact figure](http://localhost:9081/?m=engine&layout=figure).

## References

- Vehicle specifications and equipment by production period. [Toyota Japan launch specifications](https://global.toyota/en/newsroom/toyota/27541875.html) · [Japanese RAV4 manuals](https://manual.toyota.jp/rav4/)
- Examples of teaching motion one concept at a time. [Internal Combustion Engine](https://ciechanow.ski/internal-combustion-engine/) · [Gears](https://ciechanow.ski/gears/)
- Tools for moving mechanisms, exploded assemblies and browser testing. [Inkworks](https://github.com/Moh4696/inkworks-skill) · [Open 3D Skills](https://github.com/Moh4696/open-3d-skills) · [Webapp Testing](https://github.com/anthropics/skills/tree/main/skills/webapp-testing)
