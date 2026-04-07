export function getDiseaseList(crop, plantPart) {
  const registry = require('./cropDiseaseRegistry.json');
  const cropData = registry[crop];
  if (!cropData) return ["Unknown"];
  const partData = cropData[plantPart];
  if (!partData) return ["Unknown"];
  return partData;
}

export function getCropList() {
  const registry = require('./cropDiseaseRegistry.json');
  return Object.keys(registry);
}

export function getPartsForCrop(crop) {
  const registry = require('./cropDiseaseRegistry.json');
  const cropData = registry[crop];
  if (!cropData) return [];
  return Object.keys(cropData);
}
