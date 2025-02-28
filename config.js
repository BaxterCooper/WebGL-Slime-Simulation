// configuration
const MAX_AGENTS = 1_000_000

// default parameters
const agentParameters = {
  count: 100000,
  color: { r: 0.0, g: 1.0, b: 0.5 },
  turnSpeed: 0.2,
}

const sensorParameters = {
  FOV: 0.8,
  size: 0,
  offset: 10.0,
}

const processParameters = {
  fadeSpeed: 0.01,
}

// tweakpane
const pane = new Tweakpane.Pane({
  title: "Parameters",
})

const agentFolder = pane.addFolder({
  title: "Agent Parameters",
  expanded: true,
})

const sensorFolder = pane.addFolder({
  title: "Sensor Parameters",
  expanded: true,
})

const processFolder = pane.addFolder({
  title: "Post-Processing Parameters",
  expanded: true,
})

agentFolder.addInput(agentParameters, "count", { label: "Count", min: 1, max: MAX_AGENTS })
agentFolder.addInput(agentParameters, "color", { label: "Color", color: { type: "float" } })
agentFolder.addInput(agentParameters, "turnSpeed", { label: "Turn Speed", min: 0.0, max: 1.0 })

sensorFolder.addInput(sensorParameters, "FOV", { label: "FOV", min: 0.0, max: 6.24 })
sensorFolder.addInput(sensorParameters, "size", { label: "Size", min: 0, max: 4, step: 1 })
sensorFolder.addInput(sensorParameters, "offset", { label: "Offset", min: 0.0, max: 100.0 })

processFolder.addInput(processParameters, "fadeSpeed", { label: "Fade Speed", min: 0.0, max: 1.0 })

pane.on("change", (event) => {
  agentParameters[event.presetKey] = event.value
})
